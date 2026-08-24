'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Zone,
  ShirtSize,
  ZoneConfig,
  ZoneImageData,
  CustomizationPayload,
  CartItem,
} from '@/types/customization';

import { Tshirt } from '@/components/TShirtModel';
import { DesignControls, PRESET_COLORS } from '@/components/DesignControls';
import { uploadImageToSupabase } from '@/utils/supabase/supabaseUpload';

const CANVAS_SIZE = 2048;

function TshirtConfiguratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');

  const [activeTab, setActiveTab] = useState<Zone>('front');
  const [fabricColor, setFabricColor] = useState<string>(PRESET_COLORS[0].hex);
  const [selectedSize, setSelectedSize] = useState<ShirtSize>('L');
  const [userInteracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [zones, setZones] = useState<Record<Zone, ZoneConfig>>({
    front: { x: 598, y: 1420, clipWidth: 620, clipHeight: 784 },
    back: { x: 1536, y: 1325, clipWidth: 620, clipHeight: 911 },
    leftSleeve: { x: 625, y: 280, clipWidth: 310, clipHeight: 300 },
    rightSleeve: { x: 1450, y: 280, clipWidth: 330, clipHeight: 300 },
  });

  const [zoneImages, setZoneImages] = useState<Partial<Record<Zone, ZoneImageData>>>({});
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dynamicTexture, setDynamicTexture] = useState<THREE.CanvasTexture | null>(null);

  // Rehydration Logic for Editing
  useEffect(() => {
    if (!editId) return;

    const savedCartRaw = localStorage.getItem('cart_items');
    if (!savedCartRaw) return;

    try {
      const savedCart: CartItem[] = JSON.parse(savedCartRaw);
      const itemToEdit = savedCart.find((item) => item.id === editId);

      if (!itemToEdit) return;

      if (itemToEdit.fabricColor) setFabricColor(itemToEdit.fabricColor);
      if (itemToEdit.size) setSelectedSize(itemToEdit.size as ShirtSize);

      if (itemToEdit.placements && Array.isArray(itemToEdit.placements)) {
        const loadPromises = itemToEdit.placements.map((placement) => {
          return new Promise<{ zone: Zone; data: ZoneImageData } | null>((resolve) => {
            // Destructure directly from the new flat Placement interface
            const { imageUrl, x, y, scale, width, height, zone } = placement;

            if (!imageUrl) return resolve(null);

            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
              resolve({
                zone: zone as Zone,
                data: {
                  element: img,
                  dataUrl: imageUrl,
                  x: x,
                  y: y,
                  scale: scale,
                  customWidth: width,
                  customHeight: height,
                  lockAspectRatio: true,
                },
              });
            };

            img.onerror = () => resolve(null);
            img.src = imageUrl;
          });
        });

        Promise.all(loadPromises).then((results) => {
          const restoredImages: Partial<Record<Zone, ZoneImageData>> = {};
          results.forEach((res) => {
            if (res) {
              restoredImages[res.zone] = res.data;
            }
          });

          setZoneImages((prev) => ({
            ...prev,
            ...restoredImages,
          }));
        });
      }
    } catch (err) {
      console.error('Failed to rehydrate item for editing:', err);
    }
  }, [editId]);

  // Setup Dynamic Texture Canvas
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    liveCanvasRef.current = canvas;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    setDynamicTexture(tex);

    return () => {
      tex.dispose();
    };
  }, []);

  // 2D Canvas Renderer for 3D Material Mapping
  const renderCanvasMap = useCallback(() => {
    const canvas = liveCanvasRef.current;
    const texture = dynamicTexture;
    if (!canvas || !texture) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = fabricColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    (Object.keys(zones) as Zone[]).forEach((key) => {
      const config = zones[key];
      const rx = config.x - config.clipWidth / 2;
      const ry = config.y - config.clipHeight / 2;

      ctx.save();
      ctx.fillStyle = key === activeTab ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(rx, ry, config.clipWidth, config.clipHeight);

      ctx.strokeStyle = key === activeTab ? '#ef4444' : '#94a3b8';
      ctx.lineWidth = key === activeTab ? 6 : 4;
      ctx.setLineDash([16, 12]);
      ctx.strokeRect(rx, ry, config.clipWidth, config.clipHeight);
      ctx.restore();
    });

    (Object.keys(zones) as Zone[]).forEach((key) => {
      const config = zones[key];
      const imgData = zoneImages[key];

      if (imgData && imgData.element) {
        ctx.save();
        const rx = config.x - config.clipWidth / 2;
        const ry = config.y - config.clipHeight / 2;
        ctx.beginPath();
        ctx.rect(rx, ry, config.clipWidth, config.clipHeight);
        ctx.clip();

        const drawW = imgData.customWidth * (imgData.scale ?? 1);
        const drawH = imgData.customHeight * (imgData.scale ?? 1);
        const drawX = config.x + (imgData.x ?? 0) - drawW / 2;
        const drawY = config.y + (imgData.y ?? 0) - drawH / 2;

        ctx.drawImage(imgData.element, drawX, drawY, drawW, drawH);
        ctx.restore();
      }
    });

    texture.needsUpdate = true;
  }, [fabricColor, dynamicTexture, zones, zoneImages, activeTab]);

  useEffect(() => {
    renderCanvasMap();
  }, [renderCanvasMap]);

  const updateZoneConfig = (fields: Partial<ZoneConfig>) => {
    setZones((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...fields,
      },
    }));
  };

  // Local File Upload Handler (Fast Instant Preview, No Network Overhead)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const config = zones[activeTab];
        const aspect = img.width / img.height;

        let initialW = config.clipWidth * 0.8;
        let initialH = initialW / aspect;

        if (initialH > config.clipHeight * 0.8) {
          initialH = config.clipHeight * 0.8;
          initialW = initialH * aspect;
        }

        setZoneImages((prev) => ({
          ...prev,
          [activeTab]: {
            element: img,
            dataUrl,
            x: 0,
            y: 0,
            scale: 1,
            customWidth: Math.round(initialW),
            customHeight: Math.round(initialH),
            lockAspectRatio: true,
          },
        }));
      };
    };
    reader.readAsDataURL(file);
  };

  const updateActiveZone = (fields: Partial<ZoneImageData>) => {
    setZoneImages((prev) => {
      const current = prev[activeTab];
      if (!current) return prev;
      return {
        ...prev,
        [activeTab]: {
          ...current,
          ...fields,
        },
      };
    });
  };

  const handleWidthChange = (newWidth: number) => {
    const current = zoneImages[activeTab];
    if (!current) return;

    if (current.lockAspectRatio && current.customWidth > 0) {
      const ratio = current.customHeight / current.customWidth;
      updateActiveZone({
        customWidth: newWidth,
        customHeight: Math.round(newWidth * ratio),
      });
    } else {
      updateActiveZone({ customWidth: newWidth });
    }
  };

  const handleHeightChange = (newHeight: number) => {
    const current = zoneImages[activeTab];
    if (!current) return;

    if (current.lockAspectRatio && current.customHeight > 0) {
      const ratio = current.customWidth / current.customHeight;
      updateActiveZone({
        customHeight: newHeight,
        customWidth: Math.round(newHeight * ratio),
      });
    } else {
      updateActiveZone({ customHeight: newHeight });
    }
  };

  // Add/Update Cart Action - Triggers Supabase Storage Upload
  const handleSaveCart = async (mode: 'update' | 'add_new') => {
    const configuredZones = (Object.keys(zoneImages) as Zone[]).filter(
      (key) => zoneImages[key] !== undefined
    );

    if (configuredZones.length === 0) {
      alert('Please upload artwork to at least one zone before adding to cart.');
      return;
    }

    try {
      setIsSubmitting(true);

      // Concurrently upload base64 image strings to Supabase and retrieve public CDN URLs
      const placementPromises = configuredZones.map(async (zKey) => {
        const imgData = zoneImages[zKey]!;
        const config = zones[zKey];

        const publicImageUrl = await uploadImageToSupabase(imgData.dataUrl, zKey);

        // Return a clean, flattened placement object that matches CartItem specs directly
        return {
          zone: zKey as string,
          imageUrl: publicImageUrl,
          x: imgData.x ?? 0,
          y: imgData.y ?? 0,
          scale: imgData.scale ?? 1,
          width: imgData.customWidth ?? 400,
          height: imgData.customHeight ?? 400,
          centerX: config?.x ?? 0,
          centerY: config?.y ?? 0,
          clipWidth: config?.clipWidth ?? 0,
          clipHeight: config?.clipHeight ?? 0,
        };
      });

      const uploadedPlacements = await Promise.all(placementPromises);

      // Build a fully typed CustomCartItem payload
      const cartItemPayload = {
        type: 'custom' as const,
        title: 'Custom 3D T-Shirt',
        size: selectedSize,
        fabricColor,
        placements: uploadedPlacements,
        price: 499,
        quantity: 1,
      };

      const existingCart: CartItem[] = JSON.parse(localStorage.getItem('cart_items') || '[]');

      if (mode === 'update' && editId) {
        const itemIndex = existingCart.findIndex((item) => item.id === editId);
        if (itemIndex > -1) {
          existingCart[itemIndex] = {
            ...existingCart[itemIndex],
            ...cartItemPayload,
            id: editId,
          } as CartItem;
        } else {
          existingCart.push({
            id: editId,
            ...cartItemPayload,
          } as CartItem);
        }
      } else {
        existingCart.push({
          id: `cart_${Date.now()}`,
          ...cartItemPayload,
        } as CartItem);
      }

      localStorage.setItem('cart_items', JSON.stringify(existingCart));
      window.dispatchEvent(new Event('cart-updated'));
      router.push('/cart');
    } catch (err: any) {
      console.error('Cart Save Error:', err);
      alert(`Failed to upload images and save item: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-slate-100 overflow-hidden font-sans">
      {/* 3D Canvas Preview Window */}
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
              <Tshirt
                mergedTexture={dynamicTexture}
                activeTab={activeTab}
                userInteracting={userInteracting}
              />
            </Center>
          </Suspense>

          <OrbitControls
            enableZoom={true}
            minDistance={1.9}
            maxDistance={2.5}
            target={[0, 0, 0]}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
          />
        </Canvas>
      </div>

      {/* Control Panel Sidebar */}
      <DesignControls
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        fabricColor={fabricColor}
        setFabricColor={setFabricColor}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        zones={zones}
        activeZoneConfig={zones[activeTab]}
        updateZoneConfig={updateZoneConfig}
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
    <Suspense
      fallback={
        <div className="w-full h-screen bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          Loading Design Studio...
        </div>
      }
    >
      <TshirtConfiguratorContent />
    </Suspense>
  );
}