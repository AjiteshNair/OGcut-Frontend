// app/selfEdit/TshirtCustomizer.tsx
"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ==========================================
// CONFIGURATION: 2D UV MAP PIXEL COORDINATES
// ==========================================
const MAPPING_CONFIG = {
  canvasSize: 2048,
  debugBounds: false, 
  zones: {
    front: { 
      x: 520, 
      y: 1000, 
      baseScale: 0.35, 
      rotation: Math.PI,      
      clipWidth: 480,         
      clipHeight: 680 
    },        
    back: { 
      x: 1560,                
      y: 1000, 
      baseScale: 0.35, 
      rotation: Math.PI,      
      clipWidth: 480,         
      clipHeight: 680 
    },        
    leftSleeve: { 
      x: 490,                 
      y: 1850, 
      baseScale: 0.22, 
      rotation: 0,
      clipWidth: 300, 
      clipHeight: 300 
    },   
    rightSleeve: { 
      x: 1560,                
      y: 1850, 
      baseScale: 0.22, 
      rotation: 0,
      clipWidth: 300, 
      clipHeight: 300 
    }, 
  }
};

type Zone = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

interface GraphicState {
  logoImage: HTMLImageElement | null;
  size: number;
  aspect: number;
}

interface TshirtProps {
  color: string;
  mergedTexture: THREE.CanvasTexture | null;
}

