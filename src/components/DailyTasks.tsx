import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Flame, RefreshCw, PenTool, Sparkle, Trophy, CheckSquare, Sparkles } from 'lucide-react';
import { showToast } from '../types';

interface DailyGoal {
  id: string;
  text: string;
  completed: boolean;
}

// Pool of 12 nurturing and micro-positive tasks
const GOALS_POOL = [
  'ยิ้มให้ตัวเองในกระจกและบอกว่าเก่งมาก 🪞',
  'สูดหายใจเข้าออกลึกๆ ผ่อนคลายสติ 5 ครั้ง 🌬️',
  'ดื่มน้ำอุ่นหรือน้ำสะอาด 1 แก้วรีเซ็ตร่างกาย 🥛',
  'จดสิ่งดีๆ หรือสิ่งที่อยากขอบคุณวันนี้ 1 เรื่อง 📝',
  'ยืดเหยียดร่างกายเบาๆ ไล่ความล้า 5 นาที 🧘‍♂️',
  'พิมพ์ส่งรักหรือความหวังดีให้คนที่ห่วงใย 💌',
  'พักสายตาปิดหน้าจอไปรับพลังงานธรรมชาติ 10 นาที 🌳',
  'จัดเก็บบริเวณรอบตัวสักจุดให้โล่งสะอาดตา 🧹',
  'ฟังท่วงทำนองเพลงหรือคลื่นเสียงธรรมชาติฮีลใจ 🎵',
  'ให้รางวัลตัวเองด้วยนมอุ่นๆ หรือของอร่อยสักคำ 🥛',
  'พูดคำสุภาพและละเมียดละไมต่อตัวเองเป็นพิเศษ 💖',
  'ถอดรองเท้าสัมผัสผืนหน้าดินหรือหญ้าธรรมชาติผ่อนคลาย 👣'
];

interface Particle {
  id: number;
  emoji: string;
  left: number;
  scale: number;
  rotate: number;
  duration: number;
  delay: number;
  drift: number;
  peakY: number;
}

