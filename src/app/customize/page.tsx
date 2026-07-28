'use client';

import { useState } from 'react';

const shirtBaseColors = [
  { name: 'White', value: '#f3e3d2', image: '/white.jpeg' },
  { name: 'Blue', value: '#24435a', image: '/blue.jpeg' },
  { name: 'Green', value: '#7b8754', image: '/green.jpeg' },
  { name: 'Black', value: '#151515', image: '/black.jpeg' },
  { name: 'Red', value: '#a63e42', image: '/red.jpeg' },
];

export default function CustomizePage() {
  const [shirtColor, setShirtColor] = useState(shirtBaseColors[0].value);
  const [selectedImage, setSelectedImage] = useState(shirtBaseColors[0].image);
  const [designImage, setDesignImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleImageUpload = (file?: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setDesignImage(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="flex w-full max-w-6xl flex-col items-center gap-6 lg:flex-row lg:items-center lg:justify-center">
        <div className="relative h-[420px] w-[320px] overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 shadow-[0_0_70px_rgba(0,0,0,0.45)] sm:h-[560px] sm:w-[440px]">
          <img
            src={selectedImage}
            alt="T-shirt mockup"
            className="absolute inset-0 h-full w-full object-contain pointer-events-none z-10"
          />
          {designImage && (
            <div className="absolute left-[50%] top-[40%] z-20 h-[24%] w-[40%] -translate-x-1/2 overflow-hidden rounded-[1rem] border border-white/80 bg-white/70 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
              <img src={designImage} alt="Uploaded preview" className="h-full w-full object-contain" />
            </div>
          )}
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="space-y-1">
            <p className="text-[0.7rem] uppercase tracking-[0.4em] text-zinc-400">Customize</p>
            <h1 className="text-xl font-semibold tracking-[0.18em] text-white">T-Shirt Studio</h1>
          </div>

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              handleImageUpload(event.dataTransfer.files?.[0]);
            }}
            className={`rounded-[1.25rem] border-2 border-dashed p-4 text-center transition ${dragActive ? 'border-white bg-white/10' : 'border-white/15 bg-black/20'}`}
          >
            <p className="text-sm uppercase tracking-[0.28em] text-zinc-300">Drop your art here</p>
            <input
              type="file"
              accept="image/*"
              className="mt-3 block w-full cursor-pointer text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[0.7rem] file:font-semibold file:uppercase file:tracking-[0.3em] file:text-white hover:file:bg-white/20"
              onChange={(event) => handleImageUpload(event.target.files?.[0])}
            />
          </div>

          <div className="space-y-2">
            <p className="text-[0.7rem] uppercase tracking-[0.35em] text-zinc-400">Fabric color</p>
            <div className="flex flex-wrap gap-2">
              {shirtBaseColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => {
                    setShirtColor(color.value);
                    setSelectedImage(color.image);
                  }}
                  className={`h-9 w-9 rounded-full border-2 transition ${shirtColor === color.value ? 'scale-110 border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: color.value }}
                  aria-label={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}