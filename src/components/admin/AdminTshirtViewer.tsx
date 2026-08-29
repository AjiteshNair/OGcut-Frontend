'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';

import { Zone, ZoneConfig } from '@/types/customization';
import { Tshirt } from '@/components/TShirtModel';
import { CustomCartItem, Placement } from '@/types/customization';

const CANVAS_SIZE = 2048;

const INITIAL_ZONES: Record<Zone, ZoneConfig> = {
  front: { x: 598, y: 1420, clipWidth: 620, clipHeight: 784 },
  back: { x: 1536, y: 1325, clipWidth: 620, clipHeight: 911 },
  left: { x: 625, y: 280, clipWidth: 310, clipHeight: 300 },
  right: { x: 1450, y: 280, clipWidth: 330, clipHeight: 300 },
};

interface AdminTshirtViewerProps {
  fabricColor: string;
  placements: Placement[];
  activeZone: Zone;
}

export default function AdminTshirtViewer({
  fabricColor,
  placements,
  activeZone,
}: AdminTshirtViewerProps) {
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dynamicTexture, setDynamicTexture] = useState<THREE.CanvasTexture | null>(null);
  const [loadedImages, setLoadedImages] = useState<
    Partial<Record<Zone, { element: HTMLImageElement; x: number; y: number; zoom: number; width: number; height: number }>>
  >({});

  // Initialize Offscreen 2D Canvas & THREE Texture
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

  // Load Placement Artworks
  useEffect(() => {
    if (!placements || placements.length === 0) {
      setLoadedImages({});
      return;
    }

    Promise.all(
      placements.map(
        (p) =>
          new Promise<{ zone: Zone; data: any } | null>((resolve) => {
            if (!p.imgurl) return resolve(null);

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const cfg = INITIAL_ZONES[p.place];
              const aspect = img.width / img.height;

              let defaultW = cfg.clipWidth * 0.5;
              let defaultH = defaultW / aspect;
              if (defaultH > cfg.clipHeight * 0.5) {
                defaultH = cfg.clipHeight * 0.5;
                defaultW = defaultH * aspect;
              }

              resolve({
                zone: p.place,
                data: {
                  element: img,
                  x: p.xvalue,
                  y: p.yvalue,
                  zoom: p.zoom,
                  width: p.width || Math.round(defaultW),
                  height: p.height || Math.round(defaultH),
                },
              });
            };
            img.onerror = () => resolve(null);
            img.src = p.imgurl;
          })
      )
    ).then((results) => {
      const mapped: Partial<Record<Zone, any>> = {};
      results.forEach((r) => {
        if (r) mapped[r.zone] = r.data;
      });
      setLoadedImages(mapped);
    });
  }, [placements]);

  // Render texture to canvas
  const renderCanvasMap = useCallback(() => {
    const canvas = liveCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !dynamicTexture || !ctx) return;

    ctx.fillStyle = fabricColor;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    (Object.keys(INITIAL_ZONES) as Zone[]).forEach((zoneKey) => {
      const cfg = INITIAL_ZONES[zoneKey];
      const rx = cfg.x - cfg.clipWidth / 2;
      const ry = cfg.y - cfg.clipHeight / 2;

      const imgData = loadedImages[zoneKey];
      if (imgData?.element) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, cfg.clipWidth, cfg.clipHeight);
        ctx.clip();

        const w = imgData.width * imgData.zoom;
        const h = imgData.height * imgData.zoom;
        const drawX = cfg.x + imgData.x - w / 2;
        const drawY = cfg.y + imgData.y - h / 2;

        ctx.drawImage(imgData.element, drawX, drawY, w, h);
        ctx.restore();
      }
    });

    dynamicTexture.needsUpdate = true;
  }, [fabricColor, dynamicTexture, loadedImages]);

  useEffect(() => {
    renderCanvasMap();
  }, [renderCanvasMap]);

  return (
    <Canvas
      camera={{ position: [0, 0.8, 2], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
    >
      <color attach="background" args={['#09090b']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />

      <Suspense fallback={null}>
        <Center top position={[0, -0.1, 0]}>
          <Tshirt
            mergedTexture={dynamicTexture}
            activeTab={activeZone}
            userInteracting={false}
          />
        </Center>
      </Suspense>

      <OrbitControls
        enableZoom
        minDistance={1.5}
        maxDistance={3.0}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}