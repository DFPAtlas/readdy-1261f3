'use client';

export default function SessionLoading({ label = 'Checking your session...' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 flex items-center justify-center">
          <i className="ri-loader-4-line animate-spin text-4xl text-blue-500"></i>
        </div>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
}