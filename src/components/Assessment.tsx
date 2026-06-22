import React, { useState } from 'react';
import { Phone, CheckCircle, AlertTriangle, ArrowRight, Heart, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: { label: string; score: number }[];
}

const TWO_Q: Question[] = [
  {
    id: '2q-1',
    text: 'ใน 2 สัปดาห์ที่ผ่านมารวมวันนี้ มีความรู้สึกเศร้า หมองหม่น หรือท้อแท้สิ้นหวังบ้างไหมคะ? 💙',
    options: [
      { label: 'ไม่มีเลยค่ะ', score: 0 },
      { label: 'มีบางครั้ง / รู้สึกบ้าง', score: 1 }
    ]
  },
  {
    id: '2q-2',
    text: 'ใน 2 สัปดาห์ที่ผ่านมารวมวันนี้ รู้สึกเบื่อ ไม่อยากทำอะไร หรือไม่มีความสุขในสิ่งที่เคยชอบบ้างไหมคะ? 🌿',
    options: [
      { label: 'ไม่มีเลยค่ะ', score: 0 },
      { label: 'มีบ้างค่ะ', score: 1 }
    ]
  }
];

const NINE_Q: Question[] = [
  {
    id: '9q-1',
    text: 'เบื่อหน่าย ไม่สนใจอยากทำอะไรเลยบ้างไหมคะ?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'มีบางวัน', score: 1 },
      { label: 'มีบ่อยมาก', score: 2 },
      { label: 'มีทุกวันเลยค่ะ / เกือบทุกวัน', score: 3 }
    ]
  },
  {
    id: '9q-2',
    text: 'รู้สึกไม่สบายใจ ซึมเศร้า ท้อแท้ คล้ายหัวใจอึดอัดหนักอึ้ง?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'มีบางวัน', score: 1 },
      { label: 'มีบ่อยมาก', score: 2 },
      { label: 'มีทุกวันเลยค่ะ / เกือบทุกวัน', score: 3 }
    ]
  },
  {
    id: '9q-3',
    text: 'หลับยาก หรือหลับๆ ตื่นๆ หรือนอนมากเกินปกติไป?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'มีบางวัน', score: 1 },
      { label: 'มีบ่อยมาก', score: 2 },
      { label: 'มีทุกวันเลยค่ะ / เกือบทุกวัน', score: 3 }
    ]
  },
  {
    id: '9q-4',
    text: 'รู้สึกเหนื่อยง่าย อ่อนเพลีย ไม่มีเรี่ยวแรงจะลุกขึ้นลุยงานเลย?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'มีบางวัน', score: 1 },
      { label: 'มีบ่อยมาก', score: 2 },
      { label: 'มีทุกวันเลยค่ะ / เกือบทุกวัน', score: 3 }
    ]
  },
  {
    id: '9q-5',
    text: 'เบื่ออาหาร หรือตรงกันข้ามคือกินกระจุยกระจายมากเกินไป?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'มีบางวัน', score: 1 },
      { label: 'มีบ่อยมาก', score: 2 },
      { label: 'มีทุกวันเลยค่ะ / เกือบทุกวัน', score: 3 }
    ]
  },
  {
    id: '9q-6',
    text: 'รู้สึกแย่กับตัวเอง คิดว่าตัวเองล้มเหลว หรือทำให้คนในครอบครัวผิดหวัง?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'มีบางวัน', score: 1 },
      { label: 'มีบ่อยมาก', score: 2 },
      { label: 'มีทุกวันเลยค่ะ / เกือบทุกวัน', score: 3 }
    ]
  },
  {
    id: '9q-7',
    text: 'สมาธิสั้นลงเวลาทำงาน จดจ่ออ่านข้อสอบ หรือจดจ่อเรื่องเรียน?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'มีบางวัน', score: 1 },
      { label: 'มีบ่อยมาก', score: 2 },
      { label: 'มีทุกวันเลยค่ะ / เกือบทุกวัน', score: 3 }
    ]
  },
  {
    id: '9q-8',
    text: 'พูดหรือทำอะไรช้าลงจนคนสังเกตเห็น หรือกระสับกระส่ายอยู่ไม่สุขเลย?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'มีบางวัน', score: 1 },
      { label: 'มีบ่อยมาก', score: 2 },
      { label: 'มีทุกวันเลยค่ะ / เกือบทุกวัน', score: 3 }
    ]
  },
  {
    id: '9q-9',
    text: 'คิดอยากทำร้ายตัวเอง หรือคิดว่าถ้าจากโลกนี้ไปเสียคงจะดีกว่าใช่ไหมคะ? (พี่อยู่ข้างๆ นะ)',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'มีบางวัน', score: 1 },
      { label: 'มีบ่อยมาก', score: 2 },
      { label: 'มีทุกวันเลยค่ะ / เกือบทุกวัน', score: 3 }
    ]
  }
];

