"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Stage, OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';

type Zone = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

interface ZoneConfig {
  x: number;
  y: number;
  clipWidth: number;
  clipHeight: number;
}

const CANVAS_SIZE = 2048;

const ZONE_COLORS: Record<Zone, { stroke: string; fill: string; fillActive: string }> = {
  front: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.08)', fillActive: 'rgba(59, 130, 246, 0.25)' },
  back: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.08)', fillActive: 'rgba(16, 185, 129, 0.25)' },
  leftSleeve: { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.08)', fillActive: 'rgba(139, 92, 246, 0.25)' },
  rightSleeve: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.08)', fillActive: 'rgba(245, 158, 11, 0.25)' },
};

// --- 3D T-SHIRT RENDER ---
interface TshirtProps {
  mergedTexture: THREE.CanvasTexture | null;
}

function Tshirt({ mergedTexture }: TshirtProps) {
  const gltf = useGLTF('/oversized_t-shirt.glb');
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (gltf && mergedTexture) {
      gltf.scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.map = mergedTexture;
          child.material.roughness = 0.6;
          child.material.metalness = 0.1;
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [gltf, mergedTexture]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.15 * delta;
    }
  });

  if (!gltf) return null;

  return (
    // Reset back to normal. The <Center> wrapper in the canvas will align this perfectly!
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={gltf.scene} />
    </group>
  );
}

useGLTF.preload('/oversized_t-shirt.glb');

