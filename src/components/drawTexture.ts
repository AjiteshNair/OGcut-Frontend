// utils/drawTexture.ts
import * as THREE from 'three';

export interface SavedPlacement {
  zone: string;
  image: string; // Base64 or URL
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
}

const CANVAS_SIZE = 2048;

export function createTextureFromPlacements(
  fabricColor: string,
  placements: SavedPlacement[],
  showOutlines: boolean = false
): Promise<THREE.CanvasTexture> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d')!;

    // 1. Draw Base Fabric Color
    ctx.fillStyle = fabricColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (placements.length === 0) {
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      resolve(tex);
      return;
    }

    // 2. Load placement images asynchronously and draw them
    let loadedCount = 0;
    const loadedImages: { img: HTMLImageElement; placement: SavedPlacement }[] = [];

    placements.forEach((placement) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = placement.image;
      img.onload = () => {
        loadedImages.push({ img, placement });
        loadedCount++;

        if (loadedCount === placements.length) {
          // Draw artwork after all images load
          loadedImages.forEach(({ img, placement }) => {
            const { coordinates, printZoneBounds } = placement;

            ctx.save();
            // Clip to Zone Bounds
            const rx = printZoneBounds.centerX - printZoneBounds.clipWidth / 2;
            const ry = printZoneBounds.centerY - printZoneBounds.clipHeight / 2;
            ctx.beginPath();
            ctx.rect(rx, ry, printZoneBounds.clipWidth, printZoneBounds.clipHeight);
            ctx.clip();

            // Calculate Draw Scale & Coordinates
            const drawW = coordinates.width * coordinates.scale;
            const drawH = coordinates.height * coordinates.scale;
            const drawX = printZoneBounds.centerX + coordinates.x - drawW / 2;
            const drawY = printZoneBounds.centerY + coordinates.y - drawH / 2;

            ctx.drawImage(img, drawX, drawY, drawW, drawH);
            ctx.restore();
          });

          const tex = new THREE.CanvasTexture(canvas);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.needsUpdate = true;
          resolve(tex);
        }
      };
    });
  });
}