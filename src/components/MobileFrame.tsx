import React from 'react';
import { Smartphone, Laptop, Sparkles, Heart } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
  isFullscreen: boolean;
  setIsFullscreen: (val: boolean) => void;
  nickname?: string;
}

export default function MobileFrame({ children, isFullscreen, setIsFullscreen, nickname }: MobileFrameProps) {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-natural-gradient text-slate-800 font-sans flex flex-col items-center justify-start md:justify-center py-6 px-2 md:p-4 lg:p-6 transition-all duration-500">
      
      {/* Decorative background clouds / light patches */}
      <div className="absolute top-10 left-10 w-48 h-48 bg-natural-sage/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-natural-mint/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-36 h-36 bg-[#FFF9F0]/60 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header Banner for Desktop View */}
      {!isFullscreen && (
        <div className="hidden md:flex flex-col items-center mb-5 text-center max-w-xl animate-fade-in pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-xs rounded-full border border-white/50 shadow-xs mb-2">
            <Heart className="w-4 h-4 text-natural-secondary fill-natural-secondary/30 animate-pulse" />
            <span className="text-xs font-semibold text-natural-primary">พื้นที่ปลอดภัยแดนใต้</span>
            <span className="w-1.5 h-1.5 rounded-full bg-natural-secondary animate-ping" />
          </div>
          <h1 id="app-desktop-title" className="text-3xl font-black tracking-tight text-natural-primary flex items-center gap-2 font-display">
            ฮีลใจ <span className="text-natural-secondary">Healjai</span>
          </h1>
          <p className="text-xs text-natural-primary/80 font-medium mt-1">
            แอปพื้นที่ปลอดภัยเพื่อดูแลสุขภาพจิตและหัวใจของคุณ โดยไม่ตัดสิน 🌿
            {nickname ? ` (ต้อนรับกลับมานะคะ คุณ${nickname})` : ''}
          </p>
        </div>
      )}

      {/* Control widget on the right top corner */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/60 shadow-md">
        <button
          onClick={() => setIsFullscreen(false)}
          className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            !isFullscreen ? 'bg-natural-secondary text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="โหมดโทรศัพท์มือถือ"
        >
          <Smartphone className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsFullscreen(true)}
          className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            isFullscreen ? 'bg-natural-secondary text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="โหมดเต็มหน้าจอ"
        >
          <Laptop className="w-4 h-4" />
        </button>
      </div>

      {isFullscreen ? (
        /* Fullscreen View */
        <div id="full-screen-container" className="w-full max-w-5xl h-[92vh] md:h-[88vh] bg-white/95 rounded-[32px] border border-white/60 shadow-2xl overflow-hidden flex flex-col backdrop-blur-md relative transform transition-all duration-500">
          {children}
        </div>
      ) : (
        /* Mobile Device Frame Mockup */
        <div className="relative mx-auto transform transition-all duration-500">
          
          {/* Outer Case */}
          <div className="w-[380px] h-[780px] bg-[#3B4D45] rounded-[52px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] p-3 border-4 border-[#283831] flex flex-col overflow-hidden relative">
            
            {/* Top Speaker / Camera Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#283831] rounded-full z-50 flex items-center justify-center p-1">
              <div className="w-12 h-1 bg-[#1F2B26] rounded-full" />
              <div className="w-2.5 h-2.5 bg-[#1F2B26] rounded-full ml-3 border border-slate-700/50" />
            </div>

            {/* Inner Screen */}
            <div className="w-full h-full bg-white rounded-[42px] overflow-hidden flex flex-col relative">
              
              {/* StatusBar Mock */}
              <div className="h-8 pt-2 px-6 flex justify-between items-center bg-white/40 backdrop-blur-xs select-none pointer-events-none z-40 text-xs font-semibold text-natural-primary/60">
                <span>10:45 🌿</span>
                <div className="flex items-center gap-1.5 text-natural-primary/60">
                  <span>5G</span>
                  <div className="w-5 h-2.5 border border-natural-primary/30 rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-natural-primary/50 rounded-3xs" />
                  </div>
                </div>
              </div>

              {/* Main App Rendering Area */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {children}
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="h-5 bg-white/40 flex justify-center items-center select-none pointer-events-none z-40 pb-1">
                <div className="w-28 h-1 bg-[#7AA38F]/30 rounded-full" />
              </div>
            </div>

          </div>

          {/* Southern Vibe Subtle Shadow Base */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-emerald-950/5 blur-md rounded-full pointer-events-none" />
        </div>
      )}
    </div>
  );
}
