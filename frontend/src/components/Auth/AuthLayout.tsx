import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden
                    bg-[linear-gradient(135deg,#0a2a6e_0%,#0d3494_35%,#1446b5_60%,#0a2a6e_100%)]">

      {/* ── Blob 1 — izquierda media ── */}
      <div className="animate-blob-1 absolute top-[15%] left-[5%] w-52 h-52 opacity-[0.18]
                      bg-[linear-gradient(135deg,#3b82f6,#60a5fa)]
                      [border-radius:60%_40%_55%_45%_/_50%_60%_40%_50%] [filter:blur(2px)]" />

      {/* ── Blob 2 — izquierda baja ── */}
      <div className="animate-blob-2 absolute top-[55%] left-[2%] w-36 h-36 opacity-[0.12]
                      bg-[linear-gradient(135deg,#93c5fd,#3b82f6)]
                      [border-radius:60%_40%_55%_45%_/_50%_60%_40%_50%] [filter:blur(2px)]" />

      {/* ── Blob 3 — derecha media ── */}
      <div className="animate-blob-3 absolute top-[60%] right-[4%] w-44 h-44 opacity-[0.15]
                      bg-[linear-gradient(135deg,#3b82f6,#1d4ed8)]
                      [border-radius:60%_40%_55%_45%_/_50%_60%_40%_50%] [filter:blur(2px)]" />

      {/* ── Blob 4 — superior derecha (invertido) ── */}
      <div className="animate-blob-1-rev absolute top-[10%] right-[15%] w-24 h-24 opacity-[0.13]
                      bg-[linear-gradient(135deg,#60a5fa,#93c5fd)]
                      [border-radius:60%_40%_55%_45%_/_50%_60%_40%_50%] [filter:blur(2px)]" />

      {/* ── Blob 5 — inferior derecha ── */}
      <div className="animate-blob-2 absolute bottom-[5%] right-[8%] w-56 h-32 opacity-[0.14]
                      bg-[linear-gradient(135deg,#1d4ed8,#3b82f6)]
                      [border-radius:40%_60%_70%_30%_/_40%_50%_60%_50%] [filter:blur(2px)]" />

      {/* ── Círculo giratorio — esquina superior derecha ── */}
      <div className="animate-spin-slow absolute -top-20 -right-20 w-[340px] h-[340px] rounded-full
                      border-2 border-blue-500/15
                      bg-[radial-gradient(circle_at_40%_40%,rgba(59,130,246,0.25),transparent_70%)]" />

      {/* ── Arco — centro superior ── */}
      <div
        className="animate-float-y absolute top-[30px] left-1/2 -translate-x-1/2
                   w-20 h-20 rounded-full border-[7px] border-blue-400/60 opacity-70"
        style={{ clipPath: 'polygon(0 0, 60% 0, 60% 100%, 0 100%)' }}
      />

      {/* ── Zig-zag SVG — izquierda ── */}
      <svg
        className="animate-float-y absolute left-[8%] top-[32%] w-[70px] h-[80px] opacity-45"
        viewBox="0 0 70 80" fill="none"
      >
        <path d="M10 10 L35 30 L10 50 L35 70" stroke="#60a5fa" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M30 10 L55 30 L30 50 L55 70" stroke="#3b82f6" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      </svg>

      {/* ── Ring — inferior izquierda ── */}
      <div className="animate-spin-slow-rev absolute bottom-[20%] left-[12%]
                      w-[120px] h-[120px] rounded-full border-[6px] border-blue-500/30 opacity-35" />

      {/* ── Olas SVG — derecha ── */}
      <svg
        className="animate-float-y-d absolute right-[10%] top-[30%] w-[60px] h-[60px] opacity-25"
        viewBox="0 0 60 60" fill="none"
      >
        <path d="M5 20 Q15 10 25 20 Q35 30 45 20 Q55 10 65 20" stroke="#93c5fd" strokeWidth="5" strokeLinecap="round"/>
        <path d="M5 35 Q15 25 25 35 Q35 45 45 35 Q55 25 65 35" stroke="#60a5fa" strokeWidth="5" strokeLinecap="round" opacity="0.7"/>
      </svg>

      {/* ── Contenido ── */}
      <div className="relative z-10">{children}</div>

      {/* ── Footer ── */}
      <p className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-white/30 tracking-wider">
        © 2026 SPH System · UTEC · Todos los derechos reservados
      </p>
    </div>
  );
}
