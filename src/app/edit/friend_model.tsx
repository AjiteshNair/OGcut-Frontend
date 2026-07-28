// app/selfEdit/TshirtCustomizer.tsx
"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type Zone = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

interface ZoneConfig {
  x: number;
  y: number;
  clipWidth: number;
  clipHeight: number;
}

interface TshirtProps {
  mergedTexture: THREE.CanvasTexture | null;
}

// ==========================================
// 3D MODEL RENDERING WINDOW
// ==========================================
function Tshirt({ mergedTexture }: TshirtProps) {
  const gltf = useGLTF('/oversized_baked.glb') as any; 
  const groupRef = useRef<THREE.Group>(null);
  const exteriorMesh = gltf.nodes.TShirt_Test;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0 * delta; // Slower rotation for alignment ease
    }
  });

  if (!mergedTexture) return null;

  return (
    <group ref={groupRef}> 
      {exteriorMesh && (
        <mesh geometry={exteriorMesh.geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            map={mergedTexture} 
            roughness={0.65} 
            metalness={0.05}
            side={THREE.DoubleSide} 
          />
        </mesh>
      )}
    </group>
  );
}

// ==========================================
// CORE INTERACTIVE MAPPER ENGINE
// ==========================================
function CustomizerInner() {
  const canvasSize = 2048;
  const [activeTab, setActiveTab] = useState<Zone>('front');

  const visualCanvasContainerRef = useRef<HTMLDivElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dynamicTexture, setDynamicTexture] = useState<THREE.CanvasTexture | null>(null);

  // Editable configurations state initialized with baseline layout coordinates
  const [zones, setZones] = useState<Record<Zone, ZoneConfig>>({
    front: { x: 520, y: 1000, clipWidth: 480, clipHeight: 680 },        
    back: { x: 1560, y: 1000, clipWidth: 480, clipHeight: 680 },        
    leftSleeve: { x: 490, y: 1850, clipWidth: 300, clipHeight: 300 },   
    rightSleeve: { x: 1560, y: 1850, clipWidth: 300, clipHeight: 300 }, 
  });

  // --- 1. INITIALIZE CANVAS TEXTURE ---
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'contain';
    liveCanvasRef.current = canvas;

    if (visualCanvasContainerRef.current) {
      visualCanvasContainerRef.current.appendChild(canvas);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false; 
    texture.colorSpace = THREE.SRGBColorSpace;
    setDynamicTexture(texture);

    return () => {
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    };
  }, []);

  // --- 2. CANVAS DRAWING (BLANK CANVAS + COORDINATE MAPS) ---
  const renderMergedTexture = useCallback(() => {
    const canvas = liveCanvasRef.current;
    const texture = dynamicTexture;
    if (!canvas || !texture) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Layer 1: Clear and paint blank canvas background
    ctx.fillStyle = '#0f172a'; // Deep slate blue background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Layer 2: Draw a subtle grid system (helps identify scaling)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 128) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
      ctx.moveTo(0, i); ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Layer 3: Render bounding boxes dynamically based on state sliders
    Object.keys(zones).forEach((key) => {
      const zoneKey = key as Zone;
      const zone = zones[zoneKey];
      const isSelected = activeTab === zoneKey;

      ctx.save();
      
      // Active mapping zone glows cyan/blue; inactive zones render red
      ctx.strokeStyle = isSelected ? '#06b6d4' : '#f43f5e';
      ctx.lineWidth = isSelected ? 12 : 4;
      
      const rx = zone.x - (zone.clipWidth / 2);
      const ry = zone.y - (zone.clipHeight / 2);
      
      // Draw Boundary Area
      ctx.strokeRect(rx, ry, zone.clipWidth, zone.clipHeight);
      
      // Draw semi-transparent fills to visualize bounds on the 3D shirt surfaces
      ctx.fillStyle = isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(244, 63, 94, 0.1)';
      ctx.fillRect(rx, ry, zone.clipWidth, zone.clipHeight);

      // Render details on the 2D texture block
      ctx.fillStyle = isSelected ? '#22d3ee' : '#fda4af';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(
        `${zoneKey.toUpperCase()}`, 
        rx + 15, 
        ry + 45
      );
      ctx.font = '24px monospace';
      ctx.fillText(
        `X: ${zone.x} | Y: ${zone.y}`, 
        rx + 15, 
        ry + 85
      );

      ctx.restore();
    });

    texture.needsUpdate = true;
  }, [zones, dynamicTexture, activeTab]);

  useEffect(() => {
    renderMergedTexture();
  }, [zones, activeTab, renderMergedTexture]);

  // Handler to update a specific property of the active zone
  const handleValChange = (field: keyof ZoneConfig, val: number) => {
    setZones(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: val
      }
    }));
  };

  const activeZone = zones[activeTab];

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-slate-900 text-white">
      
      {/* 3D INTERACTIVE TESTING WINDOW */}
      <div className="w-full lg:w-1/2 h-[50vh] lg:h-full bg-slate-950 relative border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded-md text-xs font-bold text-slate-300 shadow z-10">
          3D Live Mapping Preview
        </div>
        <Canvas camera={{ position: [0, 0, 120], fov: 45 }}>
          <Suspense fallback={null}>
            <Stage preset="rembrandt" intensity={0.6} environment="city" adjustCamera={true}>
              <Tshirt mergedTexture={dynamicTexture} />
            </Stage>
          </Suspense>
          <OrbitControls enableZoom={true} />
        </Canvas>
      </div>

      {/* 2D CANVAS MAP WINDOW */}
      <div className="w-full lg:w-1/4 h-[40vh] lg:h-full bg-slate-950 p-4 flex flex-col justify-center items-center relative border-b lg:border-b-0 lg:border-r border-slate-800">
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-md text-xs font-bold text-cyan-400 shadow z-10">
          2D Texture Map Coordinate Layout
        </div>
        <div 
          ref={visualCanvasContainerRef} 
          className="w-full h-full max-w-full max-h-full flex items-center justify-center overflow-hidden"
        />
      </div>

      {/* CONFIGURATION & EDITING SLIDERS PANEL */}
      <div className="w-full lg:w-1/4 p-6 flex flex-col justify-start gap-6 bg-slate-900 overflow-y-auto h-auto lg:h-full">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Coordinate Diagnostic Panel</h3>
          <p className="text-xs text-slate-400 mt-1">
            Slide the values to watch the boundary areas move across the 3D mesh structure. Use these coordinates for your final config!
          </p>
        </div>

        {/* Tab Switcher */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">Active Mapping Segment</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-md">
            {(['front', 'back', 'leftSleeve', 'rightSleeve'] as Zone[]).map((zone) => (
              <button 
                key={zone} 
                onClick={() => setActiveTab(zone)} 
                className={`py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${activeTab === zone ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {zone.replace('Sleeve', ' Sleeve')}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Coordinate Sliders */}
        <div className="space-y-5 border-t border-slate-800 pt-4">
          <h4 className="text-sm font-bold text-cyan-400 capitalize">{activeTab.replace('Sleeve', ' Sleeve')} Boundaries</h4>
          
          {/* Slider: X Position */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Center X Position</span>
              <span className="font-mono text-cyan-300">{activeZone.x}px</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2048" 
              step="5"
              value={activeZone.x} 
              onChange={(e) => handleValChange('x', parseInt(e.target.value))} 
              className="w-full accent-cyan-500" 
            />
          </div>

          {/* Slider: Y Position */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Center Y Position</span>
              <span className="font-mono text-cyan-300">{activeZone.y}px</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2048" 
              step="5"
              value={activeZone.y} 
              onChange={(e) => handleValChange('y', parseInt(e.target.value))} 
              className="w-full accent-cyan-500" 
            />
          </div>

          {/* Slider: Clip Width */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Clip Width</span>
              <span className="font-mono text-cyan-300">{activeZone.clipWidth}px</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="1000" 
              step="5"
              value={activeZone.clipWidth} 
              onChange={(e) => handleValChange('clipWidth', parseInt(e.target.value))} 
              className="w-full accent-cyan-500" 
            />
          </div>

          {/* Slider: Clip Height */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Clip Height</span>
              <span className="font-mono text-cyan-300">{activeZone.clipHeight}px</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="1300" 
              step="5"
              value={activeZone.clipHeight} 
              onChange={(e) => handleValChange('clipHeight', parseInt(e.target.value))} 
              className="w-full accent-cyan-500" 
            />
          </div>
        </div>

        {/* Live Output Dump to Copy Paste */}
        <div className="border-t border-slate-800 pt-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-400">Your Current Map Config Code</label>
          <pre className="bg-slate-950 p-3 rounded text-[10px] font-mono text-green-400 overflow-x-auto whitespace-pre">
{`zones: {
  front: { x: ${zones.front.x}, y: ${zones.front.y}, clipWidth: ${zones.front.clipWidth}, clipHeight: ${zones.front.clipHeight} },
  back: { x: ${zones.back.x}, y: ${zones.back.y}, clipWidth: ${zones.back.clipWidth}, clipHeight: ${zones.back.clipHeight} },
  leftSleeve: { x: ${zones.leftSleeve.x}, y: ${zones.leftSleeve.y}, clipWidth: ${zones.leftSleeve.clipWidth}, clipHeight: ${zones.leftSleeve.clipHeight} },
  rightSleeve: { x: ${zones.rightSleeve.x}, y: ${zones.rightSleeve.y}, clipWidth: ${zones.rightSleeve.clipWidth}, clipHeight: ${zones.rightSleeve.clipHeight} }
}`}
          </pre>
        </div>
      </div>

    </div>
  );
}

useGLTF.preload('/oversized_baked.glb');

const TshirtCustomizer = dynamic(() => Promise.resolve(CustomizerInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400">
      <p className="text-lg font-medium animate-pulse">Initializing Blueprint Mapper Engine...</p>
    </div>
  ),
});

export default TshirtCustomizer;