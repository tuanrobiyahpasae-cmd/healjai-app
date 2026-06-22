import React, { useState } from 'react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';
import { Sparkles, HeartHandshake, Lock, User, Users, Eye, EyeOff, Check, ArrowRight, ClipboardCheck, Heading } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: (profile: UserProfile) => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [showIntro, setShowIntro] = useState(true);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [targetGroup, setTargetGroup] = useState<'student' | 'general_labor' | 'unemployed' | 'merchant' | 'civil_servant' | 'teenager' | 'worker' | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [ageRange, setAgeRange] = useState<'18-25' | '26-34' | '35+' | ''>('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Local user registry to authenticate existing users
  const getRegisteredUsers = (): Record<string, { pin: string; targetGroup: 'student' | 'general_labor' | 'unemployed' | 'merchant' | 'civil_servant' | 'teenager' | 'worker' | ''; nickname: string; gender?: 'male' | 'female' | ''; ageRange?: '18-25' | '26-34' | '35+' | '' }> => {
    try {
      const data = localStorage.getItem('healjai_registered_accounts');
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanNickname = nickname.trim();
    if (!cleanNickname) {
      setError('กรุณากรอกชื่อเล่นด้วยนะคะ');
      return;
    }

    const cleanPin = pin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      setError('กรุณากรอกรหัสผ่านเป็นตัวเลข 4 หลักเท่านั้นค่ะ');
      return;
    }

    try {
      // 1. Try to login via Back-end API (Firestore Sync)
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: cleanNickname, pin: cleanPin })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMsg('เข้าสู่ระบบสำเร็จและดึงสถิติของท่านจากฐานข้อมูลคลาวด์แล้วค่ะ! 💚');
        setTimeout(() => {
          onStart(data.profile);
        }, 1000);
        return;
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 404) {
          setError(errJson.error || 'ข้อมูลไม่ถูกต้องค่ะ');
          return;
        }
      }
    } catch (e) {
      console.warn("Backend API login failed, falling back to local registry:", e);
    }

    const registry = getRegisteredUsers();
    const existingUser = registry[cleanNickname.toLowerCase()];

    if (!existingUser) {
      setError('ไม่พบชื่อเล่นบัญชีนี้ในระบบค่ะ หากเพิ่งเปิดใช้งานครั้งแรก สามารถกด "สมัครใช้งาน" ด้านล่างเพื่อเริ่มสร้างตัวตนที่แสนพิเศษได้เลยนะคะ 💚');
      return;
    }

    if (existingUser.pin !== cleanPin) {
      setError('รหัสผ่าน PIN 4 หลักไม่ถูกต้องสำหรับชื่อเล่นนี้ค่ะ ลองทบทวนดูอีกรอบนะคะ');
      return;
    }

    // Login success
    setSuccessMsg('เข้าสู่ระบบสำเร็จแล้วค่ะ! กำลังพาท่านไปยังพื้นที่อบอุ่นใจ... (โหมดอัจฉริยะแบบเครื่องผู้ใช้)');
    
    // Set profile state
    const loggedProfile: UserProfile = {
      nickname: existingUser.nickname || cleanNickname,
      email: cleanPin, // We store the PIN in the email field to match the existing schema & sync logs securely
      targetGroup: existingUser.targetGroup || 'teenager',
      gender: existingUser.gender || '',
      ageRange: existingUser.ageRange || ''
    };

    setTimeout(() => {
      onStart(loggedProfile);
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanNickname = nickname.trim();
    if (!cleanNickname) {
      setError('กรุณาตั้งชื่อเล่นด้วยนะคะ');
      return;
    }

    if (cleanNickname.length < 2) {
      setError('ชื่อเล่นควรยาวอย่างน้อย 2 ตัวอักษรเพื่อความอบอุ่นใจน้า');
      return;
    }

    const cleanPin = pin.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      setError('กรุณาตั้งรหัสรหัสผ่านเป็นตัวเลข 4 หลักเท่านั้นค่ะ');
      return;
    }

    const cleanConfirmPin = confirmPin.trim();
    if (cleanPin !== cleanConfirmPin) {
      setError('รหัสผ่าน PIN 4 หลักไม่ตรงกันค่ะ ลองกรอกยืนยันให้ตรงกันอีกครั้งนะคะ');
      return;
    }

    if (!gender) {
      setError('กรุณาเลือกเพศเพื่อความเป็นกันเองและอบอุ่นใจที่สุดค่ะ 💚');
      return;
    }

    if (!ageRange) {
      setError('กรุณาเลือกช่วงอายุเพื่อคำนวณและวิเคราะห์สถิติของคุณน้า 💚');
      return;
    }

    if (!targetGroup) {
      setError('กรุณาเลือกอาชีพของคุณ เพื่อระบบสามารถจัดสรรและแนะนำคำฮีลใจได้เหมาะสมที่สุดค่ะ');
      return;
    }

    // 1. Try to register through Back-end (syncing on Firestore)
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: cleanNickname,
          pin: cleanPin,
          targetGroup: targetGroup,
          gender: gender,
          ageRange: ageRange
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิกค่ะ');
        return;
      }
    } catch (e) {
      console.warn("Backend API register failed, proceeding locally:", e);
    }

    const registry = getRegisteredUsers();
    if (registry[cleanNickname.toLowerCase()]) {
      setError('ชื่อบัญชีนี้มีอยู่ในระบบแล้วค่ะ หากเป็นของคุณ สามารถสลับไปที่หน้า "เข้าสู่ระบบ" เพื่อใช้งานได้เลยน้า');
      return;
    }

    // Register user account safely
    const updatedRegistry = {
      ...registry,
      [cleanNickname.toLowerCase()]: {
        pin: cleanPin,
        targetGroup: targetGroup,
        nickname: cleanNickname,
        gender: gender,
        ageRange: ageRange
      }
    };
    localStorage.setItem('healjai_registered_accounts', JSON.stringify(updatedRegistry));

    setSuccessMsg('สมัครบัญชีใหม่ของคุณเรียบร้อยแล้วค่ะ! เตรียมบันทึกความรู้สึกแสนพิถีพิถันกัน...');

    const newProfile: UserProfile = {
      nickname: cleanNickname,
      email: cleanPin,
      targetGroup: targetGroup,
      gender: gender,
      ageRange: ageRange
    };

    setTimeout(() => {
      onStart(newProfile);
    }, 1200);
  };

  const toggleMode = () => {
    setError('');
    setSuccessMsg('');
    setNickname('');
    setPin('');
    setConfirmPin('');
    setTargetGroup('');
    setGender('');
    setAgeRange('');
    setIsRegisterMode(!isRegisterMode);
  };

  if (showIntro) {
    return (
      <div id="intro-screen-wrapper" className="flex-1 flex flex-col bg-gradient-to-b from-[#FAFDFB] via-[#E2F3EE] to-[#CCEAE2] overflow-y-auto p-5 justify-center items-center select-none font-sans min-h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm mx-auto flex flex-col justify-between my-auto space-y-6"
        >
          {/* Top section: Beautiful cartoon image of Muslim woman drinking hot coffee/tea */}
          <div className="w-full aspect-[4/5] bg-white rounded-[32px] overflow-hidden shadow-2xs border-4 border-white relative">
            <img 
              src="/src/assets/images/welcome_muslim_woman_1779712801902.png" 
              alt="Assalamu Alaikum Welcome" 
              className="w-full h-full object-cover scale-102"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Middle section: Welcome and text */}
          <div className="text-center px-4 space-y-3.5">
            <h1 className="text-2xl font-black text-[#1C4E44] tracking-tight font-display">
              อัสสาลามูอาลัยกุม 🌿
            </h1>
            <p className="text-[11.5px] sm:text-xs text-[#2A5950] font-bold leading-relaxed max-w-[270px] mx-auto opacity-95">
              ยินดีต้อนรับสู่พื้นที่ปลอดภัยของคุณ ที่นี่ไม่มีการตัดสิน คุณสามารถเล่าเรื่องราวและความรู้สึกได้อย่างสบายใจ
            </p>
          </div>

          {/* Bottom section: Start Button */}
          <div className="px-4">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full py-4 px-6 bg-white hover:bg-[#F2FAF7] text-[#1D3E3A] hover:scale-101 hover:shadow-xs active:scale-98 text-xs font-black rounded-full cursor-pointer transition-all shadow-2xs text-center flex items-center justify-center gap-1.5 border border-[#1C4E44]/10 font-sans"
            >
              <span>เริ่มต้นใช้งาน</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="welcome-screen-wrapper" className="flex-1 flex flex-col bg-gradient-to-b from-[#FAFDFB] via-[#F4FAF6] to-[#EAF5F0] overflow-y-auto px-6 py-8 justify-center select-none font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm mx-auto space-y-6 text-[20px]"
      >
        {/* App Logo & Welcome messages */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-600 shadow-sm border border-emerald-100/50">
            <HeartHandshake className="w-10 h-10 animate-pulse text-emerald-500" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black font-display text-emerald-950 tracking-tight flex items-center justify-center gap-1.5">
              <span>ฮีลใจ Healjai</span>
              <Sparkles className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
            </h1>
            <p className="text-xs text-slate-500 font-bold max-w-[270px] mx-auto leading-relaxed">
              พื้นที่ปลอดภัยเพื่อสะท้อนความรู้สึก และดูแลสุขภาพหัวใจของคุณอย่างเป็นส่วนตัวและอ่อนโยน 💚
            </p>
          </div>
        </div>

        {/* Authentication Form Card */}
        <div className="bg-white rounded-3xl border border-emerald-100/40 p-5 shadow-sm space-y-4">
          <div className="border-b border-rose-50 pb-3">
            <h2 className="text-xs font-black text-emerald-950 flex items-center gap-1">
              <span>🔑 {isRegisterMode ? 'สร้างบัญชีผู้ใช้ใหม่ (Register)' : 'เข้าสู่ระบบบัญชีส่วนตัว (Login)'}</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5 leading-relaxed">
              {isRegisterMode 
                ? 'ร่วมสมัครบัญชีเพื่อเปิดพื้นที่ลับของตัวคุณเอง ยืนยันข้อมูลทั้งหมดเพื่อเริ่มบันทึกอย่างปลอดภัยค่ะ'
                : 'กรอกชื่อเล่นและ PIN 4 หลัก เพื่อปกป้องประวัติสุขภาพใจของคุณให้พ้นสายตาอื่นน้า 💚'}
            </p>
          </div>

          {/* Form container */}
          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-3.5">
            {/* Nickname / Username */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {isRegisterMode ? 'ตั้งชื่อเล่นของคุณ (สำหรับใช้ในระบบ)' : 'ชื่อเล่นที่คุณลงทะเบียนไว้'}
              </label>
              <input
                id="auth-nickname-input"
                type="text"
                maxLength={15}
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError('');
                }}
                placeholder={isRegisterMode ? "เช่น ใต้ปีกนก, ก้อนเมฆสีฟ้า" : "ชื่อเล่นของคุณ..."}
                className="w-full text-xs font-black border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 placeholder:text-slate-400 text-slate-800 transition-all font-sans"
              />
            </div>

            {/* PIN (4 Digits) */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                {isRegisterMode ? 'ตั้งรหัส PIN 4 หลัก (สำหรับความปลอดภัย)' : 'รหัส PIN 4 หลักของคุณ'}
              </label>
              <div className="relative">
                <input
                  id="auth-pin-input"
                  type={showPin ? 'text' : 'password'}
                  pattern="\d*"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPin(val);
                    setError('');
                  }}
                  placeholder="ตัวเลข 4 หลัก (เช่น 8888)"
                  className="w-full text-xs font-mono font-black border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 placeholder:text-slate-400 text-slate-800 tracking-widest transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm PIN (Only in Register Mode) */}
            {isRegisterMode && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
                  ยืนยันรหัส PIN 4 หลักของคุณอีกครั้ง
                </label>
                <div className="relative">
                  <input
                    id="auth-confirm-pin-input"
                    type={showConfirmPin ? 'text' : 'password'}
                    pattern="\d*"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setConfirmPin(val);
                      setError('');
                    }}
                    placeholder="กรอกรหัส PIN เดิมเพื่อยืนยันอีกครั้ง..."
                    className="w-full text-xs font-mono font-black border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50/50 placeholder:text-slate-400 text-slate-800 tracking-widest transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Gender Selection (Only in Register Mode) */}
            {isRegisterMode && (
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100 animate-fade-in">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    เพศของคุณ
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'male', label: '🙋‍♂️ ชาย' },
                    { id: 'female', label: '🙋‍♀️ หญิง' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setGender(item.id as any);
                        setError('');
                      }}
                      className={`p-2.5 text-[10.5px] font-black rounded-xl border text-center transition-all cursor-pointer ${
                        gender === item.id
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-3xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Age Range Selection (Only in Register Mode) */}
            {isRegisterMode && (
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100 animate-fade-in">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    ช่วงอายุของคุณ
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: '18-25', label: '18-25 ปี' },
                    { id: '26-34', label: '26-34 ปี' },
                    { id: '35+', label: '35 ปีขึ้นไป' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setAgeRange(item.id as any);
                        setError('');
                      }}
                      className={`p-2 text-[10.5px] font-black rounded-xl border text-center transition-all cursor-pointer ${
                        ageRange === item.id
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-3xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Occupation select (Only in Register Mode) */}
            {isRegisterMode && (
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100 animate-fade-in">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[10px] font-black text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    อาชีพของคุณ
                  </label>
                  <span className="text-[8px] text-slate-400 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded-sm">
                    ข้อมูลส่วนบุคคล
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'student', label: '🎓 กำลังศึกษา' },
                    { id: 'general_labor', label: '🔨 รับจ้างทั่วไป' },
                    { id: 'unemployed', label: '🌾 ว่างงาน' },
                    { id: 'merchant', label: '🛍️ ค้าขาย' },
                    { id: 'civil_servant', label: '👔 ข้าราชการ' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setTargetGroup(item.id as any);
                        setError('');
                      }}
                      className={`p-2.5 text-[10.5px] font-black rounded-xl border text-center transition-all cursor-pointer ${
                        targetGroup === item.id
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-3xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message display with animation */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-center text-[10px] text-rose-600 font-bold"
              >
                ⚠️ {error}
              </motion.div>
            )}

            {/* Success Message display with animation */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-center text-[10px] text-emerald-800 font-bold"
              >
                💚 {successMsg}
              </motion.div>
            )}

            {/* Remember user badge in login */}
            {!isRegisterMode && (
              <div className="bg-emerald-50/40 border border-emerald-100/60 rounded-2xl p-2.5 flex items-center gap-2">
                <div className="p-1 bg-emerald-500 rounded-full text-white shrink-0">
                  <Check className="w-3 h-3" />
                </div>
                <p className="text-[10px] font-black text-emerald-800 leading-tight">
                  จดจำในอุปกรณ์เครื่องนี้แล้ว (Login สำเร็จจะอยู่ยาวค่ะ)
                </p>
              </div>
            )}

            {/* Main Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-xs text-center flex items-center justify-center gap-1.5 mt-2"
            >
              <span>{isRegisterMode ? 'สร้างบัญชีดูแลใจ 💚' : 'เริ่มต้นฟื้นฟูจิตใจกัน 💚'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle View Mode Buttons */}
          <div className="pt-2 border-t border-slate-100 text-center">
            {isRegisterMode ? (
              <button
                id="toggle-login-btn"
                type="button"
                onClick={toggleMode}
                className="text-[10.5px] font-black text-emerald-700 hover:text-emerald-900 focus:outline-hidden cursor-pointer flex items-center justify-center gap-1 mx-auto"
              >
                <span>มีบัญชีรักสุขภาพใจอยู่แล้ว?</span>
                <span className="underline font-black font-display text-emerald-600">เข้าสู่ระบบได้ที่นี่</span>
              </button>
            ) : (
              <button
                id="toggle-register-btn"
                type="button"
                onClick={toggleMode}
                className="text-[10.5px] font-black text-rose-700 hover:text-rose-950 focus:outline-hidden cursor-pointer flex items-center justify-center gap-1 mx-auto animate-pulse"
              >
                <span>ยังไม่มีบัญชีสุขภาพใจ?</span>
                <span className="underline font-black font-display text-emerald-600">สมัครใช้งานคลิกที่นี่</span>
              </button>
            )}
          </div>
        </div>

        {/* Security / Privacy notes footer */}
        <p className="text-center text-[9px] text-slate-400 font-semibold max-w-[280px] mx-auto leading-relaxed">
          🔒 ข้อมูลทั้งหมดถูกป้องกันภายใต้ PIN 4 หลักความปลอดภัยสูงสุด ปลอดภัยและรับชมได้ประวัติส่วนบุคคลเท่านั้นในเครื่องคุณค่ะ 💚
        </p>
      </motion.div>
    </div>
  );
}
