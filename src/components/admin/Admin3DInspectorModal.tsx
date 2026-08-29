'use client';

import React, { useState } from 'react';
import { Zone, CustomCartItem } from '@/types/customization';
import AdminTshirtViewer from './AdminTshirtViewer';

interface Admin3DInspectorModalProps {
  item: CustomCartItem | null;
  onClose: () => void;
}

export default function Admin3DInspectorModal({
  item,
  onClose,
}: Admin3DInspectorModalProps) {
  const [activeZone, setActiveZone] = useState<Zone>('front');

  if (!item) return null;

  const zones: Zone[] = ['front', 'back', 'left', 'right'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
        
        {/* Left: 3D View Container */}
        <div className="relative flex-1 bg-black">
          <AdminTshirtViewer
            fabricColor={item.fabricColor}
            placements={item.placements}
            activeZone={activeZone}
          />

          {/* Zone View Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 p-1.5 rounded-full shadow-lg">
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                  activeZone === zone
                    ? 'bg-amber-400 text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {zone}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Order Metadata & Print Files */}
        <div className="w-full md:w-96 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-neutral-800 bg-neutral-900 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {item.title || 'Custom T-Shirt'}
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Item Line ID: <span className="font-mono text-amber-400">{item.id}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white p-2 rounded-lg hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {/* Garment Details */}
            <div className="mt-6 space-y-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Garment Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                  <span className="text-neutral-500 block">Size</span>
                  <span className="font-bold text-white uppercase">{item.size}</span>
                </div>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-neutral-500 block">Color</span>
                    <span className="font-mono text-white text-[11px]">{item.fabricColor}</span>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border border-neutral-700"
                    style={{ backgroundColor: item.fabricColor }}
                  />
                </div>
              </div>
            </div>

            {/* Print Placements List */}
            <div className="mt-6 space-y-4">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Print Placements ({item.placements.length})
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {item.placements.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold uppercase text-amber-400">{p.place}</span>
                      <p className="text-[10px] text-neutral-500 mt-0.5">
                        Zoom: {p.zoom} | X: {p.xvalue} | Y: {p.yvalue}
                      </p>
                    </div>
                    {p.imgurl && (
                      <a
                        href={p.imgurl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-[10px] transition"
                      >
                        View Art ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-neutral-800">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs rounded-xl transition"
            >
              Close Inspector
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}