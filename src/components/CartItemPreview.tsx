// components/CartItemPreview.tsx
"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_PATH = '/oversized_t-shirt-optimized.glb';

function drawCanvasTexture(
  fabricColor: string,
  placements: any[],
  canvas: HTMLCanvasElement,
  onComplete: () => void
) {
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    onComplete();
    return;
  }

  // 1. Base fabric color
  ctx.fillStyle = fabricColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!placements || placements.length === 0) {
    onComplete();
    return;
  }

  // 2. Draw artwork placements
  let loadedCount = 0;

  placements.forEach((placement) => {
    const imageSrc = placement.image || placement.dataUrl;
    if (!imageSrc) {
      loadedCount++;
      if (loadedCount === placements.length) onComplete();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    const handleLoadOrError = () => {
      loadedCount++;
      if (loadedCount === placements.length) {
        onComplete();
      }
    };

    img.onload = () => {
      const coords = placement.coordinates || placement;
      const x = coords.x ?? 1024;
      const y = coords.y ?? 1024;
      const width = coords.width ?? coords.customWidth ?? 400;
      const height = coords.height ?? coords.customHeight ?? 400;

      ctx.save();

      // Clip bounds if defined
      if (placement.printZoneBounds) {
        const { centerX, centerY, clipWidth, clipHeight } = placement.printZoneBounds;
        ctx.beginPath();
        ctx.rect(
          centerX - clipWidth / 2,
          centerY - clipHeight / 2,
          clipWidth,
          clipHeight
        );
        ctx.clip();
      }

      // Draw artwork center-aligned
      ctx.drawImage(
        img,
        x - width / 2,
        y - height / 2,
        width,
        height
      );

      ctx.restore();
      handleLoadOrError();
    };

    img.onerror = handleLoadOrError;
  });
}

function ShirtModel({ fabricColor, placements }: { fabricColor: string; placements: any[] }) {
  const { scene } = useGLTF(MODEL_PATH);
  
  const [canvas] = useState(() => document.createElement('canvas'));
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false; // Essential for GLTF UV coordinates
    textureRef.current = tex;

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.6,
          metalness: 0.1,
        });
        mesh.material.needsUpdate = true;
      }
    });

    drawCanvasTexture(fabricColor, placements, canvas, () => {
      if (textureRef.current) {
        textureRef.current.needsUpdate = true;
      }
    });
  }, [clonedScene, fabricColor, placements, canvas]);

  return <primitive object={clonedScene} scale={1} position={[0, -1, 0]} />;
}

interface CartItemPreviewProps {
  fabricColor: string;
  placements: any[];
}

export default function CartItemPreview({ fabricColor, placements }: CartItemPreviewProps) {
  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, -5, -5]} intensity={0.3} />

        <ShirtModel fabricColor={fabricColor} placements={placements} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={2}
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);