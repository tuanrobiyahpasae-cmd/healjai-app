import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, UserProfile, MentalHealthLog } from '../types';
import { Send, Sparkles, Heart, RefreshCw } from 'lucide-react';

interface AIChatProps {
  profile: UserProfile;
  logs: MentalHealthLog[];
}

export default function AIChat({ profile, logs }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const userLogs = logs ? logs.filter(l => l.email === profile.email) : [];
    const latestLog = userLogs.length > 0 ? userLogs[userLogs.length - 1] : null;
    
    let welcomeText = `อัสสาลามูอาลัยกุมนะคะคุณ ${profile.nickname || 'คนดี'} 🌿 พี่ฮีลใจยินดีต้อนรับสู่มุมคุยเล่นสารทุกข์สุกดิบค่ะ\n\nวันนี้เกิดอะไรขึ้นบ้างนะคะ? สบายใจไหม หรือมีจุดไหนสะดุด ทะเลาะกับใคร หรือเหนื่อยใจเรื่องอะไรเปล่า? เล่าระบายกับพี่ได้เต็มที่เลยนะคะ พี่ไม่มีวันตัดสินคุณแน่นอนค่ะ 💚`;
    
    if (latestLog) {
      if (latestLog.mood === 'sad') {
        welcomeText = `อัสสาลามูอาลัยกุมนะคะคุณ ${profile.nickname} 🌿\n\nพี่ฮีลใจสังเกตจากไดอารี่สะท้อนใจเห็นว่าช่วงนี้คุณรู้สึก "เศร้าอ่อนแรง" นะคะ 🥀 ${latestLog.journal ? `ที่คุณบันทึกในใจว่า "${latestLog.journal}" พี่ฮีลใจอ่านแล้วสัมผัสได้ถึงความรู้สึกอึดอัดเลยนะคะ` : ''}\n\nวันนี้พร้อมระบาย คุยเปิดกระดุมใจ หรือช่วยบ่นปัญหาเรื่องนี้ระบายกับพี่ได้เลยนะคนเก่ง พี่ฮีลใจอยากกอดและอยู่เคียงข้างรับฟังคุณค่ะ 💚`;
      } else if (latestLog.mood === 'stressed') {
        welcomeText = `อัสสาลามูอาลัยกุมนะคะคุณ ${profile.nickname} 🌿\n\nพี่ฮีลใจแวะมาประคองใจค่ะ สังเกตเห็นช่วงนี้คุณรู้สึก "เครียดหรือหมดไฟ" ใช่ไหมคะ? 🥺 ${latestLog.journal ? `ที่คุณบอกว่า "${latestLog.journal}" มีเรื่องกดดันหน่วงรบกวนสมาธิมากใช่ไหมคะ` : ''}\n\nเรามาฝึกฮีลใจ ปล่อยวางขอบเขต หรือหาแนวทางกู้คืนช่วงเวลาดีๆ คลายเครียดทีละก้าวเล็กๆ ไปด้วยกันนะคะ พี่เป็นห่วงคุณเสมอน้า`;
      } else if (latestLog.mood === 'great') {
        welcomeText = `อัสสาลามูอาลัยกุมนะคะคุณ ${profile.nickname} 🌿\n\nยินดีต้อนรับกลับมานะคะ! พี่ฮีลใจชื่นใจจังเลยที่บันทึกสะท้อนไดอารี่ล่าสุดแสดงว่าคุณรู้สึก "ดีเยี่ยมสุดยอด" เลย 🌻 มีเรื่องวิเศษสุด หรือเรื่องราวอะไรเพิ่มเติมที่ทำให้คุณคนเก่งเปื้อนยิ้มอยากมาเล่าแบ่งปันให้พี่รู้หวานๆ ไหมเอ่ย? ยินดีร่วมยินดีไปกับคุณน้าา ✨`;
      } else if (latestLog.mood === 'neutral') {
        welcomeText = `อัสสาลามูอาลัยกุมนะคะคุณ ${profile.nickname} 🌿\n\nยินดีต้อนรับคุณคนเก่งนะคะ ประวัติสะท้อนใจล่าสุดแสดงว่าคุณทรงตัวรู้สึกเงียบสบายใจระดับทั่วไป/สบายนิ่งกลางๆ 😊 ${latestLog.journal ? `ที่คุณเล่าเรื่องน่ารักไว้นิดๆ ว่า "${latestLog.journal}"` : ''}\n\nวันนี้เหนื่อยหรือผ่อนคลายสบายสมองดีไหมน้า มีเรื่องไหนอยากสะกิดคุยเล่นหรือแบ่งปันเรื่องในวันสุขล้าๆ ยอๆ ไหมคะ พี่อยู่ตรงนี้พร้อมป้อนคำพูดดีๆ เคียงข้างนะจ๊ะ`;
      }
    }
    
    return [
      {
        id: 'welcome',
        role: 'model',
        text: welcomeText,
        timestamp: new Date()
      }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterChips = [
    'วันนี้เกิดอะไรขึ้นบ้าง?',
    'อยากเล่าอะไรยอๆ ไหม?',
    'วันนี้หนูเหนื่อยเรื่องเรียนจังเลยพี่ฮีลใจ 😢',
    'ไม่มีสมาธิสอบและเครียดเรื่องอนาคตจังเลยค่ะ',
    'แชร์ดุอาอฺหรือวิธีสงบใจหน่อยได้ไหมคะ 💚'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // API call to the server Express proxy
      // Pass the message and previous messages as context history
      // Keep only last 8 messages in context to save budget
      const contextHistory = messages.slice(-8).map(m => ({
        role: m.role,
        text: m.text
      }));

      // Gather recent user logs summary (up to 3 logs) to help AI target perfectly
      const userLogs = logs ? logs.filter(l => l.email === profile.email) : [];
      const recentLogsSummary = userLogs.slice(-3).map(l => {
        const moodTh = l.mood === 'great' ? 'ดีเยี่ยม' : l.mood === 'neutral' ? 'ปานกลาง/ทั่วไป' : l.mood === 'sad' ? 'เศร้าซึม' : 'เครียด/หมดไฟ';
        return `- อารมณ์ "${moodTh}" ${l.journal ? `ร่วมกับไดอารี่ในใจ: "${l.journal}"` : ''} ${l.assessmentResult ? `(ทำแบบเตือนภัยสุขภาพจิตระดับสถานะ: ${l.assessmentResult.status} ได้คะแนนรวม ${l.assessmentResult.score})` : ''}`;
      }).join('\n');

      // Sort logs by timestamp to find absolute latest entries
      const sortedUserLogs = [...userLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const latestLogWithAssessment = sortedUserLogs.find(l => l.assessmentResult);
      const latestLogWithJournal = sortedUserLogs.find(l => l.journal);
      const latestLogWithProblemTree = sortedUserLogs.find(l => l.problemTreePath && l.problemTreePath.length > 0);
      const latestMoodLog = sortedUserLogs.find(l => l.mood);

      let assessmentResultVal = "ยังไม่มีข้อมูลประเมิน";
      if (latestLogWithAssessment?.assessmentResult) {
        assessmentResultVal = `${latestLogWithAssessment.assessmentResult.screening} score: ${latestLogWithAssessment.assessmentResult.score} (${latestLogWithAssessment.assessmentResult.status})`;
      } else if (latestMoodLog) {
        const moodTh: Record<string, string> = { great: 'ดีเยี่ยม', neutral: 'ปานกลาง', sad: 'เศร้าซึม', stressed: 'เครียด/หมดไฟ' };
        assessmentResultVal = `อารมณ์ทั่วไป: ${moodTh[latestMoodLog.mood] || latestMoodLog.mood}`;
      }

      const journalVal = latestLogWithJournal?.journal || "ยังไม่มีข้อความบันทึก";
      const problemTreePathVal = latestLogWithProblemTree?.problemTreePath ? latestLogWithProblemTree.problemTreePath.join(" -> ") : "ยังไม่มีเส้นทางต้นไม้ปัญหา";

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: contextHistory,
          userContext: {
            nickname: profile.nickname,
            targetGroup: profile.targetGroup,
            recentLogsSummary: recentLogsSummary || 'ยังไม่มีการสะท้อนอารมณ์หรือบันทึกสุขภาพจิตใดๆ ก่อนหน้านี้',
            assessmentResult: assessmentResultVal,
            journal: journalVal,
            problemTreePath: problemTreePathVal
          }
        })
      });

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: data.reply || "พี่ฮีลใจอยู่ตรงนี้เคียงข้างเสมอนะคะ",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'model',
        text: "โอ๊ะ... อินเทอร์เน็ตอาจจะขัดข้องสักวินาที แต่พี่ฮีลใจยังส่งกำลังใจโอบกอดคุณไม่ขาดสายนะคะ ลองระบายอีกรอบนะคะ",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-natural-sage/35 overflow-hidden">
      
      {/* Mini Profile Banner */}
      <div className="bg-white/90 backdrop-blur px-4 py-3 border-b border-natural-secondary/10 flex items-center justify-between z-10 font-display">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-natural-secondary to-natural-primary flex items-center justify-center text-white font-bold select-none text-base shadow-sm">
              🌿
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-natural-primary rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black text-natural-primary flex items-center gap-1.5">
              พี่ฮีลใจ 
              <span className="text-[9px] font-bold text-natural-primary bg-natural-sage border border-natural-secondary/15 px-1.5 py-0.5 rounded-full">
                พร้อมเป็นที่พึ่งค่ะ
              </span>
            </h3>
            <p className="text-[10px] text-natural-primary/80 font-semibold">พื้นที่ไม่ตัดสิน ปลอดภัย 100%</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            if (window.confirm("คุณแน่ใจไหมคะว่าต้องการล้างหน้าแชทนี้?")) {
              setMessages([
                {
                  id: 'welcome',
                  role: 'model',
                  text: `แชทถูกรีเซ็ตเรียบร้อยแล้วค่ะคุณ ${profile.nickname} 😊 น้องสะดุดเรื่องอะไรอยากปรับเปลี่ยนเรื่องไหนลองเล่าระบายใหม่ได้ตลอดเลยนะคะ`,
                  timestamp: new Date()
                }
              ]);
            }
          }}
          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 rounded-lg transition-all"
          title="ล้างแชท"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
        
        {messages.map((m) => {
          const isMe = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''} animate-fade-in`}
            >
              {/* Avatar indicator */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs select-none ${
                  isMe
                    ? 'bg-linear-to-br from-natural-secondary to-natural-primary text-white'
                    : 'bg-natural-sage text-natural-primary'
                }`}
              >
                {isMe ? 'คุณ' : '🌿'}
              </div>

              {/* Chat Bubble container */}
              <div className={`flex flex-col max-w-[76%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-3xs whitespace-pre-line border ${
                    isMe
                      ? 'bg-natural-sage/60 text-natural-primary border-natural-secondary/20 rounded-tr-none'
                      : 'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
                
                {/* Timestamp */}
                <span className="text-[8px] text-slate-400 mt-1 font-semibold">
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-natural-sage text-natural-primary flex items-center justify-center text-xs shrink-0 select-none animate-bounce">
              🌿
            </div>
            <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-3xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-natural-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-natural-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-natural-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Suggestions */}
      {messages.length === 1 && !loading && (
        <div className="px-4 py-2 bg-gradient-to-t from-white to-transparent">
          <p className="text-[10px] font-bold text-natural-primary/60 mb-1.5 flex items-center gap-1 px-1">
            <Sparkles className="w-3.5 h-3.5 text-natural-secondary fill-natural-secondary/20" />
            คำแนะนำเริ่มสนทนา:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {starterChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                className="text-[11px] font-semibold text-slate-600 bg-white hover:bg-natural-sage hover:text-natural-primary hover:border-natural-secondary/50 px-2.5 py-1 rounded-full border border-slate-200 transition-all text-left shadow-3xs cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Inputs Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 bg-white border-t border-slate-100/50 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`คุยระบายกับพี่ฮีลใจตรงนี้...`}
          disabled={loading}
          className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-natural-secondary focus:ring-1 focus:ring-natural-secondary focus:outline-hidden transition-all bg-natural-sage/10 disabled:opacity-60"
          maxLength={300}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-natural-secondary hover:bg-natural-primary active:scale-95 text-white rounded-xl transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer shadow-sm shadow-natural-secondary/15"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