const EIGHT_Q: Question[] = [
  {
    id: '8q-1',
    text: 'ในช่วง 1 เดือนที่ผ่านมานี้ คุณเคยคิดอยากฆ่าตัวตาย หรือคิดว่าตายไปเสียดีกว่าไหมคะ?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'เคยคิดค่ะ / มีบางวัน', score: 1 }
    ]
  },
  {
    id: '8q-2',
    text: 'เคยพยายามหาวิธีทำร้ายตัวเอง หรือเตรียมสิ่งของเพื่อทำร้ายตัวเองบ้างไหมคะ?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'เคยทำ / มีบางครั้ง', score: 2 }
    ]
  },
  {
    id: '8q-3',
    text: 'มีแผนการประสงค์จะฆ่าตัวตายในใจชัดเจนไหมคะ?',
    options: [
      { label: 'ไม่มีเลย', score: 0 },
      { label: 'เคยคิดและวางแผนในใจ', score: 4 }
    ]
  },
  {
    id: '8q-4',
    text: 'คุณเคยลงมือพยายามทำร้ายตัวเองหรือพยายามฆ่าตัวตายในช่วงที่ผ่านมาไหมคะ?',
    options: [
      { label: 'ไม่เคยเลยค่ะ', score: 0 },
      { label: 'เคยทำลงไปแล้ว', score: 8 }
    ]
  }
];

const ST_5: Question[] = [
  {
    id: 'st-1',
    text: 'ในช่วง 1 เดือนที่ผ่านมา คุณมีปัญหาการนอนหลับ นอนไม่หลับ หรือหลับมากเกินไปบ้างไหมคะ? 💤',
    options: [
      { label: 'แทบไม่มีเลย', score: 0 },
      { label: 'บางครั้ง', score: 1 },
      { label: 'บ่อยครั้ง', score: 2 },
      { label: 'ประจำ / ตลอดเวลา', score: 3 }
    ]
  },
  {
    id: 'st-2',
    text: 'รู้สึกไม่สบายใจ กังวลใจ หรือรู้สึกหงุดหงิดง่ายขึ้นในชีวิตประจำวันบ้างไหมคะ? 😟',
    options: [
      { label: 'แทบไม่มีเลย', score: 0 },
      { label: 'บางครั้ง', score: 1 },
      { label: 'บ่อยครั้ง', score: 2 },
      { label: 'ประจำ / ตลอดเวลา', score: 3 }
    ]
  },
  {
    id: 'st-3',
    text: 'รู้สึกเบื่อหน่าย เซ็ง ไม่อยากทำอะไร หรือไม่มีความสุขในการทำกิจกรรมต่างๆ บ้างไหมคะ? 🍂',
    options: [
      { label: 'แทบไม่มีเลย', score: 0 },
      { label: 'บางครั้ง', score: 1 },
      { label: 'บ่อยครั้ง', score: 2 },
      { label: 'ประจำ / ตลอดเวลา', score: 3 }
    ]
  },
  {
    id: 'st-4',
    text: 'มีสมาธิน้อยลงเวลาทำงาน เรียน หรือเวลาตั้งใจทำสิ่งต่างๆ บ้างไหมคะ? 📝',
    options: [
      { label: 'แทบไม่มีเลย', score: 0 },
      { label: 'บางครั้ง', score: 1 },
      { label: 'บ่อยครั้ง', score: 2 },
      { label: 'ประจำ / ตลอดเวลา', score: 3 }
    ]
  },
  {
    id: 'st-5',
    text: 'รู้สึกไม่อยากพบปะผู้คน ไม่อยากสุงสิงกับใคร หรืออยากอยู่คนเดียวเงียบๆ บ้างไหมคะ? 🚪',
    options: [
      { label: 'แทบไม่มีเลย', score: 0 },
      { label: 'บางครั้ง', score: 1 },
      { label: 'บ่อยครั้ง', score: 2 },
      { label: 'ประจำ / ตลอดเวลา', score: 3 }
    ]
  }
];


