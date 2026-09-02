'use client';

import React from 'react';
import { Zone, ShirtSize, ZoneConfig, ZoneImageData } from '@/types/customization';

export const PRESET_COLORS = [
  { name: 'Cream', hex: '#fffdd0' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Khaki', hex: '#c3b091' },
  { name: 'Royal Red', hex: '#ab0613' },
  { name: 'Royal Blue', hex: '#002366' },
];

export const AVAILABLE_SIZES: ShirtSize[] = ['S', 'M', 'L', 'XL', '2XL'];

interface DesignControlsProps {
  activeTab: Zone;
  setActiveTab: (zone: Zone) => void;
  fabricColor: string;
  setFabricColor: (color: string) => void;
  selectedSize: ShirtSize;
  setSelectedSize: (size: ShirtSize) => void;
  zones: Record<Zone, ZoneConfig>;
  activeZoneConfig: ZoneConfig;
  updateZoneConfig: (fields: Partial<ZoneConfig>) => void;
  activeZoneImage?: ZoneImageData;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateActiveZone: (fields: Partial<ZoneImageData>) => void;
  handleWidthChange: (width: number) => void;
  handleHeightChange: (height: number) => void;
  handleSaveCart: (mode: 'update' | 'add_new') => void;
  isSubmitting: boolean;
  editId: string | null;
  canvasSize: number;
}

export function DesignControls({
  activeTab,
  setActiveTab,
  fabricColor,
  setFabricColor,
  selectedSize,
  setSelectedSize,
  zones,
  activeZoneConfig,
  updateZoneConfig,
  activeZoneImage,
  handleFileUpload,
  updateActiveZone,
  handleWidthChange,
  handleHeightChange,
  handleSaveCart,
  isSubmitting,
  editId,
  canvasSize,
}: DesignControlsProps) {
  return (
    <div className="w-full lg:w-1/2 h-[60vh] lg:h-full bg-white flex flex-col overflow-y-auto z-10">
      <div className="p-6 space-y-6 max-w-md mx-auto w-full pb-28">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Design Studio</h1>
          <p className="text-xs text-slate-500">
            Configure fabric colors, select size, adjust print zones, and place graphics.
          </p>
        </div>

        {/* 1. Size Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">1. Select Garment Size</label>
          <div className="grid grid-cols-5 gap-2">
            {AVAILABLE_SIZES.map((sz) => (
              <button
                key={sz}
                onClick={() => setSelectedSize(sz)}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                  selectedSize === sz
                    ? 'bg-slate-900 text-white border-slate-900 shadow'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Fabric Color Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">2. Select Shirt Color</label>
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
                <span
                  className={`text-[9px] font-extrabold uppercase ${
                    c.name === 'Cream' ? 'text-slate-800' : 'text-white'
                  }`}
                >
                  {c.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Placement Area Tabs */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">3. Placement Area</label>
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

        {/* 4. Upload File Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            4. Upload Design ({activeTab.toUpperCase()})
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
          />
        </div>

        {/* area definition - Base Print Area Calibration (FRONT)
            The calibration controls have been commented out for production.
            To restore for debugging uncomment the original block below.

            ORIGINAL_BLOCK_START
            <div className="space-y-4 bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
              ... (original calibration UI) ...
            </div>
            ORIGINAL_BLOCK_END
        */}

        {/* 6. Layout & Boundary Preview */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <label className="block text-xs font-bold text-slate-700">
            Artwork Layout & Boundary Preview
          </label>
          <div className="relative w-full h-44 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center select-none">
            <div
              style={{
                width: `${(activeZoneConfig.clipWidth / canvasSize) * 100 * 2.5}%`,
                height: `${(activeZoneConfig.clipHeight / canvasSize) * 100 * 2.5}%`,
              }}
              className="absolute border border-dashed border-red-400 bg-red-500/5 rounded-lg pointer-events-none flex items-center justify-center"
            >
              <span className="text-[10px] text-red-400 font-semibold uppercase">Print Zone</span>
            </div>

            {activeZoneImage ? (
              <div
                style={{
                  transform: `translate(${(activeZoneImage.x ?? 0) / 4}px, ${(activeZoneImage.y ?? 0) / 4}px) scale(${activeZoneImage.scale ?? 1})`,
                }}
                className="transition-transform duration-75 ease-out pointer-events-none"
              >
                <img
                  src={activeZoneImage.element.src}
                  alt="Design Preview"
                  style={{
                    width: `${(activeZoneImage.customWidth ?? 0) / 4}px`,
                    height: `${(activeZoneImage.customHeight ?? 0) / 4}px`,
                  }}
                  className="object-contain"
                />
              </div>
            ) : (
              <span className="text-xs text-slate-400 z-10">Upload artwork to view placement</span>
            )}
          </div>
        </div>

        {/* 7. Precision Controls */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Artwork Precision Controls
          </h3>

          <div>
            <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
              <span>Position Left / Right:</span>
              <span className="font-mono font-bold text-slate-900">
                {activeZoneImage ? Math.round(activeZoneImage.x ?? 0) : 0}px
              </span>
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

          <div>
            <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
              <span>Position Up / Down:</span>
              <span className="font-mono font-bold text-slate-900">
                {activeZoneImage ? Math.round(activeZoneImage.y ?? 0) : 0}px
              </span>
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

          <div>
            <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
              <span>Zoom / Scale Factor:</span>
              <span className="font-mono font-bold text-slate-900">
                {activeZoneImage ? (activeZoneImage.scale ?? 1).toFixed(2) : 1}x
              </span>
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

          {/* Explicit dimensions controls removed — users cannot set width/height or lock ratio.
              If needed for debugging, search for "area definition" to restore the calibration block. */}
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          {editId ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => handleSaveCart('update')}
                disabled={isSubmitting}
                className="flex-1 py-3.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? 'Uploading & Updating...' : '✓ Update Cart Item'}
              </button>
              <button
                onClick={() => handleSaveCart('add_new')}
                disabled={isSubmitting}
                className="flex-1 py-3.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? 'Uploading...' : `➕ Add as New Item (${selectedSize})`}
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleSaveCart('add_new')}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Uploading Artwork...' : `🛒 Add to Cart (${selectedSize})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}