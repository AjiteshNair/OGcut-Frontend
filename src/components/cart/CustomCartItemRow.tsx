'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { CustomCartItem, ShirtSize, Zone, ZoneConfig } from '@/types/customization';

const CANVAS_SIZE = 2048;
const AVAILABLE_SIZES: ShirtSize[] = ['S', 'M', 'L', 'XL', '2XL'];

const DEFAULT_ZONES: Record<Zone, ZoneConfig> = {
  front: { x: 598, y: 1420, clipWidth: 620, clipHeight: 784 },
  back: { x: 1536, y: 1325, clipWidth: 620, clipHeight: 911 },
  left: { x: 625, y: 280, clipWidth: 310, clipHeight: 300 },
  right: { x: 1450, y: 280, clipWidth: 330, clipHeight: 300 },
};

function MiniTshirt({ texture }: { texture: THREE.CanvasTexture | null }) {
  const gltf = useGLTF('/models/oversized_t-shirt-optimized.glb');
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

function CartItemModel({ item }: { item: CustomCartItem }) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    // Set base garment color
    ctx.fillStyle = item.fabricColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!item.placements || item.placements.length === 0) {
      setTexture(tex);
      return;
    }

    const imagePromises = item.placements.map((placement: any) => {
      return new Promise<void>((resolve) => {
        if (!placement) return resolve();

        const imageUrl = placement.imgurl || placement.imageUrl || placement.image;
        if (!imageUrl) return resolve();

        const rawPlace = placement.zone;
        if (!rawPlace) {
          throw new Error(`Missing placement zone/place property for item ID: ${item.id}`);
        }

        const validZones: Zone[] = ['front', 'back', 'left', 'right'];
        if (!validZones.includes(rawPlace as Zone)) {
          throw new Error(`Unrecognized placement zone "${rawPlace}" on cart item.`);
        }

        const zoneKey = rawPlace as Zone;
        const zoneConfig = DEFAULT_ZONES[zoneKey];
        const { x: centerX, y: centerY, clipWidth, clipHeight } = zoneConfig;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;

        img.onload = () => {
          ctx.save();

          // 1. Clip canvas to zone boundary
          const rx = centerX - clipWidth / 2;
          const ry = centerY - clipHeight / 2;
          ctx.beginPath();
          ctx.rect(rx, ry, clipWidth, clipHeight);
          ctx.clip();

          // 2. Derive base size inside the clip container
          const aspect = img.width / img.height;
          
          // Base fit inside clip area (normalized)
          let baseW = clipWidth * 0.5;
          let baseH = baseW / aspect;

          if (baseH > clipHeight * 0.5) {
            baseH = clipHeight * 0.5;
            baseW = baseH * aspect;
          }

          // 3. Apply zoom / scale factor
          const userZoom = placement.zoom ?? placement.scale ?? 1;
          const drawW = baseW * userZoom;
          const drawH = baseH * userZoom;

          // 4. Position offset relative to center
          const offsetX = placement.xvalue ?? placement.x ?? 0;
          const offsetY = placement.yvalue ?? placement.y ?? 0;

          const drawX = centerX + offsetX - drawW / 2;
          const drawY = centerY + offsetY - drawH / 2;

          // 5. Render image onto texture canvas
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.restore();

          resolve();
        };

        img.onerror = () => resolve();
      });
    });

    Promise.all(imagePromises).then(() => {
      tex.needsUpdate = true;
      setTexture(tex);
    });

    return () => {
      tex.dispose();
    };
  }, [item]);

  return (
    <div className="w-28 h-28 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden relative shrink-0">
      <Canvas camera={{ position: [0, 0.2, 1], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <Suspense fallback={null}>
          <Center top position={[0, -0.35, 0]}>
            <MiniTshirt texture={texture} />
          </Center>
        </Suspense>
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={2} />
      </Canvas>
    </div>
  );
}

interface CustomCartItemRowProps {
  item: CustomCartItem;
  onQuantityChange: (id: number, delta: number) => void;
  onSizeChange: (id: number, newSize: ShirtSize) => void;
  onDuplicate: (item: CustomCartItem) => void;
  onRemove: (id: number) => void;
}

export const CustomCartItemRow: React.FC<CustomCartItemRowProps> = ({
  item,
  onQuantityChange,
  onSizeChange,
  onDuplicate,
  onRemove,
}) => {
  const router = useRouter();

  // Find the primary uploaded design image URL
  const primaryPlacement = item.placements && item.placements.length > 0 ? item.placements[0] : null;
  const designImageUrl = primaryPlacement ? ((primaryPlacement as any).imgurl || (primaryPlacement as any).imageUrl) : null;

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
      {/* 3D Model & Flat Image Preview Section */}
      <div className="flex items-center gap-3 shrink-0">
        <CartItemModel item={item} />

        {/* Flat Design Image Thumbnail */}
        {designImageUrl && (
          <div className="w-20 h-28 rounded-xl border border-slate-200 bg-slate-50 p-2 flex flex-col items-center justify-between overflow-hidden shrink-0">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              {(primaryPlacement as any)?.place || (primaryPlacement as any)?.zone || 'Design'}
            </span>
            <div className="w-full h-16 relative flex items-center justify-center">
              <img
                src={designImageUrl}
                alt="Uploaded Design"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <span className="text-[9px] text-slate-400 font-medium">Original</span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2 text-center sm:text-left w-full">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <h2 className="text-sm font-bold text-slate-800">Custom Oversized T-Shirt</h2>
          <span
            className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block shrink-0"
            style={{ backgroundColor: item.fabricColor }}
            title={`Color: ${item.fabricColor}`}
          />
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <p>
            Placements:{' '}
            <span className="font-semibold text-slate-700">
              {item.placements?.map((p: any) => p.place || p.zone).join(', ') || 'None'}
            </span>
          </p>

          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <label className="text-xs text-slate-600 font-medium">Size:</label>
            <select
              value={item.size || 'L'}
              onChange={(e) => onSizeChange(item.id, e.target.value as ShirtSize)}
              className="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded-md px-2 py-1 focus:outline-none"
            >
              {AVAILABLE_SIZES.map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-4 pt-1">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={() => onQuantityChange(item.id, -1)}
              className="px-2 py-1 text-slate-600 font-bold hover:bg-slate-200 text-xs"
            >
              -
            </button>
            <span className="px-3 text-xs font-bold text-slate-800">
              {item.quantity || 1}
            </span>
            <button
              onClick={() => onQuantityChange(item.id, 1)}
              className="px-2 py-1 text-slate-600 font-bold hover:bg-slate-200 text-xs"
            >
              +
            </button>
          </div>

          <span className="text-xs font-bold text-slate-900">
            ₹{(item.price) * (item.quantity)}
          </span>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-3 pt-2 text-[11px] font-semibold border-t border-slate-100">
          <button
            onClick={() => router.push(`/edit?editId=${item.id}`)}
            className="text-slate-700 hover:text-slate-900 underline"
          >
            Edit Design
          </button>
          <button
            onClick={() => onDuplicate(item)}
            className="text-emerald-600 hover:text-emerald-700 underline"
          >
            Add Another Size
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700 underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};