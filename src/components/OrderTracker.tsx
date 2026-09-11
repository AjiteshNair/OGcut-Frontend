'use client';

import React from 'react';

const STAGES = ['Pending', 'Processing', 'Printing', 'Shipped', 'Delivered'] as const;

interface OrderTrackerProps {
  status: string;
}

export default function OrderTracker({ status }: OrderTrackerProps) {
  // Normalize status string to lowercase for case-insensitive matching
  const currentStatusLower = status ? status.toLowerCase() : 'pending';
  
  // Determine current stage index (defaults to 0 if unknown status)
  const currentStageIndex = Math.max(
    0,
    STAGES.findIndex((stage) => stage.toLowerCase() === currentStatusLower)
  );

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between w-full">
        {STAGES.map((stage, idx) => {
          const isCompletedOrCurrent = idx <= currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          const showConnector = idx < STAGES.length - 1;
          const isNextConnected = idx < currentStageIndex;

          return (
            <React.Fragment key={stage}>
              {/* Node (O) */}
              <div className="relative flex flex-col items-center z-10">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${
                    isCompletedOrCurrent
                      ? 'bg-emerald-600 border-2 border-emerald-600 text-white'
                      : 'bg-white border-2 border-zinc-300 text-zinc-300'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isCompletedOrCurrent ? 'bg-white' : 'bg-transparent'
                    }`}
                  />
                </div>

                {/* Label below node */}
                <span
                  className={`text-[11px] font-medium mt-2 transition-colors duration-300 ${
                    isCurrent
                      ? 'text-emerald-700 font-bold uppercase tracking-wider'
                      : isCompletedOrCurrent
                      ? 'text-zinc-800'
                      : 'text-zinc-400'
                  }`}
                >
                  {stage}
                </span>
              </div>

              {/* Connecting Line (--------) */}
              {showConnector && (
                <div className="flex-1 h-0.5 mx-1 relative bg-zinc-200">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500"
                    style={{
                      width: isNextConnected ? '100%' : '0%',
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}