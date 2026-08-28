'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter, useSearchParams } from 'next/navigation';

import { Zone, ShirtSize, ZoneConfig, ZoneImageData, CartItem } from '@/types/customization';
import { Tshirt } from '@/components/TShirtModel';
import { DesignControls, PRESET_COLORS } from '@/components/DesignControls';
import { uploadImageToSupabase } from '@/utils/supabase/supabaseUpload';

const CANVAS_SIZE = 2048;
const INITIAL_ZONES: Record<Zone, ZoneConfig> = {
  front: { x: 598, y: 1420, clipWidth: 620, clipHeight: 784 },
  back: { x: 1536, y: 1325, clipWidth: 620, clipHeight: 911 },
  left: { x: 625, y: 280, clipWidth: 310, clipHeight: 300 },
  right: { x: 1450, y: 280, clipWidth: 330, clipHeight: 300 },
};

function TshirtConfiguratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');

  const [activeTab, setActiveTab] = useState<Zone>('front');
  const [fabricColor, setFabricColor] = useState<string>(PRESET_COLORS[0].hex);
  const [selectedSize, setSelectedSize] = useState<ShirtSize>('L');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [zones, setZones] = useState<Record<Zone, ZoneConfig>>(INITIAL_ZONES);
  const [zoneImages, setZoneImages] = useState<Partial<Record<Zone, ZoneImageData>>>({});
  
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dynamicTexture, setDynamicTexture] = useState<THREE.CanvasTexture | null>(null);

  // Setup Dynamic Texture Canvas once on mount
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = CANVAS_SIZE;
    liveCanvasRef.current = canvas;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    setDynamicTexture(tex);
    return () => tex.dispose();
  }, []);

  // Rehydration Logic for Editing
  useEffect(() => {
    if (!editId) return;
    try {
      const savedCart: CartItem[] = JSON.parse(localStorage.getItem('cart_items') || '[]');
      const item = savedCart.find((i) => i.id === editId);
      if (!item) return;

      if (item.fabricColor) setFabricColor(item.fabricColor);
      if (item.size) setSelectedSize(item.size as ShirtSize);

      if (Array.isArray(item.placements) && item.placements.length > 0) {
        Promise.all(
          item.placements.map(
            (p: any) =>
              new Promise<{ zone: Zone; data: ZoneImageData } | null>((resolve) => {
                const url = p.imageUrl || p.imgurl;
                if (!url) return resolve(null);

                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                  // Normalize zone string (e.g. 'front', 'back', 'left', 'rightSleeve')
                  let rawPlace = p.place || p.zone || 'front';
                  let zoneKey: Zone = 'front';
                  if (rawPlace === 'front') zoneKey = 'front';
                  else if (rawPlace === 'back') zoneKey = 'back';
                  else if (rawPlace === 'left') zoneKey = 'left';
                  else if (rawPlace === 'right') zoneKey = 'right';

                  const cfg = INITIAL_ZONES[zoneKey] || INITIAL_ZONES.front;
                  const aspect = img.width / img.height;
                  
                  let defaultW = cfg.clipWidth * 0.5;
                  let defaultH = defaultW / aspect;
                  if (defaultH > cfg.clipHeight * 0.5) {
                    defaultH = cfg.clipHeight * 0.5;
                    defaultW = defaultH * aspect;
                  }

                  const customWidth = p.width ?? p.customWidth ?? Math.round(defaultW);
                  const customHeight = p.height ?? p.customHeight ?? Math.round(defaultH);

                  resolve({
                    zone: zoneKey,
                    data: {
                      element: img,
                      dataUrl: url,
                      x: p.xvalue ?? p.x ?? 0,
                      y: p.yvalue ?? p.y ?? 0,
                      scale: p.zoom ?? p.scale ?? 1,
                      customWidth,
                      customHeight,
                      lockAspectRatio: true,
                    },
                  });
                };
                img.onerror = () => resolve(null);
                img.src = url;
              })
          )
        ).then((results) => {
          const restored: Partial<Record<Zone, ZoneImageData>> = {};
          results.forEach((r) => {
            if (r) restored[r.zone] = r.data;
          });
          if (Object.keys(restored).length > 0) {
            setZoneImages(restored);
          }
        });
      }
    } catch (err) {
      console.error('Rehydration failed:', err);
    }
  }, [editId]);

  // 2D Canvas Renderer for 3D Material Mapping
  const renderCanvasMap = useCallback(() => {
    const canvas = liveCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !dynamicTexture || !ctx) return;

    ctx.fillStyle = fabricColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    (Object.keys(zones) as Zone[]).forEach((key) => {
      const cfg = zones[key];
      const rx = cfg.x - cfg.clipWidth / 2;
      const ry = cfg.y - cfg.clipHeight / 2;
      const isActive = key === activeTab;

      ctx.save();
      ctx.fillStyle = isActive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(rx, ry, cfg.clipWidth, cfg.clipHeight);
      ctx.strokeStyle = isActive ? '#ef4444' : '#94a3b8';
      ctx.lineWidth = isActive ? 6 : 4;
      ctx.setLineDash([16, 12]);
      ctx.strokeRect(rx, ry, cfg.clipWidth, cfg.clipHeight);
      ctx.restore();

      const imgData = zoneImages[key];
      if (imgData?.element) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, cfg.clipWidth, cfg.clipHeight);
        ctx.clip();

        const scale = imgData.scale ?? 1;
        const w = imgData.customWidth * scale;
        const h = imgData.customHeight * scale;
        const drawX = cfg.x + (imgData.x ?? 0) - w / 2;
        const drawY = cfg.y + (imgData.y ?? 0) - h / 2;

        ctx.drawImage(imgData.element, drawX, drawY, w, h);
        ctx.restore();
      }
    });

    dynamicTexture.needsUpdate = true;
  }, [fabricColor, dynamicTexture, zones, zoneImages, activeTab]);

  useEffect(() => {
    renderCanvasMap();
  }, [renderCanvasMap]);

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const cfg = zones[activeTab];
        const aspect = img.width / img.height;
        let w = cfg.clipWidth * 0.5;
        let h = w / aspect;
        if (h > cfg.clipHeight * 0.5) {
          h = cfg.clipHeight * 0.5;
          w = h * aspect;
        }
        setZoneImages((prev) => ({
          ...prev,
          [activeTab]: {
            element: img,
            dataUrl,
            x: 0,
            y: 0,
            scale: 1,
            customWidth: Math.round(w),
            customHeight: Math.round(h),
            lockAspectRatio: true,
          },
        }));
      };
    };
    reader.readAsDataURL(file);
  };

  const updateActiveZone = (fields: Partial<ZoneImageData>) => {
    setZoneImages((prev) => {
      const cur = prev[activeTab];
      if (!cur) return prev;
      return { ...prev, [activeTab]: { ...cur, ...fields } };
    });
  };

  const handleWidthChange = (newWidth: number) => {
    const cur = zoneImages[activeTab];
    if (!cur) return;
    const h = cur.lockAspectRatio && cur.customWidth > 0 ? Math.round(newWidth * (cur.customHeight / cur.customWidth)) : cur.customHeight;
    updateActiveZone({ customWidth: newWidth, customHeight: h });
  };

  const handleHeightChange = (newHeight: number) => {
    const cur = zoneImages[activeTab];
    if (!cur) return;
    const w = cur.lockAspectRatio && cur.customHeight > 0 ? Math.round(newHeight * (cur.customWidth / cur.customHeight)) : cur.customWidth;
    updateActiveZone({ customHeight: newHeight, customWidth: w });
  };

  const handleSaveCart = async () => {
    const configuredZones = (Object.keys(zoneImages) as Zone[]).filter((k) => zoneImages[k]);
    if (configuredZones.length === 0) {
      alert('Please upload artwork to at least one zone before adding to cart.');
      return;
    }

    try {
      setIsSubmitting(true);
      const placements = await Promise.all(
        configuredZones.map(async (zKey) => {
          const imgData = zoneImages[zKey]!;
          // If the dataUrl is already an external URL, avoid uploading again
          const finalUrl = imgData.dataUrl.startsWith('http') 
            ? imgData.dataUrl 
            : await uploadImageToSupabase(imgData.dataUrl, zKey);

          return {
            place: zKey.toLowerCase(),
            imgurl: finalUrl,
            imageUrl: finalUrl,
            xvalue: Number(imgData.x ?? 0),
            yvalue: Number(imgData.y ?? 0),
            zoom: Number(imgData.scale ?? 1),
            width: imgData.customWidth,
            height: imgData.customHeight,
          };
        })
      );

      const cartItemPayload = {
        pid: 1,
        type: 'custom',
        title: 'Custom 3D T-Shirt',
        size: selectedSize,
        fabricColor,
        placements,
        quantity: 1,
      };

      const existingCart: CartItem[] = JSON.parse(localStorage.getItem('cart_items') || '[]');
      const targetId = editId || `cart_${Date.now()}`;
      const itemIndex = existingCart.findIndex((i) => i.id === targetId);
      const newItem = { id: targetId, ...cartItemPayload };

      if (itemIndex > -1) existingCart[itemIndex] = newItem as CartItem;
      else existingCart.push(newItem as CartItem);

      localStorage.setItem('cart_items', JSON.stringify(existingCart));
      window.dispatchEvent(new Event('cart-updated'));
      router.push('/cart');
    } catch (err: any) {
      alert(`Failed to save item: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-slate-100 overflow-hidden font-sans">
      {/* 3D Preview */}
      <div className="w-full lg:w-1/2 h-[40vh] lg:h-full relative bg-slate-200 shrink-0">
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-md text-xs font-bold text-slate-800 shadow z-10 pointer-events-none">
          3D Live Preview
        </div>
        <Canvas camera={{ position: [0, 0.8, 2], fov: 45 }} style={{ width: '100%', height: '100%' }}>
          <color attach="background" args={['#f8fafc']} />
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.4} />
          <Suspense fallback={null}>
            <Center top position={[0, -0.1, 0]}>
              <Tshirt mergedTexture={dynamicTexture} activeTab={activeTab} userInteracting={false} />
            </Center>
          </Suspense>
          <OrbitControls enableZoom minDistance={1.9} maxDistance={2.5} target={[0, 0, 0]} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.8} />
        </Canvas>
      </div>

      {/* Sidebar Controls */}
      <DesignControls
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fabricColor={fabricColor}
        setFabricColor={setFabricColor}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        zones={zones}
        activeZoneConfig={zones[activeTab]}
        updateZoneConfig={(fields) => setZones((p) => ({ ...p, [activeTab]: { ...p[activeTab], ...fields } }))}
        activeZoneImage={zoneImages[activeTab]}
        handleFileUpload={handleFileUpload}
        updateActiveZone={updateActiveZone}
        handleWidthChange={handleWidthChange}
        handleHeightChange={handleHeightChange}
        handleSaveCart={handleSaveCart}
        isSubmitting={isSubmitting}
        editId={editId}
        canvasSize={CANVAS_SIZE}
      />
    </div>
  );
}

export default function TshirtConfigurator() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Design Studio...</div>}>
      <TshirtConfiguratorContent />
    </Suspense>
  );
}