// ==========================================
// SECTION 1: THE 3D SHIRT COMPONENT (WITH AUTO-ROTATION)
// ==========================================
function Tshirt({ color, mergedTexture }: TshirtProps) {
  const gltf = useGLTF('/shirt_1.glb') as any; 
  const groupRef = useRef<THREE.Group>(null);
  
  const exteriorMesh = gltf.nodes.T_Shirt_exterieur_ext_0;
  const interiorMesh = gltf.nodes.T_Shirt_int_int_0;

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.25 * delta;
    }
  });

  if (!mergedTexture) return null;

  return (
    <group ref={groupRef}> 
      {/* Exterior Layer */}
      {exteriorMesh && (
        <mesh geometry={exteriorMesh.geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            map={mergedTexture} 
            roughness={0.65} 
            metalness={0.05}
            side={THREE.FrontSide}
          />
        </mesh>
      )}

      {/* Interior Layer - Fixed to override default maps and polygon directions */}
      {interiorMesh && (
        <mesh geometry={interiorMesh.geometry}>
          <meshStandardMaterial 
            color={color}          // Apply the flat state color
            map={null}             // Force-clear any default white textures baked into the GLTF
            roughness={0.8}
            metalness={0.0}
            side={THREE.DoubleSide} // Ensures it renders regardless of normal orientation
          />
        </mesh>
      )}
    </group>
  );
}
// ==========================================
// SECTION 2: THE INTERACTIVE CORE VIEW
// ==========================================
function CustomizerInner() {
  const [color, setColor] = useState('#353935');
  const [activeTab, setActiveTab] = useState<Zone>('front');

  const visualCanvasContainerRef = useRef<HTMLDivElement | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [dynamicTexture, setDynamicTexture] = useState<THREE.CanvasTexture | null>(null);

  const [graphics, setGraphics] = useState<Record<Zone, GraphicState>>({
    front: { logoImage: null, size: 1.0, aspect: 1.0 },
    back: { logoImage: null, size: 1.0, aspect: 1.0 },
    leftSleeve: { logoImage: null, size: 1.0, aspect: 1.0 },
    rightSleeve: { logoImage: null, size: 1.0, aspect: 1.0 },
  });

  // --- 1. INITIALIZE CANVAS TEXTURE ---
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = MAPPING_CONFIG.canvasSize;
    canvas.height = MAPPING_CONFIG.canvasSize;
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

  // --- 2. LIVE BLENDING LOGIC (FIXED STRIPES) ---
  const renderMergedTexture = useCallback(() => {
    const canvas = liveCanvasRef.current;
    const texture = dynamicTexture;
    if (!canvas || !texture) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Layer 1: Clear the canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Layer 2: Fill the entire fabric with a flat, clean solid background color.
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Layer 3: Render custom uploaded vector artwork cleanly on top
    Object.keys(graphics).forEach((key) => {
      const zoneKey = key as Zone;
      const zoneData = graphics[zoneKey];
      const graphicImg = zoneData.logoImage;
      const mappingInfo = MAPPING_CONFIG.zones[zoneKey];

      // Red alignment box helper (only draws when debugBounds is true)
      if (MAPPING_CONFIG.debugBounds) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 6;
        ctx.strokeRect(
          mappingInfo.x - (mappingInfo.clipWidth / 2),
          mappingInfo.y - (mappingInfo.clipHeight / 2),
          mappingInfo.clipWidth,
          mappingInfo.clipHeight
        );
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(
          mappingInfo.x - (mappingInfo.clipWidth / 2),
          mappingInfo.y - (mappingInfo.clipHeight / 2),
          mappingInfo.clipWidth,
          mappingInfo.clipHeight
        );
        ctx.restore();
      }

      if (graphicImg) {
        ctx.save(); 

        // Restrict graphic within boundaries to prevent shoulder/seam bleeding
        ctx.beginPath();
        ctx.rect(
          mappingInfo.x - (mappingInfo.clipWidth / 2),
          mappingInfo.y - (mappingInfo.clipHeight / 2),
          mappingInfo.clipWidth,
          mappingInfo.clipHeight
        );
        ctx.clip(); 

        let drawWidth, drawHeight;
        const maxDimension = MAPPING_CONFIG.canvasSize * mappingInfo.baseScale * zoneData.size;

        if (zoneData.aspect > 1) { 
          drawWidth = maxDimension;
          drawHeight = drawWidth / zoneData.aspect;
        } else { 
          drawHeight = maxDimension;
          drawWidth = drawHeight * zoneData.aspect;
        }

        ctx.translate(mappingInfo.x, mappingInfo.y);
        
        if (mappingInfo.rotation !== 0) {
          ctx.rotate(mappingInfo.rotation); 
        }

        ctx.drawImage(
          graphicImg, 
          -drawWidth / 2, 
          -drawHeight / 2, 
          drawWidth, 
          drawHeight
        );

        ctx.restore(); 
      }
    });

    // Notify WebGL that the pixels changed
    texture.needsUpdate = true;

  }, [graphics, dynamicTexture, color]);

  // Trigger paint updates
  useEffect(() => {
    renderMergedTexture();
  }, [graphics, color, renderMergedTexture]);

  // --- 3. STATE CONTROLLERS ---
  const handleGraphicUpload = (e: React.ChangeEvent<HTMLInputElement>, zone: Zone) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        setGraphics(prev => ({
          ...prev,
          [zone]: { 
            logoImage: img, 
            size: prev[zone].size, 
            aspect: img.width / img.height 
          }
        }));
      };
    }
  };

  const updateGraphicSize = (zone: Zone, newSize: number) => {
    setGraphics(prev => ({
      ...prev,
      [zone]: { ...prev[zone], size: newSize }
    }));
  };

  const activeZoneData = graphics[activeTab];

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-slate-50">
      
      {/* WINDOW 1: LIVE 3D INTERACTIVE VIEWPORT */}
      <div className="w-full lg:w-1/2 h-[50vh] lg:h-full bg-slate-200 relative border-b lg:border-b-0 lg:border-r border-gray-300">
        <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-md text-xs font-bold text-gray-700 shadow-sm z-10">
          3D Interactive Model
        </div>
        <Canvas camera={{ position: [0, 0, 120], fov: 45 }}>
          <Suspense fallback={null}>
            <Stage preset="rembrandt" intensity={0.6} environment="city" adjustCamera={true}>
              <Tshirt color={color} mergedTexture={dynamicTexture} /> {/* <-- Added color={color} */}
            </Stage>
          </Suspense>
          <OrbitControls enableZoom={true} />
        </Canvas>
      </div>

      {/* WINDOW 2: LIVE 2D TEMPLATE INTERACTIVE VIEWPORT */}
      <div className="w-full lg:w-1/4 h-[40vh] lg:h-full bg-zinc-800 p-4 flex flex-col justify-center items-center relative border-b lg:border-b-0 lg:border-r border-gray-300">
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-md text-xs font-bold text-white shadow-sm z-10">
          2D Texture Map Blueprint (Real-time Mirror)
        </div>
        <div 
          ref={visualCanvasContainerRef} 
          className="w-full h-full max-w-full max-h-full flex items-center justify-center overflow-hidden"
        />
      </div>

      {/* WINDOW 3: DESIGN CONFIGURATION PANEL */}
      <div className="w-full lg:w-1/4 p-6 flex flex-col justify-start gap-6 bg-white overflow-y-auto h-auto lg:h-full">
        {/* Base Shirt Color Options */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Shirt Color</label>
          <div className="flex gap-3">
            {['#353935', '#ef4444', '#3b82f6', '#10b981', '#ffffff'].map((c) => (
              <button 
                key={c} 
                onClick={() => setColor(c)} 
                className="w-8 h-8 rounded-full border-2 transition-transform" 
                style={{ 
                  backgroundColor: c, 
                  borderColor: color === c ? '#000' : 'transparent', 
                  transform: color === c ? 'scale(1.1)' : 'none' 
                }}
              />
            ))}
          </div>
        </div>

        {/* Dynamic Zone Router Switches */}
        <div className="border-t pt-4">
          <label className="block text-xs font-semibold text-gray-500 mb-2">Target Blueprint Segment</label>
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-md">
            {(['front', 'back', 'leftSleeve', 'rightSleeve'] as Zone[]).map((zone) => (
              <button 
                key={zone} 
                onClick={() => setActiveTab(zone)} 
                className={`py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${activeTab === zone ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {zone.replace('Sleeve', ' Sleeve')}
              </button>
            ))}
          </div>
        </div>

        {/* Upload & Scale Streams */}
        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-bold text-gray-800 capitalize">{activeTab.replace('Sleeve', ' Sleeve')} Area Settings</h4>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Upload Vector / Logo</label>
            <input 
              key={activeTab} 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleGraphicUpload(e, activeTab)} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
          </div>

          {activeZoneData.logoImage && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Print Map Scale</span>
                <span>{activeZoneData.size.toFixed(2)}x</span>
              </div>
              <input 
                type="range" 
                min="0.1" 
                max="3.0" 
                step="0.02" 
                value={activeZoneData.size} 
                onChange={(e) => updateGraphicSize(activeTab, parseFloat(e.target.value))} 
                className="w-full" 
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// Preload the 3D target geometry
useGLTF.preload('/shirt_1.glb');

const TshirtCustomizer = dynamic(() => Promise.resolve(CustomizerInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-gray-400">
      <p className="text-lg font-medium animate-pulse">Initializing Multi-View Print Layout...</p>
    </div>
  ),
});

export default TshirtCustomizer;