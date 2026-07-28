// app/selfEdit/page.tsx
import TshirtCustomizer from './TshirtCustomizer';

export default function SelfEditPage() {
  return (
    <main className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Design Your T-Shirts!</h1>
      <div className="w-full max-w-4xl h-[600px] bg-white rounded-xl shadow-lg overflow-hidden">
        <TshirtCustomizer />
      </div>
    </main>
  );
}