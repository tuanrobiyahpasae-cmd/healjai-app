import React, { useState } from 'react';
import { MoodType, MoodInfo } from '../types';
import { Smile, Check, ArrowRight, HeartHandshake } from 'lucide-react';

export const MOODS: MoodInfo[] = [
  {
    type: 'great',
    emoji: '😊',
    label: 'ดี',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  {
    type: 'neutral',
    emoji: '😐',
    label: 'เฉย ๆ',
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200'
  },
  {
    type: 'sad',
    emoji: '😢',
    label: 'เศร้า',
    color: 'text-sky-500',
    bgColor: 'bg-[#EAF5FC]',
    borderColor: 'border-sky-200'
  },
  {
    type: 'stressed',
    emoji: '😣',
    label: 'เครียด',
    color: 'text-rose-500',
    bgColor: 'bg-[#FDF2F2]',
    borderColor: 'border-rose-200'
  }
];

interface MoodCheckProps {
  onSaveMood: (mood: MoodType, journal: string) => void;
  lastMoodRecorded?: MoodType;
}

export default function MoodCheck({ onSaveMood, lastMoodRecorded }: MoodCheckProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [journal, setJournal] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSelect = (type: MoodType) => {
    setSelectedMood(type);
    setIsSaved(false);
  };

  const handleSave = () => {
    if (!selectedMood) return;
    onSaveMood(selectedMood, journal);
    setIsSaved(true);
    // Auto reset selection after 3 seconds for another check if they want
    setTimeout(() => {
      setIsSaved(false);
      setSelectedMood(null);
      setJournal('');
    }, 4000);
  };

  const activeMood = MOODS.find((m) => m.type === selectedMood);

  return (
    <div className="bg-white/90 rounded-3xl border border-slate-200/40 p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <div className="p-1 bg-natural-sage rounded-lg">
            <HeartHandshake className="w-4 h-4 text-natural-primary" />
          </div>
          <h3 className="text-xs font-bold text-natural-primary font-display">วันนี้อารมณ์ของคุณเป็นอย่างไรบ้างนะคะ?</h3>
        </div>
        {lastMoodRecorded && (
          <span className="text-[10px] font-bold text-natural-primary bg-natural-sage px-2 py-0.5 rounded-full border border-natural-secondary/10">
            ล่าสุด: {MOODS.find(m => m.type === lastMoodRecorded)?.emoji}
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3">
        {MOODS.map((mood) => {
          const isCurrent = selectedMood === mood.type;
          return (
            <button
              key={mood.type}
              type="button"
              onClick={() => handleSelect(mood.type)}
              className={`flex flex-col items-center py-2.5 px-1 rounded-2xl border transition-all duration-300 transform cursor-pointer ${
                isCurrent
                  ? `${mood.bgColor} ${mood.borderColor} scale-105 ring-2 ring-natural-secondary/20`
                  : 'bg-white border-slate-100 hover:bg-natural-sage/30'
              }`}
            >
              <span className={`text-2xl transition-transform ${isCurrent ? 'scale-125 animate-bounce' : 'group-hover:scale-110'}`}>
                {mood.emoji}
              </span>
              <span className={`text-[10px] font-bold mt-1 ${mood.color}`}>
                {mood.label}
              </span>
            </button>
          );
        })}
      </div>

      {selectedMood && !isSaved && (
        <div className="animate-fade-in space-y-2 mt-1">
          <p className="text-[10px] font-medium text-natural-primary/80">
            มีเรื่องอะไรที่อยากเล่าให้พี่ฟังเพิ่มไหมคะ? (บันทึกไดอารี่สั้นๆ)
          </p>
          <textarea
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            placeholder="เช่น วันนี้ทำการบ้านเสร็จแล้ว หรือ รู้สึกเหนื่อยกับหัวงานจัง..."
            rows={2}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-natural-secondary focus:outline-hidden transition-all bg-natural-sage/10"
            maxLength={150}
          />
          <button
            onClick={handleSave}
            className="w-full py-2 bg-natural-secondary hover:bg-natural-primary active:scale-98 text-white rounded-xl text-xs font-bold flex justify-center items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <span>บันทึกความรู้สึก</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isSaved && activeMood && (
        <div className="bg-natural-sage/40 border border-natural-secondary/10 p-3.5 rounded-xl text-center space-y-1 animate-fade-in mt-1">
          <Check className="w-5 h-5 text-natural-secondary mx-auto animate-bounce" />
          <p className="text-xs font-bold text-natural-primary">
            บันทึกความรู้สึก '{activeMood.label}' เรียบร้อยแล้วนะคะ
          </p>
          <p className="text-[10px] text-natural-primary/80 max-w-xs mx-auto">
            "ความรู้สึกทุกอย่างมีสิทธิ์เกิดขึ้นได้... ขอบคุณที่เปิดใจแชร์และดูแลใจกับพี่ฮีลใจนะคะ 💚"
          </p>
        </div>
      )}
    </div>
  );
}
