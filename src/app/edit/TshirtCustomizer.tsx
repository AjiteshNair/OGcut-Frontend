"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter, useSearchParams } from 'next/navigation';

type Zone = 'front' | 'back' | 'left' | 'right';

interface ZoneConfig {
  x: number;
  y: number;
  clipWidth: number;
  clipHeight: number;
}

interface ZoneImageData {
  element: HTMLImageElement;
  dataUrl: string;
  x: number;
  y: number;
  scale: number;
  customWidth: number;
  customHeight: number;
  lockAspectRatio: boolean;
}

export interface CustomizationPayload {
  fabricColor: string;
  placements: Array<{
    zone: Zone;
    image: string; // Base64 Data URL
    coordinates: {
      x: number;
      y: number;
      scale: number;
      width: number;
      height: number;
    };
    printZoneBounds: {
      centerX: number;
      centerY: number;
      clipWidth: number;
      clipHeight: number;
    };
  }>;
}

interface TshirtConfiguratorProps {
  onSubmitCustomization?: (payload: CustomizationPayload) => void;
}

const CANVAS_SIZE = 2048;

const PRESET_COLORS = [
  { name: 'Cream', hex: '#fffdd0' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Khaki', hex: '#c3b091' },
  { name: 'Royal Red', hex: '#ab0613' },
  { name: 'Royal Blue', hex: '#002366' },
];

const ZONE_ROTATIONS: Record<Zone, number> = {
  front: 0,
  back: Math.PI,
  right: -Math.PI / 2,
  left: Math.PI / 2,
};

function Tshirt({
  mergedTexture,
  activeTab,
  userInteracting,
}: {
  mergedTexture: THREE.CanvasTexture | null;
  activeTab: Zone;
  userInteracting: boolean;
}) {
  const gltf = useGLTF('/oversized_t-shirt-optimized.glb');
  const groupRef = useRef<THREE.Group>(null);

  const [isInitialSpinning, setIsInitialSpinning] = useState(true);
  const spinProgress = useRef(0);
  const targetRotationY = useRef(ZONE_ROTATIONS[activeTab]);

  useEffect(() => {
    targetRotationY.current = ZONE_ROTATIONS[activeTab];
  }, [activeTab]);

  useEffect(() => {
    if (gltf && mergedTexture) {
      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.map = mergedTexture;
          child.material.roughness = 1;
          child.material.metalness = 0;
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [gltf, mergedTexture]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (isInitialSpinning) {
      spinProgress.current += delta / 2.0;

      if (spinProgress.current >= 1) {
        spinProgress.current = 1;
        setIsInitialSpinning(false);
        groupRef.current.rotation.y = targetRotationY.current;
        return;
      }

      const t = spinProgress.current;
      const easeOutQuint = 1 - Math.pow(1 - t, 5);
      groupRef.current.rotation.y = targetRotationY.current + easeOutQuint * (Math.PI * 2);
      return;
    }

    if (!userInteracting) {
      const baseRotationY = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotationY.current,
        delta * 4
      );

      const time = state.clock.getElapsedTime();
      const idleSway = Math.sin(time * 1.5) * 0.003;

      groupRef.current.rotation.y = baseRotationY + idleSway;
      groupRef.current.position.y = Math.sin(time * 1.5) * 0.008;
    } else {
      targetRotationY.current = groupRef.current.rotation.y;
    }
  });

  if (!gltf) return null;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

useGLTF.preload('/oversized_t-shirt-optimized.glb');

function TshirtConfiguratorContent({ onSubmitCustomization }: TshirtConfiguratorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');

  const [activeTab, setActiveTab] = useState<Zone>('front');
  const [fabricColor, setFabricColor] = useState<string>(PRESET_COLORS[0].hex);
  const [userInteracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [zones, setZones] = useState<Record<Zone, ZoneConfig>>({
    front: { x: 598, y: 1420, clipWidth: 620, clipHeight: 784 },
    back: { x: 1536, y: 1325, clipWidth: 620, clipHeight: 911 },
    left: { x: 625, y: 280, clipWidth: 310, clipHeight: 300 },
    right: { x: 1450, y: 280, clipWidth: 330, clipHeight: 300 },
  });

  const [zoneImages, setZoneImages] = useState<Partial<Record<Zone, ZoneImageData>>>({});
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dynamicTexture, setDynamicTexture] = useState<THREE.CanvasTexture | null>(null);

  // --- Cart Item Rehydration Logic ---
  useEffect(() => {
    if (!editId) return;

    const savedCartRaw = localStorage.getItem('cart_items');
    if (!savedCartRaw) return;

    try {
      const savedCart = JSON.parse(savedCartRaw);
      const itemToEdit = savedCart.find((item: any) => item.id === editId);

      if (!itemToEdit) return;

      if (itemToEdit.fabricColor) {
        setFabricColor(itemToEdit.fabricColor);
      }

      if (itemToEdit.placements && Array.isArray(itemToEdit.placements)) {
        const restoredImages: Partial<Record<Zone, ZoneImageData>> = {};
        let loaded = 0;

        itemToEdit.placements.forEach((placement: any) => {
          const imageSrc = placement.image || placement.dataUrl;
          if (!imageSrc) return;

          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.src = imageSrc;

          const handleLoadOrError = () => {
            loaded++;
            if (loaded === itemToEdit.placements.length) {
              setZoneImages((prev) => ({
                ...prev,
                ...restoredImages,
              }));
            }
          };

          img.onload = () => {
            const coords = placement.coordinates || placement;
            const zKey = (placement.zone || 'front') as Zone;

            restoredImages[zKey] = {
              element: img,
              dataUrl: imageSrc,
              x: coords.x ?? 0,
              y: coords.y ?? 0,
              scale: coords.scale ?? 1,
              customWidth: coords.width ?? coords.customWidth ?? 400,
              customHeight: coords.height ?? coords.customHeight ?? 400,
              lockAspectRatio: true,
            };

            handleLoadOrError();
          };

          img.onerror = handleLoadOrError;
        });
      }
    } catch (err) {
      console.error('Failed to rehydrate item for editing:', err);
    }
  }, [editId]);

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

        const drawW = imgData.customWidth * imgData.scale;
        const drawH = imgData.customHeight * imgData.scale;
        const drawX = config.x + imgData.x - drawW / 2;
        const drawY = config.y + imgData.y - drawH / 2;

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

  const handleAddToCart = async () => {
    const configuredZones = (Object.keys(zoneImages) as Zone[]).filter(
      (key) => zoneImages[key] !== undefined
    );

    if (configuredZones.length === 0) {
      alert('Please upload artwork to at least one zone before adding to cart.');
      return;
    }

    const payload: CustomizationPayload = {
      fabricColor,
      placements: configuredZones.map((zKey) => {
        const imgData = zoneImages[zKey]!;
        const config = zones[zKey];

        return {
          zone: zKey,
          image: imgData.dataUrl,
          coordinates: {
            x: imgData.x,
            y: imgData.y,
            scale: imgData.scale,
            width: imgData.customWidth,
            height: imgData.customHeight,
          },
          printZoneBounds: {
            centerX: config.x,
            centerY: config.y,
            clipWidth: config.clipWidth,
            clipHeight: config.clipHeight,
          },
        };
      }),
    };

    if (onSubmitCustomization) {
      onSubmitCustomization(payload);
      return;
    }

    try {
      setIsSubmitting(true);
      const existingCart = JSON.parse(localStorage.getItem('cart_items') || '[]');

      // If editing an existing item, replace it in the array
      const newItemId = editId || `cart_${Date.now()}`;
      const updatedCartItem = {
        id: newItemId,
        fabricColor: payload.fabricColor,
        placements: payload.placements
      };

      if (editId) {
        const itemIndex = existingCart.findIndex((item: any) => item.id === editId);
        if (itemIndex > -1) {
          existingCart[itemIndex] = updatedCartItem;
        } else {
          existingCart.push(updatedCartItem);
        }
      } else {
        existingCart.push(updatedCartItem);
      }

      localStorage.setItem('cart_items', JSON.stringify(existingCart));
      router.push('/cart');
    } catch (err: any) {
      console.error('Add to Cart Error:', err);
      alert(`Failed to add item to cart: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeZoneConfig = zones[activeTab];
  const activeZoneImage = zoneImages[activeTab];

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-slate-100 overflow-hidden font-sans">
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

      <div className="w-full lg:w-1/2 h-[60vh] lg:h-full bg-white flex flex-col overflow-y-auto z-10">
        <div className="p-6 space-y-6 max-w-md mx-auto w-full pb-28">
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Design Studio</h1>
            <p className="text-xs text-slate-500">
              Configure fabric colors, adjust UV base print areas, and align graphics.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">1. Select Shirt Color</label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setFabricColor(c.hex)}
                  title={c.name}
                  className={`h-10 rounded-lg border-2 transition-all flex flex-col items-center justify-center p-1 ${
                    fabricColor === c.hex ? 'border-slate-900 scale-105 shadow-md' : 'border-transparent hover:scale-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  <span
                    className={`text-[9px] font-extrabold uppercase ${
                      c.name === 'Cream' ? 'text-slate-800' : 'text-white'
                    }`}
                  >
                    {c.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">2. Placement Area</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(zones) as Zone[]).map((zoneKey) => (
                <button
                  key={zoneKey}
                  onClick={() => setActiveTab(zoneKey)}
                  className={`py-2 px-1 text-[11px] font-bold rounded-lg transition-all uppercase ${
                    activeTab === zoneKey
                      ? 'bg-slate-900 text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {zoneKey.replace(/Sleeve/, ' Slv')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              3. Upload Design ({activeTab.toUpperCase()})
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
            />
          </div>

          <div className="space-y-4 bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                4. Base Print Area Calibration ({activeTab.toUpperCase()})
              </h3>
              <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-semibold">
                UV Grid Config
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs text-amber-800 font-medium mb-1">
                <span>Print Area Center X:</span>
                <span className="font-mono font-bold">{activeZoneConfig.x}px</span>
              </div>
              <input
                type="range"
                min="0"
                max={CANVAS_SIZE}
                step="5"
                value={activeZoneConfig.x}
                onChange={(e) => updateZoneConfig({ x: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-amber-800 font-medium mb-1">
                <span>Print Area Center Y:</span>
                <span className="font-mono font-bold">{activeZoneConfig.y}px</span>
              </div>
              <input
                type="range"
                min="0"
                max={CANVAS_SIZE}
                step="5"
                value={activeZoneConfig.y}
                onChange={(e) => updateZoneConfig({ y: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-amber-800 font-medium mb-1">
                <span>Max Print Width Limit:</span>
                <span className="font-mono font-bold">{activeZoneConfig.clipWidth}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="10"
                value={activeZoneConfig.clipWidth}
                onChange={(e) => updateZoneConfig({ clipWidth: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-amber-800 font-medium mb-1">
                <span>Max Print Height Limit:</span>
                <span className="font-mono font-bold">{activeZoneConfig.clipHeight}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="1200"
                step="10"
                value={activeZoneConfig.clipHeight}
                onChange={(e) => updateZoneConfig({ clipHeight: parseInt(e.target.value, 10) })}
                className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <label className="block text-xs font-bold text-slate-700">
              Artwork Layout & Boundary Preview
            </label>
            <div className="relative w-full h-44 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center select-none">
              <div
                style={{
                  width: `${(activeZoneConfig.clipWidth / CANVAS_SIZE) * 100 * 2.5}%`,
                  height: `${(activeZoneConfig.clipHeight / CANVAS_SIZE) * 100 * 2.5}%`,
                }}
                className="absolute border border-dashed border-red-400 bg-red-500/5 rounded-lg pointer-events-none flex items-center justify-center"
              >
                <span className="text-[10px] text-red-400 font-semibold uppercase">Print Zone</span>
              </div>

              {activeZoneImage ? (
                <div
                  style={{
                    transform: `translate(${activeZoneImage.x / 4}px, ${activeZoneImage.y / 4}px) scale(${activeZoneImage.scale})`,
                  }}
                  className="transition-transform duration-75 ease-out pointer-events-none"
                >
                  <img
                    src={activeZoneImage.element.src}
                    alt="Design Preview"
                    style={{
                      width: `${activeZoneImage.customWidth / 4}px`,
                      height: `${activeZoneImage.customHeight / 4}px`,
                    }}
                    className="object-contain"
                  />
                </div>
              ) : (
                <span className="text-xs text-slate-400 z-10">Upload artwork to view placement</span>
              )}
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Artwork Precision Controls
            </h3>

            <div>
              <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Position Left / Right:</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeZoneImage ? Math.round(activeZoneImage.x) : 0}px
                </span>
              </div>
              <input
                type="range"
                min="-300"
                max="300"
                step="1"
                disabled={!activeZoneImage}
                value={activeZoneImage?.x || 0}
                onChange={(e) => updateActiveZone({ x: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Position Up / Down:</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeZoneImage ? Math.round(activeZoneImage.y) : 0}px
                </span>
              </div>
              <input
                type="range"
                min="-300"
                max="300"
                step="1"
                disabled={!activeZoneImage}
                value={activeZoneImage?.y || 0}
                onChange={(e) => updateActiveZone({ y: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Zoom / Scale Factor:</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeZoneImage ? activeZoneImage.scale.toFixed(2) : 1}x
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="3"
                step="0.05"
                disabled={!activeZoneImage}
                value={activeZoneImage?.scale || 1}
                onChange={(e) => updateActiveZone({ scale: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Explicit Dimensions</span>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!activeZoneImage}
                    checked={activeZoneImage?.lockAspectRatio ?? true}
                    onChange={(e) => updateActiveZone({ lockAspectRatio: e.target.checked })}
                    className="rounded text-slate-900 focus:ring-slate-900 accent-slate-900 disabled:opacity-40"
                  />
                  Lock Ratio
                </label>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                  <span>Width:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeZoneImage ? activeZoneImage.customWidth : 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="1"
                  disabled={!activeZoneImage}
                  value={activeZoneImage?.customWidth || 100}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                  <span>Height:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {activeZoneImage ? activeZoneImage.customHeight : 0}px
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="1"
                  disabled={!activeZoneImage}
                  value={activeZoneImage?.customHeight || 100}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding to Cart...' : '🛒 Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TshirtConfigurator(props: TshirtConfiguratorProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wider">
          Loading Design Studio...
        </div>
      }
    >
      <TshirtConfiguratorContent {...props} />
    </Suspense>
  );
}