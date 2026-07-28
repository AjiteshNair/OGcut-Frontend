"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';

type Zone = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

interface ZoneConfig {
  x: number;
  y: number;
  clipWidth: number;
  clipHeight: number;
}

interface ZoneImageData {
  element: HTMLImageElement;
  x: number; // Offset relative to zone center
  y: number;
  scale: number;
  customWidth: number;
  customHeight: number;
  lockAspectRatio: boolean;
}

const CANVAS_SIZE = 2048;

// Preset Color Options
const PRESET_COLORS = [
  { name: 'Cream', hex: '#fffdd0' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Khaki', hex: '#c3b091' },
  { name: 'Royal Red', hex: '#ab0613' },
  { name: 'Royal Blue', hex: '#002366' },
];

// --- 3D T-SHIRT MODEL ---
function Tshirt({ mergedTexture }: { mergedTexture: THREE.CanvasTexture | null }) {
  const gltf = useGLTF('/oversized_t-shirt-optimized.glb');
  const groupRef = useRef<THREE.Group>(null);

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

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0 * delta;
    }
  });

  if (!gltf) return null;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

useGLTF.preload('/shirt_1-optimized.glb');

// --- MAIN CONFIGURATOR WORKSPACE ---
export default function TshirtConfigurator() {
  const [activeTab, setActiveTab] = useState<Zone>('front');
  const [fabricColor, setFabricColor] = useState<string>(PRESET_COLORS[0].hex);

  // Calibrated Base Print Area Boundaries (Editable via Sliders)
  const [zones, setZones] = useState<Record<Zone, ZoneConfig>>({
    front: { x: 598, y: 1420, clipWidth: 620, clipHeight: 784 },
    back: { x: 1536, y: 1325, clipWidth: 620, clipHeight: 911 },
    leftSleeve: { x: 625, y: 280, clipWidth: 310, clipHeight: 300 },
    rightSleeve: { x: 1450, y: 280, clipWidth: 330, clipHeight: 300 },
  });

  const [zoneImages, setZoneImages] = useState<Partial<Record<Zone, ZoneImageData>>>({});

  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dynamicTexture, setDynamicTexture] = useState<THREE.CanvasTexture | null>(null);

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

  // --- RENDER TEXTURE MAP ---
  const renderCanvasMap = useCallback(() => {
    const canvas = liveCanvasRef.current;
    const texture = dynamicTexture;
    if (!canvas || !texture) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Base Fabric Color
    ctx.fillStyle = fabricColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Visible Printable Bounds Rectangles
    (Object.keys(zones) as Zone[]).forEach((key) => {
      const config = zones[key];
      const rx = config.x - config.clipWidth / 2;
      const ry = config.y - config.clipHeight / 2;

      ctx.save();
      
      // Light background tint to identify the area
      ctx.fillStyle = key === activeTab ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(rx, ry, config.clipWidth, config.clipHeight);

      // Dashed boundary stroke
      ctx.strokeStyle = key === activeTab ? '#ef4444' : '#94a3b8';
      ctx.lineWidth = key === activeTab ? 6 : 4;
      ctx.setLineDash([16, 12]);
      ctx.strokeRect(rx, ry, config.clipWidth, config.clipHeight);

      ctx.restore();
    });

    // 3. Render Artwork
    (Object.keys(zones) as Zone[]).forEach((key) => {
      const config = zones[key];
      const imgData = zoneImages[key];

      if (imgData && imgData.element) {
        ctx.save();

        // Clipping Mask around configured base print area box
        const rx = config.x - config.clipWidth / 2;
        const ry = config.y - config.clipHeight / 2;
        ctx.beginPath();
        ctx.rect(rx, ry, config.clipWidth, config.clipHeight);
        ctx.clip();

        // Calculate final width and height using scales/dimensions
        const drawW = imgData.customWidth * imgData.scale;
        const drawH = imgData.customHeight * imgData.scale;

        // Draw centered on target region
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

  // --- UPDATE BASE PRINT ZONE BOUNDARIES ---
  const updateZoneConfig = (fields: Partial<ZoneConfig>) => {
    setZones((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...fields,
      },
    }));
  };

  // --- HANDLE FILE UPLOAD ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
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

  // --- CONTROL UPDATERS ---
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

  const activeZoneConfig = zones[activeTab];
  const activeZoneImage = zoneImages[activeTab];

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* 1. 3D VIEWPORT CONTAINER */}
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
              <Tshirt mergedTexture={dynamicTexture} />
            </Center>
          </Suspense>

          <OrbitControls enableZoom={true} minDistance={1.2} maxDistance={5} target={[0, 0, 0]} />
        </Canvas>
      </div>

      {/* 2. SCROLLABLE EDITING SIDEBAR */}
      <div className="w-full lg:w-1/2 h-[60vh] lg:h-full bg-white flex flex-col overflow-y-auto z-10">
        <div className="p-6 space-y-6 max-w-md mx-auto w-full pb-70">
          
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Design Studio</h1>
            <p className="text-xs text-slate-500">Configure fabric colors, adjust UV base print areas, and align graphics.</p>
          </div>

          {/* PRESET FABRIC COLORS */}
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
                  <span className={`text-[9px] font-extrabold uppercase ${c.name === 'Cream' ? 'text-slate-800' : 'text-white'}`}>
                    {c.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ZONE SELECTION TABS */}
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

          {/* FILE UPLOAD */}
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

          {/* BASE PRINT AREA CALIBRATION (UV SLIDERS) */}
          <div className="space-y-4 bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                4. Base Print Area Calibration ({activeTab.toUpperCase()})
              </h3>
              <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-semibold">UV Grid Config</span>
            </div>

            {/* BASE ZONE X CENTER */}
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

            {/* BASE ZONE Y CENTER */}
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

            {/* BASE ZONE CLIP WIDTH */}
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

            {/* BASE ZONE CLIP HEIGHT */}
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

          {/* PREVIEW CONTAINER */}
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <label className="block text-xs font-bold text-slate-700">Artwork Layout & Boundary Preview</label>
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

          {/* POSITION & SIZING CONTROLS */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Artwork Precision Controls</h3>

            {/* HORIZONTAL POSITION */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Position Left / Right:</span>
                <span className="font-mono font-bold text-slate-900">{activeZoneImage ? Math.round(activeZoneImage.x) : 0}px</span>
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

            {/* VERTICAL POSITION */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Position Up / Down:</span>
                <span className="font-mono font-bold text-slate-900">{activeZoneImage ? Math.round(activeZoneImage.y) : 0}px</span>
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

            {/* SIZING OPTION 1: SCALE */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Zoom / Scale Factor:</span>
                <span className="font-mono font-bold text-slate-900">{activeZoneImage ? activeZoneImage.scale.toFixed(2) : 1}x</span>
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

            {/* SIZING OPTION 2: EXPLICIT DIMENSIONS */}
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

              {/* WIDTH SLIDER */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                  <span>Width:</span>
                  <span className="font-mono font-bold text-slate-900">{activeZoneImage ? activeZoneImage.customWidth : 0}px</span>
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

              {/* HEIGHT SLIDER */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                  <span>Height:</span>
                  <span className="font-mono font-bold text-slate-900">{activeZoneImage ? activeZoneImage.customHeight : 0}px</span>
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

        </div>
      </div>

    </div>
  );
}