import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, HeartHandshake, PenLine, Sparkles } from 'lucide-react';
import { MoodType, MoodInfo } from '../types';

export const QUICK_MOODS: MoodInfo[] = [
  {
    type: 'great',
    emoji: '😊',
    label: 'สบายดีมาก',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  {
    type: 'neutral',
    emoji: '😐',
    label: 'ปานกลาง/เรื่อยๆ',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200'
  },
  {
    type: 'sad',
    emoji: '😢',
    label: 'เศร้า/อ่อนแอ',
    color: 'text-sky-600',
    bgColor: 'bg-[#EAF5FC]',
    borderColor: 'border-sky-200'
  },
  {
    type: 'stressed',
    emoji: '😣',
    label: 'เครียด/กังวล',
    color: 'text-rose-600',
    bgColor: 'bg-[#FDF2F2]',
    borderColor: 'border-rose-200'
  }
];

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (mood: MoodType, journal: string) => void;
  userNickname: string;
}

export default function QuickLogModal({ isOpen, onClose, onSave, userNickname }: QuickLogModalProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [journalText, setJournalText] = useState('');
  const maxChars = 200;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMood) return;
    
    onSave(selectedMood, journalText);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedMood(null);
    setJournalText('');
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const selectedMoodInfo = QUICK_MOODS.find(m => m.type === selectedMood);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-end md:items-center justify-center p-4"
          id="quick-log-modal-overlay"
        >
          {/* Backdrop Click Dismiss */}
          <div 
            className="absolute inset-0 cursor-default" 
            onClick={handleCancel} 
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 25 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="w-full max-w-[340px] bg-white rounded-[32px] p-5 shadow-2xl border border-slate-100 flex flex-col relative z-50 select-none overflow-hidden max-h-[90%] font-sans"
            id="quick-log-modal-content"
          >
            {/* Header branding background accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

            {/* Custom Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <div className="p-1 px-1.5 bg-emerald-50 text-emerald-700 rounded-lg flex items-center justify-center">
                  <PenLine className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <h3 className="text-[11.5px] font-black text-slate-800 tracking-tight font-display flex items-center gap-1">
                    จดบันทึกใจด่วนด้วยรัก ✍️
                  </h3>
                  <p className="text-[8px] text-slate-400 font-bold leading-none mt-0.5">
                    สะท้อนสภาวะใจปัจจุบันและทำไดอารี่สั้นๆ ค่ะ
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="quick-log-close"
                onClick={handleCancel}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl cursor-pointer transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-3.5 text-left flex-1 overflow-y-auto pr-0.5 scrollbar-none">
              {/* Question */}
              <div className="space-y-1">
                <p className="text-[10px] font-black text-emerald-800 bg-emerald-50/50 px-2.5 py-1 rounded-full border border-emerald-100/30 inline-block">
                  คุณดี {userNickname} วันนี้เป็นอย่างไรบ้างคะ? 💕
                </p>
                <p className="text-[9px] text-slate-400 font-bold leading-tight pl-0.5">
                  โปรดเลือกอารมณ์หลักที่ครอบงำหรือหล่อเลี้ยงจิตใจในวินาทีนี้ค่ะ:
                </p>
              </div>

              {/* Mood Choices Grid */}
              <div className="grid grid-cols-4 gap-2">
                {QUICK_MOODS.map((mood) => {
                  const isCurrent = selectedMood === mood.type;
                  return (
                    <button
                      key={mood.type}
                      type="button"
                      id={`quick-mood-btn-${mood.type}`}
                      onClick={() => setSelectedMood(mood.type)}
                      className={`flex flex-col items-center py-2 px-1 rounded-2xl border transition-all duration-300 transform cursor-pointer relative ${
                        isCurrent
                          ? `${mood.bgColor} ${mood.borderColor} scale-105 ring-2 ring-emerald-500/20 shadow-xs`
                          : 'bg-white border-slate-100 hover:bg-emerald-50/20 hover:scale-102'
                      }`}
                    >
                      <span className={`text-2xl transition-transform ${isCurrent ? 'scale-120 animate-bounce' : ''}`}>
                        {mood.emoji}
                      </span>
                      <span className={`text-[8.5px] font-black mt-1 ${isCurrent ? mood.color : 'text-slate-400 font-bold'}`}>
                        {mood.label.split('/')[0]}
                      </span>

                      {isCurrent && (
                        <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs border border-white">
                          <Sparkles className="w-1.5 h-1.5 animate-spin" style={{ animationDuration: '4s' }} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Prompt or Journal Input Box */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-[9.5px] font-black text-slate-600 flex items-center gap-1">
                    <HeartHandshake className="w-3 h-3 text-slate-400" />
                    ระบายใจสั้นๆ (ตัวเลือกเสริม):
                  </label>
                  <span className={`text-[8px] font-bold ${journalText.length >= maxChars - 20 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                    {journalText.length}/{maxChars}
                  </span>
                </div>

                <textarea
                  id="quick-log-journal-textarea"
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value.slice(0, maxChars))}
                  placeholder="เช่น ยิ้มให้กับท้องฟ้าวันนี้, รู้สึกตึงๆ กับโครงการที่เข้ามา หรือ แค่ต้องการถอนหายใจยาวๆ สักที..."
                  rows={3}
                  className="w-full text-[10px] font-bold p-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-hidden transition-all bg-slate-50/50 leading-relaxed font-sans placeholder:text-slate-400/85"
                />
              </div>

              {/* Hint Box based on selected mood */}
              {selectedMoodInfo && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-2.5 rounded-xl border ${selectedMoodInfo.bgColor} ${selectedMoodInfo.borderColor} text-[8.5px] font-semibold leading-relaxed`}
                >
                  {selectedMood === 'great' && (
                    <p className="text-emerald-900">
                      💖 ยอดเยี่ยมมากเลยค่ะ! ขอพลังสร้างสรรค์และความสุขที่อบอุ่นเป็นฟองอากาศโอบล้อมใจคุณดีไปตลอดวันน้าคะ บันทึกเพื่อล็อกสปอตไลต์ความสุขนี้ไว้เลยค่ะ
                    </p>
                  )}
                  {selectedMood === 'neutral' && (
                    <p className="text-slate-800">
                      🌿 ธรรมดาคือวิเศษที่สุด... ท้องฟ้าไม่ได้สวยที่สุดทุกวัน แต่การรักษาใจให้มีเกลื่อนคลื่นเสมอภาคแบบวันนี้เป็นทักษะที่เก่งและยอดเยี่ยมแล้วค่ะคนดี
                    </p>
                  )}
                  {selectedMood === 'sad' && (
                    <p className="text-sky-900 border-sky-300">
                      😢 ไม่เป็นไรเลยน้าที่จะเศร้า... ความเศร้าคือฝนตกลงในมหาสมุทรใจเพื่อล้างความล้า ดื่มน้ำอุ่นสักแก้ว พักสายตา พี่ฮีลใจกอดเบาๆ และพร้อมรับกระดาษระบายแผ่นนี้ค่ะ
                    </p>
                  )}
                  {selectedMood === 'stressed' && (
                    <p className="text-rose-900 border-rose-300">
                      😣 ลมหายใจเข้า... ท้องพอง ลมหายใจออก... ช้าๆ สบายๆ ความตึงเครียดของวันนี้เป็นแค่หมอกควันที่พัดผ่านมาแล้วจะผ่านไปค่ะ มารดน้ำใจให้คลายกังวลด้วยกันนะคะ
                    </p>
                  )}
                </motion.div>
              )}

              {/* Submit / Cancel Grid actions */}
              <div className="w-full grid grid-cols-2 gap-2 pt-1 pb-1">
                <button
                  type="button"
                  id="quick-log-cancel-btn"
                  onClick={handleCancel}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-600 rounded-xl text-[10px] font-black cursor-pointer transition-all text-center"
                >
                  ไว้คราวหลัง
                </button>
                <button
                  type="submit"
                  id="quick-log-submit-btn"
                  disabled={!selectedMood}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed active:scale-98 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all flex items-center justify-center gap-1 shadow-md shadow-emerald-500/10"
                >
                  <Send className="w-3 h-3" />
                  <span>จดลงบันทึก 💚</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
