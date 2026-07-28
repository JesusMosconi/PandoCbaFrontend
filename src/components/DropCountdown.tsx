"use client";

import { useEffect, useState } from "react";

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  const clamped = Math.max(diff, 0);
  return {
    dias: Math.floor(clamped / (1000 * 60 * 60 * 24)),
    horas: Math.floor((clamped / (1000 * 60 * 60)) % 24),
    min: Math.floor((clamped / (1000 * 60)) % 60),
    terminado: diff <= 0,
  };
}

export default function DropCountdown({ fechaLanzamiento }: { fechaLanzamiento: string }) {
  const [tiempo, setTiempo] = useState(() => getTimeLeft(fechaLanzamiento));

  useEffect(() => {
    const interval = setInterval(() => setTiempo(getTimeLeft(fechaLanzamiento)), 30_000);
    return () => clearInterval(interval);
  }, [fechaLanzamiento]);

  if (tiempo.terminado) return null;

  return (
    <div className="flex gap-5 border border-black bg-white/90 p-4 text-[#1A1C1C] backdrop-blur-sm sm:gap-8 sm:p-6">
      {[[tiempo.dias, "DÍAS"], [tiempo.horas, "HORAS"], [tiempo.min, "MIN"]].map(([value, label]) => (
        <div key={String(label)} className="text-center">
          <p className="font-epilogue text-2xl font-bold sm:text-[32px]">{String(value).padStart(2, "0")}</p>
          <p className="mt-1 font-manrope text-[10px] font-normal uppercase tracking-[-0.05em] text-[#6B7280]">{label}</p>
        </div>
      ))}
    </div>
  );
}
