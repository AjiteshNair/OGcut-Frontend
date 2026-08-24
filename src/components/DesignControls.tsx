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

        {/* 5. Print Area Calibration */}
        <div className="space-y-4 bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              5. Base Print Area Calibration ({activeTab.toUpperCase()})
            </h3>
            <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-semibold">
              UV Grid Config
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs text-amber-800 font-medium mb-1">
              <span>Print Area Center X:</span>
              <span className="font-mono font-bold">{activeZoneConfig.x}px</span>
            </div>
            <input
              type="range"
              min="0"
              max={canvasSize}
              step="5"
              value={activeZoneConfig.x}
              onChange={(e) => updateZoneConfig({ x: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-amber-800 font-medium mb-1">
              <span>Print Area Center Y:</span>
              <span className="font-mono font-bold">{activeZoneConfig.y}px</span>
            </div>
            <input
              type="range"
              min="0"
              max={canvasSize}
              step="5"
              value={activeZoneConfig.y}
              onChange={(e) => updateZoneConfig({ y: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-amber-800 font-medium mb-1">
              <span>Max Print Width Limit:</span>
              <span className="font-mono font-bold">{activeZoneConfig.clipWidth}px</span>
            </div>
            <input
              type="range"
              min="100"
              max="1200"
              step="10"
              value={activeZoneConfig.clipWidth}
              onChange={(e) => updateZoneConfig({ clipWidth: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-amber-800 font-medium mb-1">
              <span>Max Print Height Limit:</span>
              <span className="font-mono font-bold">{activeZoneConfig.clipHeight}px</span>
            </div>
            <input
              type="range"
              min="100"
              max="1200"
              step="10"
              value={activeZoneConfig.clipHeight}
              onChange={(e) => updateZoneConfig({ clipHeight: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-800"
            />
          </div>
        </div>

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
                  transform: `translate(${activeZoneImage.x / 4}px, ${activeZoneImage.y / 4}px) scale(${activeZoneImage.scale})`,
                }}
                className="transition-transform duration-75 ease-out pointer-events-none"
              >
                <img
                  src={activeZoneImage.element.src}
                  alt="Design Preview"
                  style={{
                    width: `${activeZoneImage.customWidth / 4}px`,
                    height: `${activeZoneImage.customHeight / 4}px`,
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
                {activeZoneImage ? Math.round(activeZoneImage.x) : 0}px
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
                {activeZoneImage ? Math.round(activeZoneImage.y) : 0}px
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
                {activeZoneImage ? activeZoneImage.scale.toFixed(2) : 1}x
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

          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Explicit Dimensions</span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!activeZoneImage}
                  checked={activeZoneImage?.lockAspectRatio ?? true}
                  onChange={(e) => updateActiveZone({ lockAspectRatio: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900 accent-slate-900 disabled:opacity-40"
                />
                Lock Ratio
              </label>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Width:</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeZoneImage ? activeZoneImage.customWidth : 0}px
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="1"
                disabled={!activeZoneImage}
                value={activeZoneImage?.customWidth || 100}
                onChange={(e) => handleWidthChange(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-600 font-medium mb-1">
                <span>Height:</span>
                <span className="font-mono font-bold text-slate-900">
                  {activeZoneImage ? activeZoneImage.customHeight : 0}px
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="800"
                step="1"
                disabled={!activeZoneImage}
                value={activeZoneImage?.customHeight || 100}
                onChange={(e) => handleHeightChange(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
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