import React from 'react';
import { Home, MessageCircleHeart, TreeDeciduous, FileText, Sparkles } from 'lucide-react';

export type TabType = 'home' | 'chat' | 'tree' | 'test' | 'relax';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const tabs = [
    { id: 'home', label: 'หน้าหลัก', icon: Home },
    { id: 'chat', label: 'เพื่อนคุย AI', icon: MessageCircleHeart },
    { id: 'tree', label: 'ต้นไม้ปัญหา', icon: TreeDeciduous },
    { id: 'relax', label: 'ผ่อนคลาย', icon: Sparkles },
    { id: 'test', label: 'ประเมินใจ', icon: FileText },
  ];

  return (
    <nav className="border-t border-slate-100 bg-white/95 backdrop-blur-md px-2 py-1.5 flex justify-around items-center z-40 shadow-[0_-4px_16px_rgba(0,0,0,0.015)] select-none shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className="flex flex-col items-center flex-1 cursor-pointer group py-1 relative"
          >
            {/* Soft indicator dot */}
            {isActive && (
              <div className="absolute top-0 w-1 h-1 rounded-full bg-natural-secondary animate-ping" />
            )}

            <div
              className={`p-2 rounded-xl transition-all duration-350 ${
                isActive
                  ? 'bg-natural-mint scale-105 text-natural-primary'
                  : 'text-slate-400 group-hover:text-natural-secondary group-hover:bg-natural-sage/50'
              }`}
            >
              <Icon className="w-5 h-5 transition-transform duration-200" />
            </div>
            
            <span
              className={`text-[9px] font-bold mt-1 tracking-tight transition-colors ${
                isActive ? 'text-natural-primary' : 'text-slate-400'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