export default function DailyTasks() {
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editTexts, setEditTexts] = useState<string[]>(['', '', '']);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hasCelebratedToday, setHasCelebratedToday] = useState<boolean>(false);

  const getTodayKey = () => {
    return `healjai_goals_${new Date().toISOString().split('T')[0]}`;
  };

  // Load state on mount
  useEffect(() => {
    const todayKey = getTodayKey();
    const cached = localStorage.getItem(todayKey);
    const celebratedKey = `healjai_celebrated_${new Date().toISOString().split('T')[0]}`;
    const wasCelebrated = localStorage.getItem(celebratedKey) === 'true';
    setHasCelebratedToday(wasCelebrated);

    if (cached) {
      try {
        const parsed = JSON.parse(cached) as DailyGoal[];
        if (parsed.length === 3) {
          setGoals(parsed);
          setEditTexts(parsed.map(g => g.text));
          return;
        }
      } catch (e) {
        console.error('Error parsing daily goals cached:', e);
      }
    }

    // Default 3 initial goals if not cached
    const initialGoals: DailyGoal[] = [
      { id: '1', text: 'ยิ้มให้ตัวเองในกระจกและบอกว่าเก่งมาก 🪞', completed: false },
      { id: '2', text: 'สูดหายใจเข้าออกลึกๆ ผ่อนคลายสติ 5 ครั้ง 🌬️', completed: false },
      { id: '3', text: 'ดื่มน้ำอุ่นหรือน้ำสะอาด 1 แก้วรีเซ็ตร่างกาย 🥛', completed: false }
    ];
    setGoals(initialGoals);
    setEditTexts(initialGoals.map(g => g.text));
    localStorage.setItem(todayKey, JSON.stringify(initialGoals));
  }, []);

  const saveGoalsToLocal = (updatedGoals: DailyGoal[]) => {
    setGoals(updatedGoals);
    localStorage.setItem(getTodayKey(), JSON.stringify(updatedGoals));
  };

  // Check / Uncheck task
  const handleToggle = (id: string) => {
    const updated = goals.map(g => g.id === id ? { ...g, completed: !g.completed } : g);
    saveGoalsToLocal(updated);

    const isAllDone = updated.every(g => g.completed);
    if (isAllDone && !hasCelebratedToday) {
      triggerConfetti();
      setHasCelebratedToday(true);
      localStorage.setItem(`healjai_celebrated_${new Date().toISOString().split('T')[0]}`, 'true');

      // Double-down with a cheerful UI Toast
      showToast(
        'ยินดีด้วยนะคะคุณได้ทำภารกิจครบถ้วนแล้ว! 🏆🌸',
        'success',
        'คุณเอาใจใส่ทั้งกายและจิตใจได้อย่างยอดเยี่ยมจังเลยคนเก่ง พี่ฮีลใจภูมิใจในตัวคุณและขอส่งกอดให้อุ่นใจเสมอน้า 💚'
      );
    }
  };

  // Shuffle / Roll fresh goals
  const handleShuffle = () => {
    // Pick 3 unique goals from the pool randomly
    const shuffledPool = [...GOALS_POOL].sort(() => 0.5 - Math.random());
    const newGoals: DailyGoal[] = [
      { id: '1', text: shuffledPool[0], completed: false },
      { id: '2', text: shuffledPool[1], completed: false },
      { id: '3', text: shuffledPool[2], completed: false }
    ];
    saveGoalsToLocal(newGoals);
    setEditTexts(newGoals.map(g => g.text));
    setIsEditing(false);
    
    showToast(
      'สุ่มดึงภารกิจบำบัดใจเสร็จแล้วค่ะ 🌀',
      'info',
      'เป้าหมายประคองทัศนคติเชิงบวกชุดใหม่พร้อมท้าทายหัวใจคนเก่งแล้วน้า ลุยกันเลยค่ะ 💚'
    );
  };

  // Custom edit submission
  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DailyGoal[] = goals.map((g, idx) => ({
      ...g,
      text: editTexts[idx].trim() || `เป้าหมายเชิงบวกข้อที่ ${idx + 1} 🌟`,
      completed: false // Reset completed on edit to make it fresh
    }));
    saveGoalsToLocal(updated);
    setIsEditing(false);

    showToast(
      'บันทึกสเปกตรัมที่ตั้งใจเรียบร้อยน้า 📝',
      'success',
      'คุณกำหนดวิถีรักษาความสุขได้ในสไตล์ตัวเองเลย มีสปิริตยอดเยี่ยมมากค่ะ 💚'
    );
  };

  // Confetti trigger algorithm
  const triggerConfetti = () => {
    const emojis = ['🌸', '💖', '⭐', '🍀', '✨', '🎉', '🕊️', '🌿', '🎈', '🥰', '🌈'];
    const newParticles: Particle[] = Array.from({ length: 40 }).map((_, i) => ({
      id: Date.now() + i,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      left: Math.random() * 90 + 5, // random % position
      scale: Math.random() * 0.7 + 0.6,
      rotate: Math.random() * 360,
      duration: Math.random() * 2 + 1.8, // 1.8 to 3.8s
      delay: Math.random() * 0.2,
      drift: (Math.random() - 0.5) * 120, // offset in px
      peakY: -(Math.random() * 140 + 100), // shoot upwards by 100-240px
    }));
    setParticles(newParticles);
    
    // Automatically clear to release DOM elements
    setTimeout(() => {
      setParticles([]);
    }, 4500);
  };

  const completedCount = goals.filter(g => g.completed).length;
  const progressPercent = Math.round((completedCount / 3) * 100);

  return (
    <div className="bg-gradient-to-br from-[#FAFDFA] to-[#F5FAF8] border border-emerald-250/30 rounded-3xl p-4 shadow-sm relative overflow-hidden flex flex-col gap-3">
      
      {/* Visual background confetti portal */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: `${p.left}%`, y: '110%', scale: 0, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: ['110%', `${p.peakY}px`, '200px'], // Shoot up to peak and fall down in container
                x: [`${p.left}%`, `${p.left + p.drift / 4}%`, `${p.left + p.drift / 2}%`],
                scale: [0, p.scale, p.scale, 0],
                rotate: [0, p.rotate / 2, p.rotate]
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: 'easeInOut'
              }}
              className="absolute text-lg select-none"
              style={{ left: 0 }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Title & Headers */}
      <div className="flex items-center justify-between border-b border-dashed border-emerald-100/60 pb-2.5 z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 px-2.5 bg-emerald-600/10 rounded-xl text-emerald-700 shrink-0 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-black text-emerald-950 flex items-center gap-1 leading-none font-display mb-0.5">
              <span>เป้าหมายจิ๋วฮีลใจรายวัน</span>
              {completedCount === 3 && (
                <span className="inline-block animate-bounce text-[9px] text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded font-black border border-[#FCD34D]">
                  Complete! 🏆
                </span>
              )}
            </h4>
            <p className="text-[8.5px] text-slate-400 font-bold leading-normal truncate">
              ปฏิบัติการท้าความเครียดอย่างเป็นขั้นตอนสะกดต่อสู้ทีละขั้นน้า
            </p>
          </div>
        </div>

        {/* Shuffling and Writing buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-0.5 text-[8.5px] font-black ${
              isEditing 
                ? 'bg-slate-800 text-white border-slate-800' 
                : 'bg-white text-slate-500 border-slate-100 hover:text-slate-800 hover:bg-slate-50'
            }`}
            title="เขียนตั้งเป้าหมายเอง"
          >
            <PenTool className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">กำหนดเอง</span>
          </button>

          <button
            type="button"
            onClick={handleShuffle}
            className="p-1.5 bg-white border border-slate-100 hover:bg-slate-50 rounded-lg transition-all text-slate-500 hover:text-emerald-700 cursor-pointer flex items-center gap-0.5 text-[8.5px] font-black"
            title="สุ่มเปลี่ยนจิตวิทยาเชิงบวกรอบใหม่"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">สุ่มเป้าหมาย</span>
          </button>
        </div>
      </div>

      {/* Progress Metric bar */}
      <div className="space-y-1.5 bg-white/70 border border-emerald-50/50 p-2.5 rounded-2xl z-10">
        <div className="flex justify-between items-center text-[9px] font-black">
          <span className="text-[#324D3D] flex items-center gap-1">
            <Flame className={`w-3.5 h-3.5 text-amber-500 ${completedCount > 0 ? 'animate-pulse' : ''}`} />
            <span>วันนี้ตระหนักทำไปแล้ว {completedCount} / 3 ข้อ</span>
          </span>
          <span className="text-emerald-700 font-mono font-black">{progressPercent}%</span>
        </div>
        
        <div className="w-full h-2.5 bg-slate-100/80 border border-slate-200/20 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-[#5E9B82] to-[#437C64] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', damping: 15 }}
          />
          {completedCount === 3 && (
            <motion.div 
              className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:14px_14px] animate-[shimmer_0.8s_linear_infinite]"
              style={{
                backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.4) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.4) 75%, transparent 75%, transparent)'
              }}
            />
          )}
        </div>
      </div>

      {/* CORE FORM / CHECKLIST ZONE */}
      <div className="z-10 min-h-[140px]">
        {isEditing ? (
          <form onSubmit={handleSaveCustom} className="space-y-2.5 animate-fade-in pt-1">
            <p className="text-[8px] text-amber-800 font-bold leading-normal mb-1 bg-amber-50/50 border border-amber-200/10 p-1.5 rounded-lg">
              ✏️ พิมพ์ตั้งเป้าหมายสร้างความพึงใจเล็กๆ ด้วยตัวเองได้เลยค่ะ (กดบันทึกแล้วระบบจะล้างติ๊กเก่าให้เริ่มลุยทันทีน้า)
            </p>
            {editTexts.map((text, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <span className="text-[10px] font-black text-[#437C64] select-none">#{idx + 1}</span>
                <input
                  type="text"
                  required
                  value={text}
                  onChange={(e) => {
                    const newTexts = [...editTexts];
                    newTexts[idx] = e.target.value;
                    setEditTexts(newTexts);
                  }}
                  placeholder={`เขียนเป้าหมายข้อที่ ${idx + 1}`}
                  className="flex-1 bg-white border border-slate-150/60 rounded-xl px-2.5 py-1.5 text-[9.5px] font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
              </div>
            ))}
            
            <div className="flex gap-1.5 pt-1">
              <button
                type="submit"
                className="flex-1 py-1 px-3 bg-emerald-700 hover:bg-emerald-850 active:scale-98 text-white rounded-xl text-[9px] font-black shadow-xs cursor-pointer text-center justify-center flex items-center"
              >
                ✓ ตกลงเก็บบันทึก
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditTexts(goals.map(g => g.text));
                  setIsEditing(false);
                }}
                className="py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[9px] font-black cursor-pointer text-center"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 pt-1">
            {goals.map((goal) => {
              const isDone = goal.completed;
              return (
                <div
                  key={goal.id}
                  onClick={() => handleToggle(goal.id)}
                  className={`border rounded-2xl p-2.5 flex items-center gap-3 transition-all cursor-pointer shadow-3xs group ${
                    isDone 
                      ? 'bg-emerald-50/40 border-emerald-200/50 text-[#1E3B2B]' 
                      : 'bg-white border-slate-150/60 text-slate-750 hover:bg-slate-50/50'
                  }`}
                >
                  {/* Circular beautiful checklist bullet */}
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    isDone 
                      ? 'bg-emerald-600 border-emerald-650 text-white scale-102 shadow-2xs shadow-emerald-500/10' 
                      : 'bg-slate-50 border-slate-200 text-transparent group-hover:border-emerald-400 group-hover:bg-emerald-50/20'
                  }`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>

                  <span className={`text-[9.5px] leading-relaxed font-bold flex-1 transition-all ${
                    isDone ? 'line-through text-[#4B6D5A]/70 italic' : ''
                  }`}>
                    {goal.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {completedCount === 3 && !isEditing && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border border-emerald-150/50 p-2 rounded-2xl text-center text-[#1E3B2B] flex items-center justify-center gap-1 animate-pulse z-10"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-[8px] font-black leading-none uppercase tracking-wide">
            วันนี้คุณประคอฟื้นฟูลมหายใจตัวเองเสร็จสิ้นแล้ว! โอบกอดใจไว้เก่งมาก
          </span>
        </motion.div>
      )}

    </div>
  );
}
