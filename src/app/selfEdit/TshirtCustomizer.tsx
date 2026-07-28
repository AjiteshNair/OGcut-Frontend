// app/selfEdit/TshirtCustomizer.tsx
"use client";

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Decal, useGLTF, useTexture, Stage } from '@react-three/drei';

const BLANK_PLACEHOLDER = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Customization zones
type Zone = 'front' | 'back' | 'leftSleeve' | 'rightSleeve';

interface TshirtProps {
  color: string;
  // Front
  frontLogoUrl: string | null;
  frontSizeMultiplier: number;
  frontImageAspect: number;
  // Back
  backLogoUrl: string | null;
  backSizeMultiplier: number;
  backImageAspect: number;
  // Left Sleeve
  leftLogoUrl: string | null;
  leftSizeMultiplier: number;
  leftImageAspect: number;
  // Right Sleeve
  rightLogoUrl: string | null;
  rightSizeMultiplier: number;
  rightImageAspect: number;
}

// ==========================================
// SECTION 1: THE 3D SHIRT COMPONENT
// ==========================================
function Tshirt({ 
  color, 
  frontLogoUrl, frontSizeMultiplier, frontImageAspect,
  backLogoUrl, backSizeMultiplier, backImageAspect,
  leftLogoUrl, leftSizeMultiplier, leftImageAspect,
  rightLogoUrl, rightSizeMultiplier, rightImageAspect
}: TshirtProps) {
  const gltf = useGLTF('/shirt_1.glb') as any; 
  const fabricTexture = useTexture('/blanc_ext_0_new.jpeg');
  const interiorTexture = useTexture('/blanc_int_1.jpeg');
  
  const frontLogoTexture = useTexture(frontLogoUrl || BLANK_PLACEHOLDER);
  const backLogoTexture = useTexture(backLogoUrl || BLANK_PLACEHOLDER);
  const leftLogoTexture = useTexture(leftLogoUrl || BLANK_PLACEHOLDER);
  const rightLogoTexture = useTexture(rightLogoUrl || BLANK_PLACEHOLDER);

  // 🚨 LOCKED PROJECTION BOX THICKNESS AT 10
  const DECAL_THICKNESS = 10.0; 

  const targetAspect = 6 / 11;

  // Aspect-Ratio Resizer Helper Function
  const getDecalDimensions = (multiplier: number, aspect: number) => {
    const maxWidth = 6 * multiplier;
    const maxHeight = 11 * multiplier;
    if (aspect > targetAspect) {
      return [maxWidth, maxWidth / aspect] as const; // Landscape
    }
    return [maxHeight * aspect, maxHeight] as const; // Portrait
  };

  const [frontW, frontH] = getDecalDimensions(frontSizeMultiplier, frontImageAspect);
  const [backW, backH] = getDecalDimensions(backSizeMultiplier, backImageAspect);
  const [leftW, leftH] = getDecalDimensions(leftSizeMultiplier, leftImageAspect);
  const [rightW, rightH] = getDecalDimensions(rightSizeMultiplier, rightImageAspect);

  // Clamp wrapping textures directly
  [frontLogoTexture, backLogoTexture, leftLogoTexture, rightLogoTexture].forEach(tex => {
    if (tex) {
      tex.wrapS = 1001; // ClampToEdge
      tex.wrapT = 1001;
      tex.needsUpdate = true;
    }
  });

  const exteriorMesh = gltf.nodes.T_Shirt_exterieur_ext_0;
  const interiorMesh = gltf.nodes.T_Shirt_int_int_0;

  return (
    <group> 
      {/* Exterior Layer */}
      {exteriorMesh && (
        <mesh geometry={exteriorMesh.geometry} castShadow receiveShadow>
          <meshStandardMaterial 
            color={color} 
            map={fabricTexture} 
            roughness={0.7}
            metalness={0.1}
          />
          
          {/* Front Decal */}
          {frontLogoUrl && (
            <Decal 
            debug
              position={[0, 30, 11]}
              rotation={[0, 0, 0]}        
              scale={[frontW, frontH, DECAL_THICKNESS]} 
              map={frontLogoTexture}
            />
          )}

          {/* Back Decal (Saved Perfect Placement) */}
          {backLogoUrl && (
            <Decal 
              position={[0, 27.5, -9.5]}
              rotation={[0, Math.PI, 0]} // 180 degrees transformed to Radians       
              scale={[backW, backH, DECAL_THICKNESS]} 
              map={backLogoTexture}
            />
          )}

          {/* Left Sleeve Decal (Saved Perfect Placement) */}
          {leftLogoUrl && (
            <Decal 
              position={[24, 47, -3.5]}
              rotation={[
                2 * (Math.PI / 180), 
                90 * (Math.PI / 180), 
                0
              ]}        
              scale={[leftW, leftH, DECAL_THICKNESS]} 
              map={leftLogoTexture}
            />
          )}

          {/* Right Sleeve Decal (Saved Perfect Placement) */}
          {rightLogoUrl && (
            <Decal 
              position={[-25.5, 47, -3]}
              rotation={[
                0, 
                -90 * (Math.PI / 180), 
                0
              ]}        
              scale={[rightW, rightH, DECAL_THICKNESS]} 
              map={rightLogoTexture}
            />
          )}
        </mesh>
      )}

      {/* Interior Layer */}
      {interiorMesh && (
        <mesh geometry={interiorMesh.geometry}>
          <meshStandardMaterial 
            color={color} 
            map={interiorTexture}
            roughness={0.8}
            metalness={0.0}
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

  // --- Front State ---
  const [frontLogo, setFrontLogo] = useState<string | null>(null);
  const [frontSize, setFrontSize] = useState<number>(1.0);
  const [frontAspect, setFrontAspect] = useState<number>(6 / 11);

  // --- Back State ---
  const [backLogo, setBackLogo] = useState<string | null>(null);
  const [backSize, setBackSize] = useState<number>(1.0);
  const [backAspect, setBackAspect] = useState<number>(6 / 11);

  // --- Left Sleeve State ---
  const [leftLogo, setLeftLogo] = useState<string | null>(null);
  const [leftSize, setLeftSize] = useState<number>(1.0);
  const [leftAspect, setLeftAspect] = useState<number>(6 / 11);

  // --- Right Sleeve State ---
  const [rightLogo, setRightLogo] = useState<string | null>(null);
  const [rightSize, setRightSize] = useState<number>(1.0);
  const [rightAspect, setRightAspect] = useState<number>(6 / 11);

  /* 🛠️ DEV DEBUGGING STATES DISABLED/COMMENTED OUT:
  const [backX, setBackX] = useState<number>(0);
  const [backY, setBackY] = useState<number>(27.5);
  const [backZ, setBackZ] = useState<number>(-9.5);
  const [rotX, setRotX] = useState<number>(0);
  const [rotY, setRotY] = useState<number>(180);
  const [rotZ, setRotZ] = useState<number>(0);

  const [leftX, setLeftX] = useState<number>(24); 
  const [leftY, setLeftY] = useState<number>(47);
  const [leftZ, setLeftZ] = useState<number>(-3.5);
  const [lRotX, setLRotX] = useState<number>(2);
  const [lRotY, setLRotY] = useState<number>(90); 
  const [lRotZ, setLRotZ] = useState<number>(0);

  const [rightX, setRightX] = useState<number>(-25.5); 
  const [rightY, setRightY] = useState<number>(47);
  const [rightZ, setRightZ] = useState<number>(-3);
  const [rRotX, setRRotX] = useState<number>(0);
  const [rRotY, setRRotY] = useState<number>(-90); 
  const [rRotZ, setRRotZ] = useState<number>(0);
  */

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, zone: Zone) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      img.onload = () => {
        const aspect = img.width / img.height;
        if (zone === 'front') {
          setFrontLogo(url);
          setFrontAspect(aspect);
        } else if (zone === 'back') {
          setBackLogo(url);
          setBackAspect(aspect);
        } else if (zone === 'leftSleeve') {
          setLeftLogo(url);
          setLeftAspect(aspect);
        } else if (zone === 'rightSleeve') {
          setRightLogo(url);
          setRightAspect(aspect);
        }
      };
    }
  };

  const getActiveZoneData = () => {
    switch (activeTab) {
      case 'front':
        return { logo: frontLogo, size: frontSize, setSize: setFrontSize, label: "Front Chest Graphic" };
      case 'back':
        return { logo: backLogo, size: backSize, setSize: setBackSize, label: "Back Graphic" };
      case 'leftSleeve':
        return { logo: leftLogo, size: leftSize, setSize: setLeftSize, label: "Left Sleeve Graphic" };
      case 'rightSleeve':
        return { logo: rightLogo, size: rightSize, setSize: setRightSize, label: "Right Sleeve Graphic" };
    }
  };

  const activeZone = getActiveZoneData();

  return (
    <div className="w-full h-full flex flex-col md:flex-row">
      {/* 3D Viewport Window */}
      <div className="w-full md:w-2/3 h-2/3 md:h-full bg-slate-100 relative">
        <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
          <Suspense fallback={null}>
            <Stage preset="rembrandt" intensity={0.6} environment="city" adjustCamera={true}>
              <Tshirt 
                color={color} 
                frontLogoUrl={frontLogo} 
                frontSizeMultiplier={frontSize} 
                frontImageAspect={frontAspect}
                
                backLogoUrl={backLogo}
                backSizeMultiplier={backSize}
                backImageAspect={backAspect}

                leftLogoUrl={leftLogo}
                leftSizeMultiplier={leftSize}
                leftImageAspect={leftAspect}

                rightLogoUrl={rightLogo}
                rightSizeMultiplier={rightSize}
                rightImageAspect={rightAspect}
              />
            </Stage>
          </Suspense>
          <OrbitControls enableZoom={true} />
        </Canvas>
      </div>

      {/* Control Panel */}
      <div className="w-full md:w-1/3 p-6 flex flex-col justify-start gap-6 border-t md:border-t-0 md:border-l border-gray-200 bg-white overflow-y-auto">
        {/* Color Picker */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Select Shirt Color</label>
          <div className="flex gap-3">
            {['#353935', '#ef4444', '#3b82f6', '#10b981', '#ffffff'].map((c) => (
              <button 
                key={c} 
                onClick={() => setColor(c)} 
                className="w-8 h-8 rounded-full border-2 transition-transform"
                style={{ backgroundColor: c, borderColor: color === c ? '#000' : 'transparent', transform: color === c ? 'scale(1.1)' : 'none' }}
              />
            ))}
          </div>
        </div>

        {/* Tab Selection Switches */}
        <div className="border-t pt-4">
          <label className="block text-xs font-semibold text-gray-500 mb-2">Customization Zone</label>
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

        {/* Selected Zone Upload Control */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-gray-800 capitalize">{activeTab.replace('Sleeve', ' Sleeve')} Area Settings</h4>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Upload {activeZone.label}</label>
            <input 
              key={activeTab}
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e, activeTab)} 
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {activeZone.logo && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Graphic Size</span>
                <span>{activeZone.size.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="0.3" 
                max="4.0" 
                step="0.1" 
                value={activeZone.size} 
                onChange={(e) => activeZone.setSize(parseFloat(e.target.value))} 
                className="w-full" 
              />
            </div>
          )}
        </div>

        {/* ==========================================
            DEVELOPER ALIGNMENT SLIDERS (COMMENTED OUT FOR PRODUCTION)
            ========================================== */}
        {/*
        {activeTab !== 'front' && activeZone.logo && (
          <div className="border-t-2 border-dashed border-red-200 bg-red-50 p-4 rounded-lg mt-2 space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-red-700 tracking-wider uppercase">Alignment Helper</h5>
              <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-mono font-bold">DEV ONLY</span>
            </div>
            
            <div className="space-y-2 text-xs">
              <div>
                <label className="flex justify-between text-gray-700">
                  <span>Position X (Left/Right)</span> 
                  <span className="font-mono">
                    {activeTab === 'back' ? backX : activeTab === 'leftSleeve' ? leftX : rightX}
                  </span>
                </label>
                <input 
                  type="range" min="-50" max="50" step="0.5" 
                  value={activeTab === 'back' ? backX : activeTab === 'leftSleeve' ? leftX : rightX} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (activeTab === 'back') setBackX(val);
                    else if (activeTab === 'leftSleeve') setLeftX(val);
                    else setRightX(val);
                  }} 
                  className="w-full accent-red-600" 
                />
              </div>

              <div>
                <label className="flex justify-between text-gray-700">
                  <span>Position Y (Up/Down)</span> 
                  <span className="font-mono">
                    {activeTab === 'back' ? backY : activeTab === 'leftSleeve' ? leftY : rightY}
                  </span>
                </label>
                <input 
                  type="range" min="-50" max="50" step="0.5" 
                  value={activeTab === 'back' ? backY : activeTab === 'leftSleeve' ? leftY : rightY} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (activeTab === 'back') setBackY(val);
                    else if (activeTab === 'leftSleeve') setLeftY(val);
                    else setRightY(val);
                  }} 
                  className="w-full accent-red-600" 
                />
              </div>

              <div>
                <label className="flex justify-between text-gray-700">
                  <span>Position Z (In/Out)</span> 
                  <span className="font-mono">
                    {activeTab === 'back' ? backZ : activeTab === 'leftSleeve' ? leftZ : rightZ}
                  </span>
                </label>
                <input 
                  type="range" min="-30" max="30" step="0.5" 
                  value={activeTab === 'back' ? backZ : activeTab === 'leftSleeve' ? leftZ : rightZ} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (activeTab === 'back') setBackZ(val);
                    else if (activeTab === 'leftSleeve') setLeftZ(val);
                    else setRightZ(val);
                  }} 
                  className="w-full accent-red-600" 
                />
              </div>
              
              <hr className="my-2 border-red-200" />
              
              <div>
                <label className="flex justify-between text-gray-700">
                  <span>Rotation X (Pitch / Up-Down Tilt)</span> 
                  <span className="font-mono">
                    {activeTab === 'back' ? rotX : activeTab === 'leftSleeve' ? lRotX : rRotX}°
                  </span>
                </label>
                <input 
                  type="range" min="-180" max="180" step="1" 
                  value={activeTab === 'back' ? rotX : activeTab === 'leftSleeve' ? lRotX : rRotX} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (activeTab === 'back') setRotX(val);
                    else if (activeTab === 'leftSleeve') setLRotX(val);
                    else setRRotX(val);
                  }} 
                  className="w-full accent-red-600" 
                />
              </div>

              <div>
                <label className="flex justify-between text-gray-700">
                  <span>Rotation Y (Yaw / Left-Right Spin)</span> 
                  <span className="font-mono">
                    {activeTab === 'back' ? rotY : activeTab === 'leftSleeve' ? lRotY : rRotY}°
                  </span>
                </label>
                <input 
                  type="range" min="-180" max="180" step="1" 
                  value={activeTab === 'back' ? rotY : activeTab === 'leftSleeve' ? lRotY : rRotY} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (activeTab === 'back') setRotY(val);
                    else if (activeTab === 'leftSleeve') setLRotY(val);
                    else setRRotY(val);
                  }} 
                  className="w-full accent-red-600" 
                />
              </div>

              <div>
                <label className="flex justify-between text-gray-700">
                  <span>Rotation Z (Roll / Flat Spin)</span> 
                  <span className="font-mono">
                    {activeTab === 'back' ? rotZ : activeTab === 'leftSleeve' ? lRotZ : rRotZ}°
                  </span>
                </label>
                <input 
                  type="range" min="-180" max="180" step="1" 
                  value={activeTab === 'back' ? rotZ : activeTab === 'leftSleeve' ? lRotZ : rRotZ} 
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (activeTab === 'back') setRotZ(val);
                    else if (activeTab === 'leftSleeve') setLRotZ(val);
                    else setRRotZ(val);
                  }} 
                  className="w-full accent-red-600" 
                />
              </div>
            </div>
          </div>
        )}
        */}
      </div>
    </div>
  );
}

const TshirtCustomizer = dynamic(() => Promise.resolve(CustomizerInner), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-gray-400">
      <p className="text-lg font-medium animate-pulse">Initializing 3D Engine...</p>
    </div>
  ),
});

export default TshirtCustomizer;