// --- MAIN CONFIGURATOR WORKSPACE ---
export default function TshirtConfigurator() {
  const [activeTab, setActiveTab] = useState<Zone>('front');
  const [fabricColor, setFabricColor] = useState<string>('#ffffff');

  // Move ZONES into state so they are dynamic and editable!
  const [zones, setZones] = useState<Record<Zone, ZoneConfig>>({
    front: { x: 512, y: 1024, clipWidth: 620, clipHeight: 820 },
    back: { x: 1536, y: 1024, clipWidth: 620, clipHeight: 820 },
    leftSleeve: { x: 512, y: 320, clipWidth: 420, clipHeight: 420 },
    rightSleeve: { x: 1536, y: 320, clipWidth: 420, clipHeight: 420 },
  });

  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dynamicTexture, setDynamicTexture] = useState<THREE.CanvasTexture | null>(null);

  // Initialize Canvas
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

  // --- DRAW COORDINATES ---
  const renderCanvasMap = useCallback(() => {
    const canvas = liveCanvasRef.current;
    const texture = dynamicTexture;
    if (!canvas || !texture) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Paint Fabric base color
    ctx.fillStyle = fabricColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Guide
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
      ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Paint Alignment boundaries
    Object.keys(zones).forEach((key) => {
      const zoneKey = key as Zone;
      const config = zones[zoneKey];
      const isSelected = activeTab === zoneKey;
      const colors = ZONE_COLORS[zoneKey];

      const rx = config.x - config.clipWidth / 2;
      const ry = config.y - config.clipHeight / 2;

      ctx.strokeStyle = colors.stroke;
      ctx.lineWidth = isSelected ? 12 : 4;
      ctx.strokeRect(rx, ry, config.clipWidth, config.clipHeight);

      ctx.fillStyle = isSelected ? colors.fillActive : colors.fill;
      ctx.fillRect(rx, ry, config.clipWidth, config.clipHeight);

      // Render Text Coordinates
      ctx.fillStyle = colors.stroke;
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(`${zoneKey.toUpperCase()}`, rx + 25, ry + 60);

      ctx.font = '28px monospace';
      ctx.fillText(`W: ${config.clipWidth}px | H: ${config.clipHeight}px`, rx + 25, ry + 110);
      ctx.fillText(`CX: ${config.x} | CY: ${config.y}`, rx + 25, ry + 150);
    });

    texture.needsUpdate = true;
  }, [fabricColor, activeTab, dynamicTexture, zones]);

  useEffect(() => {
    renderCanvasMap();
  }, [renderCanvasMap]);

  // Helper function to update zone dimensions on slider drag
  const handleZoneChange = (field: keyof ZoneConfig, value: number) => {
    setZones((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-slate-50 overflow-x-hidden font-sans">
      
      {/* LEFT PANEL: 3D VIEWPORT */}
<div className="w-full lg:w-1/2 lg:max-w-[50%] h-[50vh] lg:h-screen bg-slate-100 relative border-b lg:border-b-0 lg:border-r border-slate-200 flex-shrink-0">
  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-md text-xs font-bold text-slate-800 shadow z-10">
    3D Live Mapping Preview
  </div>
  
  <Canvas camera={{ position: [0, 0.8, 2], fov: 45 }} style={{ width: '100%', height: '100%' }}>
    <color attach="background" args={['#f8fafc']} />
    
    <ambientLight intensity={0.7} />
    <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
    <directionalLight position={[-5, 5, -5]} intensity={0.4} />
    <pointLight position={[0, 3, 2]} intensity={0.6} />

    <Suspense fallback={null}>
      {/* `
        The "top" property shifts the center of the model's bounding box. 
        By shifting its center relative to the origin, it centers the shirt in your viewport!
      */}
      <Center top position={[0, -0.1, 0]}>
        <Tshirt mergedTexture={dynamicTexture} />
      </Center>
    </Suspense>`

    {/* Since the model is now perfectly centered, the controls orbit cleanly */}
    <OrbitControls 
      enableZoom={true} 
      minDistance={1.5} 
      maxDistance={6}
      target={[0, 0, 0]} 
    />
  </Canvas>
</div>

      {/* RIGHT PANEL: INTERACTIVE CONFIGURATOR */}
      <div className="w-full lg:w-1/2 flex-1 min-w-[320px] h-auto lg:h-screen flex flex-col p-6 overflow-y-auto bg-white justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
            Oversized T-Shirt Studio
          </h1>
          <p className="text-xs text-slate-500 mb-6">
            Drag the sliders below to move and resize the placement box boundaries in real-time.
          </p>

          {/* FABRIC COLOR */}
          <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-3">T-Shirt Fabric Base Color</label>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={fabricColor} 
                onChange={(e) => setFabricColor(e.target.value)}
                className="w-12 h-12 rounded-lg border border-slate-300 cursor-pointer overflow-hidden p-0"
              />
              <span className="text-sm font-mono text-slate-600 uppercase font-bold">{fabricColor}</span>
            </div>
          </div>

          {/* PLACEMENT TABS */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-3">Select Zone Boundary</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(zones) as Zone[]).map((zoneKey) => (
                <button
                  key={zoneKey}
                  onClick={() => setActiveTab(zoneKey)}
                  style={{ borderColor: activeTab === zoneKey ? ZONE_COLORS[zoneKey].stroke : '#e2e8f0' }}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border-2 transition-all uppercase ${
                    activeTab === zoneKey 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {zoneKey.replace(/Sleeve/, ' Slv')}
                </button>
              ))}
            </div>
          </div>

          {/* INTERACTIVE CALIBRATION CONTROLS (SLIDERS) */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 capitalize flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: ZONE_COLORS[activeTab].stroke }}
              />
              Calibrating {activeTab} Zone
            </h3>

            <div className="space-y-4">
              {/* SLIDER: X POSITION */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Center Target X:</span>
                  <span className="font-mono">{zones[activeTab].x}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2048"
                  value={zones[activeTab].x}
                  onChange={(e) => handleZoneChange('x', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                />
              </div>

              {/* SLIDER: Y POSITION */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Center Target Y:</span>
                  <span className="font-mono">{zones[activeTab].y}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2048"
                  value={zones[activeTab].y}
                  onChange={(e) => handleZoneChange('y', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                />
              </div>

              {/* SLIDER: BOUNDING WIDTH */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Bounding Width:</span>
                  <span className="font-mono">{zones[activeTab].clipWidth}px</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  value={zones[activeTab].clipWidth}
                  onChange={(e) => handleZoneChange('clipWidth', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                />
              </div>

              {/* SLIDER: BOUNDING HEIGHT */}
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>Bounding Height:</span>
                  <span className="font-mono">{zones[activeTab].clipHeight}px</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1200"
                  value={zones[activeTab].clipHeight}
                  onChange={(e) => handleZoneChange('clipHeight', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-8 text-center">
          Coordinate map limits: 2048px x 2048px.
        </p>
      </div>

    </div>
  );
}