"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { Zone, ZoneConfig } from '@/types/customization';

const CANVAS_SIZE = 2048;

const DEFAULT_ZONES: Record<Zone, ZoneConfig> = {
  front: { x: 598, y: 1420, clipWidth: 620, clipHeight: 784 },
  back: { x: 1536, y: 1325, clipWidth: 620, clipHeight: 911 },
  leftSleeve: { x: 625, y: 280, clipWidth: 310, clipHeight: 300 },
  rightSleeve: { x: 1450, y: 280, clipWidth: 330, clipHeight: 300 },
};

export interface AdminPlacementData {
  zone: Zone;
  image?: string;
  dataUrl?: string;
  coordinates?: {
    x?: number;
    y?: number;
    scale?: number;
    width?: number;
    height?: number;
  };
  printZoneBounds?: {
    centerX?: number;
    centerY?: number;
    clipWidth?: number;
    clipHeight?: number;
    // Fallback names
    x?: number;
    y?: number;
  };
}

export interface AdminShirtInspector3DProps {
  fabricColor?: string;
  placements?: AdminPlacementData[];
  heightClass?: string;
}

function TshirtModel({ texture }: { texture: THREE.CanvasTexture | null }) {
  const gltf = useGLTF('/oversized_t-shirt-optimized.glb');
  const clonedScene = React.useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    if (clonedScene && texture) {
      clonedScene.traverse((child: any) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.map = texture;
          child.material.roughness = 1;
          child.material.metalness = 0;
          child.material.side = THREE.DoubleSide;
          child.material.needsUpdate = true;
        }
      });
    }
  }, [clonedScene, texture]);

  if (!clonedScene) return null;
  return <primitive object={clonedScene} />;
}

export default function AdminShirtInspector3D({
  fabricColor = '#ffffff',
  placements = [],
  heightClass = 'h-80',
}: AdminShirtInspector3DProps) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    // 1. Fill base fabric color
    ctx.fillStyle = fabricColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!placements || placements.length === 0) {
      setTexture(tex);
      return;
    }

    // 2. Render graphics onto 2D canvas texture
    const imagePromises = placements.map((p) => {
      return new Promise<void>((resolve) => {
        const imageSrc = p.image || p.dataUrl;
        if (!imageSrc) return resolve();

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const zoneKey = p.zone || 'front';
          const defaultBounds = DEFAULT_ZONES[zoneKey] || DEFAULT_ZONES.front;
          const bounds = p.printZoneBounds;

          // Resolve Center X, Center Y, Width, and Height from custom or default bounds
          const centerX = bounds?.centerX ?? bounds?.x ?? defaultBounds.x;
          const centerY = bounds?.centerY ?? bounds?.y ?? defaultBounds.y;
          const clipWidth = bounds?.clipWidth ?? defaultBounds.clipWidth;
          const clipHeight = bounds?.clipHeight ?? defaultBounds.clipHeight;

          const coords = p.coordinates || {};
          const offsetX = coords.x ?? 0;
          const offsetY = coords.y ?? 0;
          const scale = coords.scale ?? 1;

          const baseW = coords.width ?? 400;
          const baseH = coords.height ?? 400;

          const drawW = baseW * scale;
          const drawH = baseH * scale;

          // Clip to print zone boundary
          ctx.save();
          const rx = centerX - clipWidth / 2;
          const ry = centerY - clipHeight / 2;
          ctx.beginPath();
          ctx.rect(rx, ry, clipWidth, clipHeight);
          ctx.clip();

          // Draw artwork aligned with central coordinates
          const drawX = centerX + offsetX - drawW / 2;
          const drawY = centerY + offsetY - drawH / 2;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.restore();
          resolve();
        };

        img.onerror = () => resolve();
        img.src = imageSrc;
      });
    });

    Promise.all(imagePromises).then(() => {
      tex.needsUpdate = true;
      setTexture(tex);
    });

    return () => {
      tex.dispose();
    };
  }, [fabricColor, placements]);

  return (
    <div className={`w-full ${heightClass} bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 relative shadow-inner`}>
      <div className="absolute top-3 left-3 z-10 bg-slate-950/80 backdrop-blur px-3 py-1 rounded-md text-[11px] font-bold text-slate-300 border border-slate-800 pointer-events-none">
        Inspect 3D Render (Drag to rotate)
      </div>

      <Canvas camera={{ position: [0, 0.2, 1.2], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <directionalLight position={[-5, 5, -5]} intensity={0.4} />
        <Suspense fallback={null}>
          <Center top position={[0, -0.3, 0]}>
            <TshirtModel texture={texture} />
          </Center>
        </Suspense>
        <OrbitControls enableZoom={true} minDistance={0.8} maxDistance={2.5} makeDefault />
      </Canvas>
    </div>
  );
}