export default function Assessment({
  nickname,
  onCompleteCheck
}: {
  nickname: string;
  onCompleteCheck: (screening: string, score: number, status: string, advice: string) => void;
}) {
  const [currentScreen, setCurrentScreen] = useState<'intro' | '2q' | '9q' | '8q' | 'st5' | 'result'>('intro');
  const [qIndex, setQIndex] = useState(0);
  const [scoreAcc, setScoreAcc] = useState(0);

  const [twoQResult, setTwoQResult] = useState<{ score: number; level: string; advice: string } | null>(null);
  const [nineQResult, setNineQResult] = useState<{ score: number; level: string; advice: string } | null>(null);
  const [eightQResult, setEightQResult] = useState<{ score: number; hasSuicideRisk: boolean } | null>(null);
  const [st5Result, setSt5Result] = useState<{ score: number; level: string; advice: string } | null>(null);

  const startTest = () => {
    setCurrentScreen('2q');
    setQIndex(0);
    setScoreAcc(0);
  };

  const handle2QAnswer = (score: number) => {
    const newScore = scoreAcc + score;
    const nextIdx = qIndex + 1;

    if (nextIdx < TWO_Q.length) {
      setQIndex(nextIdx);
      setScoreAcc(newScore);
    } else {
      const hasRisk = newScore >= 1;
      setTwoQResult({
        score: newScore,
        level: hasRisk ? 'มีความเสี่ยงซึมเศร้าขั้นต้น' : 'ปกติ (ไม่มีความเสี่ยง)',
        advice: hasRisk ? 'แนะนำให้ทำการประเมิน 9Q ต่อเพื่อคัดกรองอย่างละเอียดค่ะ' : 'คุณเก่งมาก ดูแลรักษาใจผ่อนคลายอย่างมีความสุขนะคะ'
      });

      if (hasRisk) {
        setTimeout(() => {
          setCurrentScreen('9q');
          setQIndex(0);
          setScoreAcc(0);
        }, 300);
      } else {
        setTimeout(() => {
          setCurrentScreen('st5');
          setQIndex(0);
          setScoreAcc(0);
        }, 300);
      }
    }
  };

  const handle9QAnswer = (score: number) => {
    const newScore = scoreAcc + score;
    const nextIdx = qIndex + 1;

    if (nextIdx < NINE_Q.length) {
      setQIndex(nextIdx);
      setScoreAcc(newScore);
    } else {
      // 9Q Summary
      let level = 'ไม่มีหรือเกณฑ์น้อยมาก';
      let advice = 'คุณคนเก่งมีสภาพใจทั่วไปอยู่ในเกณฑ์ดีเลยค่ะ ยืดหยุ่นจิตใจด้วยกิจกรรมผ่อนคลายรอบตัวนะคะ';
      
      if (newScore >= 7 && newScore <= 12) {
        level = 'ซึมเศร้าระดับน้อย';
        advice = 'เริ่มมีความหม่นหมองเล็กๆ แนะนำคุยระบายกับพี่ฮีลใจ AI หรือทำกิจกรรมที่สนใจร่วมใจฟื้นจิตค่ะ';
      } else if (newScore >= 13 && newScore <= 18) {
        level = 'ซึมเศร้าระดับปานกลาง';
        advice = 'มีความหม่นหมองปานกลาง แนะนำให้พูดคุยกับผู้เชี่ยวชาญหรือเข้าสู่กระบวนการบำบัดร่วมด้วยค่ะ';
      } else if (newScore >= 19) {
        level = 'ซึมเศร้าระดับรุนแรง';
        advice = 'มีภาวะซึมเศร้าระดับรุนแรง ควรได้รับบริการจากสถาบันการแพทย์ทันทีเพื่อช่วยดูแลใจนะคะ';
      }

      setNineQResult({ score: newScore, level, advice });

      // After 9Q, go to 8Q (assess suicide risk)
      setTimeout(() => {
        setCurrentScreen('8q');
        setQIndex(0);
        setScoreAcc(0);
      }, 300);
    }
  };

  const handle8QAnswer = (score: number) => {
    const newScore = scoreAcc + score;
    const nextIdx = qIndex + 1;

    if (nextIdx < EIGHT_Q.length) {
      setQIndex(nextIdx);
      setScoreAcc(newScore);
    } else {
      // 8Q Summary
      const hasSuicideRisk = newScore >= 1;
      setEightQResult({ score: newScore, hasSuicideRisk });

      // After 8Q, move to ST-5 Stress Test
      setTimeout(() => {
        setCurrentScreen('st5');
        setQIndex(0);
        setScoreAcc(0);
      }, 300);
    }
  };

  const handleST5Answer = (score: number) => {
    const newScore = scoreAcc + score;
    const nextIdx = qIndex + 1;

    if (nextIdx < ST_5.length) {
      setQIndex(nextIdx);
      setScoreAcc(newScore);
    } else {
      // ST-5 Summary
      let level = 'ปกติ';
      let advice = 'ระดับความเครียดสะสมของคุณปกติมาก ดีเลิศค่ะ คอยมองหางานอดิเรกที่ชอบสม่ำเสมอนะคะ';
      
      if (newScore >= 5 && newScore <= 7) {
        level = 'เครียดระดับปานกลาง';
        advice = 'มีความกระสับกระส่ายประสงค์ให้ข้ามผ่านงานหนัก ลองยืดเส้นยืดสาย ยินเสียงปักษ์นกธรรมชาติสะสมดุอาอฺค่ะ';
      } else if (newScore >= 8 && newScore <= 9) {
        level = 'เครียดระดับสูง';
        advice = 'ระดับความเครียดสูงลอย ควรพักเบรกผ่อนคลายด้วยดนตรีบำบัด หรือหยุดพักทำกิจกรรมที่ชอบด่วนๆ เลยนะคะ';
      } else if (newScore >= 10) {
        level = 'เครียดระดับรุนแรงมาก';
        advice = 'เครียดท่วมหัวบดบังทุกมุมคิด แนะนำลดการเสพข่าวหรือสิ่งกระตุ้น รีบเปลี่ยนบรรยากาศ โทรถามสายด่วน 1323 ฟื้นฟูโดยด่วนค่ะ';
      }

      setSt5Result({ score: newScore, level, advice });

      // Aggregate final results to parent to save Google spreadsheet!
      const finalDepressionScore = nineQResult ? nineQResult.score : (twoQResult ? twoQResult.score : 0);
      const finalDepressionStatus = nineQResult ? nineQResult.level : "ปกติจากการตรวจคัดกรอง (2Q)";
      const finalDepressionAdvice = nineQResult ? nineQResult.advice : "รักษาสุขภาพใจที่ดีต่อไปนะคะคุณคนดี";

      onCompleteCheck("WHO-TH screening block", finalDepressionScore, finalDepressionStatus, finalDepressionAdvice);

      // Transition to final result screen
      setTimeout(() => {
        setCurrentScreen('result');
      }, 300);
    }
  };

  const resetAllTests = () => {
    setTwoQResult(null);
    setNineQResult(null);
    setEightQResult(null);
    setSt5Result(null);
    setCurrentScreen('intro');
  };

  const renderActiveTest = () => {
    let qSet: Question[] = [];
    let title = "";
    let questionText = "";
    let handler: (score: number) => void = () => {};

    if (currentScreen === '2q') {
      qSet = TWO_Q;
      title = "คัดกรองความรู้สึกเศร้าขั้นต้น (2Q)";
      questionText = TWO_Q[qIndex].text;
      handler = handle2QAnswer;
    } else if (currentScreen === '9q') {
      qSet = NINE_Q;
      title = "ประเมินระดับความเศร้าเบื้องลึก (9Q)";
      questionText = NINE_Q[qIndex].text;
      handler = handle9QAnswer;
    } else if (currentScreen === '8q') {
      qSet = EIGHT_Q;
      title = "ประเมินระดับความเข้มงวดความเสี่ยง (8Q)";
      questionText = EIGHT_Q[qIndex].text;
      handler = handle8QAnswer;
    } else if (currentScreen === 'st5') {
      qSet = ST_5;
      title = "วัดระดับภาวะเครียดในชีวิต (ST-5)";
      questionText = ST_5[qIndex].text;
      handler = handleST5Answer;
    }

    const currentQuestions = qSet[qIndex];
    const progressPercent = Math.round(((qIndex + 1) / qSet.length) * 100);

    return (
      <div className="flex-1 flex flex-col justify-between p-5 bg-natural-sage/35 animate-fade-in font-display">
        
        {/* Header and Progress Bar */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between font-display">
            <span className="text-[10px] font-bold text-natural-primary bg-natural-sage px-2.5 py-1 rounded-full border border-natural-secondary/15">
              {title}
            </span>
            <span className="text-[10px] font-bold text-natural-primary/60">
              ข้อ {qIndex + 1}/{qSet.length}
            </span>
          </div>

          <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-natural-secondary/5">
            <div
              className="h-full bg-linear-to-r from-natural-secondary to-natural-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question bubble / Conversational card */}
        <div className="my-auto py-10 px-4 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-white border border-natural-secondary/15 rounded-full flex items-center justify-center text-xl shadow-xs">
            🌸
          </div>
          <h3 className="text-sm font-bold text-natural-primary leading-relaxed max-w-sm font-display">
            "{questionText}"
          </h3>
          <p className="text-[10px] text-natural-primary/70 font-medium pb-2">
            ไม่มีผิดหรือถูกนะคะ ตอบอย่างสบายใจเคียงข้างพี่ฮีลใจ
          </p>
        </div>

        {/* Floating Options buttons Grid */}
        <div className="space-y-2">
          {currentQuestions?.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handler(opt.score)}
              className="w-full py-3 px-4 bg-white hover:bg-natural-sage/30 text-natural-primary font-bold text-xs rounded-2xl border border-slate-100 hover:border-natural-secondary/30 text-left flex items-center justify-between transition-all cursor-pointer shadow-3xs"
            >
              <span>{opt.label}</span>
              <ArrowRight className="w-4 h-4 text-natural-secondary" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-natural-sage/35">
      
      {currentScreen === 'intro' && (
        <div className="flex-1 p-5 overflow-y-auto space-y-5 flex flex-col justify-between bg-gradient-to-b from-natural-sage/30 to-white">
          
          <div className="space-y-4 mt-2">
            <div className="text-center space-y-2 font-display">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-xs border border-natural-secondary/10">
                🌱
              </div>
              <h2 className="text-base font-black text-natural-primary">ประเมินสุขภาพใจมาตรฐาน (WHO & Thai NHS)</h2>
              <p className="text-[11px] text-natural-primary/80 max-w-xs mx-auto leading-relaxed">
                แบบทดสอบพูดคุยวัดระดับความซึมเศร้าและความเครียดตามหลักระเบียบสาธารณสุขไทย บันทึกผลอักษรในชีตอย่างเป็นความลับค่ะ
              </p>
            </div>

            {/* Explanatory flow banner */}
            <div className="bg-white/95 p-4 rounded-3xl border border-slate-200/40 shadow-xs space-y-3.5">
              <span className="text-[10px] font-bold text-natural-primary bg-natural-sage border border-natural-secondary/10 px-2.5 py-1 rounded-full font-display">
                ขั้นตอนการคัดกรองดูแลใจ:
              </span>
              <div className="space-y-2 text-xs text-[#5C6E64] font-semibold leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-natural-secondary text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">1</span>
                  <span>เริ่มด้วย **คัดกรองเบื้องต้น 2Q** (2 คำถามสั้นประเมินเศร้า)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-natural-secondary text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">2</span>
                  <span>หากพบความเสี่ยง จะเชื่อมต่อคัดกรอง **ระดับ 9Q และ 8Q** อย่างละเอียดถนอมใจ</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-natural-secondary text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">3</span>
                  <span>ต่อด้วยแบบสอบถาม **วัดความเครียด ST-5** ประสมประสานระดับความกดดันชีวิต</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={startTest}
              className="w-full py-3 bg-natural-secondary hover:bg-natural-primary text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
            >
              <span>เริ่มทำแบบประเมินใจค่ะ</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Speed Dial emergency hotline card */}
            <div className="p-3 bg-rose-50/70 border border-rose-100/40 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-rose-800 font-bold font-display">รู้สึกวิญญาณเหนื่อยหนักเกินจะทำแบบทดสอบ?</p>
                <p className="text-[9px] text-[#A66E6E] font-semibold">สายด่วนสุขภาพบริการตนเอง 24 ชม.</p>
              </div>
              <a
                href="tel:1323"
                className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>โทร 1323</span>
              </a>
            </div>
          </div>

        </div>
      )}

      {/* RENDER ACTIVE SCREEN QUESTIONS */}
      {(currentScreen === '2q' || currentScreen === '9q' || currentScreen === '8q' || currentScreen === 'st5') && renderActiveTest()}

      {/* SCREEN 5: FINAL SUMMARY RESULTS */}
      {currentScreen === 'result' && (
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-natural-sage/30 to-white">
          
          <div className="text-center space-y-1 block mt-2 font-display">
            <CheckCircle className="w-10 h-10 text-natural-primary mx-auto animate-bounce" />
            <h2 className="text-sm font-black text-natural-primary">ประเมินใจเสร็จเรียบร้อยค่ะคุณ {nickname}!</h2>
            <p className="text-[10px] text-natural-primary/60 font-semibold">สรุปคะแนนความรู้สึกประเมินผลตามระเบียบองค์กรสาธารณสุข</p>
          </div>

          {/* Combined results metrics card */}
          <div className="space-y-2.5 bg-white p-4 rounded-3xl border border-slate-200/40 shadow-xs">
            
            {/* 9Q / 2Q Result Block */}
            <div className="p-3 rounded-2xl bg-natural-sage/10 border border-natural-secondary/10 space-y-1">
              <span className="text-[9px] font-bold text-natural-primary bg-white px-1.5 py-0.5 rounded-full border border-natural-secondary/10 font-display">
                คะแนนระดับซึมเศร้า (Depression)
              </span>
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-natural-primary">
                  {nineQResult ? `${nineQResult.level} (คะแนน: ${nineQResult.score})` : 'ปกติ (ผ่านคัดกรอง 2Q)'}
                </p>
                <Heart className={`w-4 h-4 ${nineQResult && nineQResult.score >= 13 ? 'text-rose-500 animate-pulse' : 'text-natural-secondary'}`} />
              </div>
              <p className="text-[10px] text-[#5C6E64] italic font-semibold">
                {nineQResult ? nineQResult.advice : 'สุขภาพจิตของคุณปกติค่ะ หมั่นเติมความสุขด้วยดุอาอฺและฟังเพลงเบาสบายนะคะ'}
              </p>
            </div>

            {/* ST-5 Result Block */}
            {st5Result && (
              <div className="p-3 rounded-2xl bg-natural-sage/10 border border-natural-secondary/10 space-y-1">
                <span className="text-[9px] font-bold text-natural-primary bg-white px-1.5 py-0.5 rounded-full border border-natural-secondary/10 font-display">
                  ระดับความเครียดสะสม (ST-5 Stress)
                </span>
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-natural-primary">
                    {st5Result.level} (คะแนน: {st5Result.score}/15)
                  </p>
                  <span className="w-2.5 h-2.5 rounded-full bg-natural-secondary" />
                </div>
                <p className="text-[10px] text-[#5C6E64] italic font-semibold">{st5Result.advice}</p>
              </div>
            )}

            {/* Suicide risk block if applicable */}
            {eightQResult && eightQResult.hasSuicideRisk && (
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100/40 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-800 font-display">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-bold">มีสัญญาณกังวลใจ (8Q High Score)</span>
                </div>
                <p className="text-[10px] text-rose-600 font-medium">
                  จิตใจของคุณกำลังส่งสัญญาณวิกฤตอันหนักอึ้งอย่างไม่เคยเป็นมาก่อน พี่ฮีลใจอยากขอร้องให้คุณลองประสานติดต่อแพทย์ โทรสายด่วนคุยเพื่อพ้นภาระใจเบาใจนะคะ
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {/* Speed dial 1323 Button */}
            <a
              href="tel:1323"
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-bold flex justify-center items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <Phone className="w-4 h-4" />
              <span>คุยสายด่วนสุขภาพโทร 1323 ฟรี 24 ชม.</span>
            </a>

            <button
              onClick={resetAllTests}
              className="w-full py-2.5 bg-natural-sage hover:bg-natural-sage/70 text-natural-primary text-xs font-bold rounded-2xl flex justify-center items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>ทำแบบประเมินอีกครั้งค่ะ</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
