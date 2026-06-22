import React, { useState, useEffect } from 'react';
import { UserProfile, MentalHealthLog, MoodType, showToast } from '../types';
import MoodCheck from './MoodCheck';
import DailyTasks from './DailyTasks';
import { 
  Phone, Heart, Sparkles, Calendar, ChevronRight, ChevronLeft, BarChart3, 
  Clock, Users, AlertCircle, RefreshCw, Eye, Sparkle, Smile, HeartHandshake, ShieldCheck, Database
} from 'lucide-react';
import { 
  fetchGoogleContacts, 
  backupToGoogleDrive, 
  listBackupsFromGoogleDrive, 
  downloadBackupFromGoogleDrive,
  GoogleContact,
  GoogleDriveBackupFile
} from '../lib/googleDriveAndPeopleService';

interface HomeDashboardProps {
  profile: UserProfile;
  logs: MentalHealthLog[];
  onSaveMood: (mood: MoodType, journal: string) => void;
  setActiveTab: (tab: any) => void;
  googleUser: any;
  googleToken?: string | null;
  onConnectGoogle: () => void;
  isSyncingSheets: boolean;
  onDisconnectGoogle: () => void;
  onManualSync: () => void;
  spreadsheetId: string;
  spreadsheetUrl: string;
  onCreateNewSheet: () => Promise<void>;
  onSaveCustomSheetId: (id: string) => void;
  onResetToDemoSheet: () => void;
  onRestoreLogs?: (restoredLogs: MentalHealthLog[]) => void;
}

const HEAL_QUOTES = [
  "คุณมีคุณค่ามากกว่าที่คิดนะคะ ยิ้มเข้าไว้น้า 💚",
  "ทุกปัญหามีทางออกเสมอ... หากก้าวช้าลงอีกนิด จะเห็นทางประตูดวงใหม่นะคะ",
  "ความพยายามในวันนี้ จะผลิบานเป็นความสงบและเบาสบายในหัวใจวันพรุ่งนี้ค่ะ",
  "การพักผ่อนไม่ใช่ความล้มเหลว แต่เป็นการให้เวลาหัวใจได้สูดอากาศสะอาด",
  "ไม่มีวันใดสายเกินไปเด็ดขาด สำหรับการใจดีและอ่อนโยนต่อตัวเองนะคะ 🥰",
  "ความสุขไม่ได้ขึ้นอยู่กับความสำเร็จอันยิ่งใหญ่ แต่อยู่ระหว่างก้าวเล็กย่อยๆ ที่เธอเดิน",
  "ไม่มีความทุกข์ใดจะประดิษฐานถาวร ท้องที่มืดที่สุดก่อนรุ่งสางจะสว่างกว่าคิดน้า"
];

export default function HomeDashboard({ 
  profile, 
  logs, 
  onSaveMood, 
  setActiveTab,
  googleUser,
  googleToken,
  onConnectGoogle,
  isSyncingSheets,
  onDisconnectGoogle,
  onManualSync,
  spreadsheetId,
  spreadsheetUrl,
  onCreateNewSheet,
  onSaveCustomSheetId,
  onResetToDemoSheet,
  onRestoreLogs
}: HomeDashboardProps) {
  const [currentView, setCurrentView] = useState<'personal' | 'community'>('personal');
  const [calendarOffset, setCalendarOffset] = useState<number>(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Monthly Calendar Navigation & Details State
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date());

  // Google Drive & Contacts Sync States
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [trustedGuardians, setTrustedGuardians] = useState<{ name: string; phone: string }[]>(() => {
    const cached = localStorage.getItem(`healjai_trusted_guardians_${profile.nickname}`);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { return []; }
    }
    return [];
  });

  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);
  const [isLoadingBackupsDrive, setIsLoadingBackupsDrive] = useState(false);
  const [driveBackups, setDriveBackups] = useState<GoogleDriveBackupFile[]>([]);
  const [showDriveBackupsList, setShowDriveBackupsList] = useState(false);

  // Google Contacts sync action
  const handleLoadGoogleContacts = async () => {
    if (!googleToken) {
      showToast('ไม่ได้เชื่อมต่อบัญชี Google', 'warning', 'กรุณาเชื่อมต่อบัญชี Google ก่อนนะคะ');
      return;
    }
    setIsLoadingContacts(true);
    try {
      const gContacts = await fetchGoogleContacts(googleToken);
      setContacts(gContacts);
      setShowContactsModal(true);
      showToast('ดึงรายชื่อจาก Google สำเร็จค่ะ 👥', 'success', `พบผู้ติดต่อทั้งหมด ${gContacts.length} คน พร้อมให้คุณเลือกผู้พิทักษ์ใจแล้วค่ะ`);
    } catch (err: any) {
      console.error(err);
      showToast('ดึงรายชื่อผิดพลาด', 'warning', `ไม่สามารถดึงข้อมูลได้: ${err.message || err}`);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleAddGuardianFromContact = (contact: GoogleContact) => {
    if (trustedGuardians.length >= 3) {
      showToast('ผู้พิทักษ์เต็มแล้วค่ะ 🌸', 'warning', 'คุณสามารถบันทึกผู้พิทักษ์ใจได้สูงสุด 3 คนนะคะ ลบคนอื่นออกก่อนเพื่อเพิ่มใหม่ค่ะ');
      return;
    }
    // Check if duplicate
    if (trustedGuardians.some(g => g.phone === contact.phone)) {
      showToast('รายชื่อซ้ำค่ะ', 'warning', 'คนสำคัญคนนี้อยู่ในรายชื่อผู้พิทักษ์อยู่แล้วนะคะ 💚');
      return;
    }
    const updated = [...trustedGuardians, { name: contact.name, phone: contact.phone }];
    setTrustedGuardians(updated);
    localStorage.setItem(`healjai_trusted_guardians_${profile.nickname}`, JSON.stringify(updated));
    setShowContactsModal(false);
    showToast('เพิ่มผู้พิทักษ์ใจสำเร็จค่ะ 💖', 'success', `คุณคนสำคัญ "${contact.name}" ได้เข้ามาคอยดูแลระวังใจคุณเคียงข้างพี่ฮีลใจแล้วน้า`);
  };

  const handleDeleteGuardian = (index: number) => {
    if (!window.confirm("คุณต้องการนำผู้พิทักษ์ใจท่านนี้ออกจากแผงติดต่อใช่รักษาถูกต้องไหมล่ะคะ?")) return;
    const updated = trustedGuardians.filter((_, i) => i !== index);
    setTrustedGuardians(updated);
    localStorage.setItem(`healjai_trusted_guardians_${profile.nickname}`, JSON.stringify(updated));
    showToast('ลบข้อมูเรียบร้อยแล้วค่ะ 🌿', 'info', 'นำข้อมูลผู้พิทักษ์ออกจากระบบแล้วน้า');
  };

  // Google Drive backup action
  const handleCreateDriveBackup = async () => {
    if (!googleToken) {
      showToast('ไม่ได้เชื่อมต่อบัญชี', 'warning', 'กรุณาเชื่อมต่อบัญชี Google ก่อนทำการสำรองข้อมูลนะคะ');
      return;
    }
    setIsBackingUpDrive(true);
    try {
      showToast('กำลังสำรองข้อมูล...', 'info', 'ระบบกำลังจัดเตรียมไฟล์และนำส่งเข้า Google Drive ของคุณนะคะ');
      const res = await backupToGoogleDrive(googleToken, profile.nickname, logs);
      if (res.success) {
        showToast('สำรองข้อมูลสำเร็จบริบูรณ์ค่ะ! ☁️🟢', 'success', 'ข้อมูลอารมณ์และใบประเมินทั้งหมด จัดเก็บไว้ใน Google Drive ของคุณอย่างอบอุ่นปลอดภัยแล้วค่ะ');
        if (showDriveBackupsList) {
          handleLoadDriveBackupsList();
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('การสำรองข้อมูลล้มเหลว', 'warning', `เกิดข้อผิดพลาด: ${err.message || err}`);
    } finally {
      setIsBackingUpDrive(false);
    }
  };

  const handleLoadDriveBackupsList = async () => {
    if (!googleToken) return;
    setIsLoadingBackupsDrive(true);
    try {
      const list = await listBackupsFromGoogleDrive(googleToken, profile.nickname);
      setDriveBackups(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingBackupsDrive(false);
    }
  };

  const handleToggleLoadDriveBackups = () => {
    const nextState = !showDriveBackupsList;
    setShowDriveBackupsList(nextState);
    if (nextState) {
      handleLoadDriveBackupsList();
    }
  };

  const handleRestoreDriveBackup = async (fileId: string, filename: string) => {
    if (!googleToken || !onRestoreLogs) return;
    const confirmed = window.confirm(`คุณแน่ใจน่ะคะว่าจะดาวน์โหลดและกู้คืนหัวใจจากไฟล์สำรอง "${filename}" นี้? ข้อมูลปัจจุบันในเครื่องจะถูกแทนที่เรียบร้อยน้าคะ`);
    if (!confirmed) return;

    try {
      showToast('กำลังดาวน์โหลดข้อมูลสำรอง...', 'info', 'ระบบกำลังกู้คืนความรู้สึกของคุณกรุณารอสักครู่นะคะ...');
      const backupObj = await downloadBackupFromGoogleDrive(googleToken, fileId);
      if (backupObj && Array.isArray(backupObj.logs)) {
        onRestoreLogs(backupObj.logs);
        showToast('กู้คืนข้อมูลสำเร็จแล้วค่ะ! 🎉🟢', 'success', `นำเข้าข้อมูลประวัติทั้งหมด ${backupObj.logs.length} รายการจาก Google Drive เรียบร้อยแล้วค่ะ`);
      } else {
        showToast('ข้อมูลสำรองไม่ถูกต้อง', 'warning', 'ไฟล์สำรองไม่ตรงตามรูปแบบของระบบ ฮีลใจ ค่ะ');
      }
    } catch (err: any) {
      console.error(err);
      showToast('ไม่สามารถกู้คืนข้อมูลได้', 'warning', `เกิดความผิดพลาด: ${err.message || err}`);
    }
  };
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [showAdviceModal, setShowAdviceModal] = useState<MentalHealthLog | null>(null);

  const [customSheetIdInput, setCustomSheetIdInput] = useState(spreadsheetId);
  const [showSheetSettings, setShowSheetSettings] = useState(false);

  // Sync state if spreadsheetId prop updates
  useEffect(() => {
    setCustomSheetIdInput(spreadsheetId);
  }, [spreadsheetId]);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % HEAL_QUOTES.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);



  // Determine if user has already checked in his mood today
  const hasUserCheckedInToday = (): boolean => {
    const todayStr = new Date().toISOString().split('T')[0];
    return logs.some(l => l.email === profile.email && l.timestamp.startsWith(todayStr) && !l.assessmentResult);
  };

  const hasUserAssessedToday = (): boolean => {
    const todayStr = new Date().toISOString().split('T')[0];
    return logs.some(l => l.email === profile.email && l.timestamp.startsWith(todayStr) && l.assessmentResult);
  };

  // Filter logs for this specific user
  const userLogs = logs.filter(l => l.email === profile.email);
  const reversedLogs = [...userLogs].reverse(); // oldest to newest for graph

  // Dynamic offset array for tracking, allowing the calendar to remain relative to today/present day and query history
  const getLast7DaysList = () => {
    const today = new Date();
    const list = [];
    // Under offset 0, generates [today-6, today-5, today-4, today-3, today-2, today-1, today]
    // Under offset -1, subtracts 7 days further, etc. This dynamically moves the view back in time.
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i + (calendarOffset * 7));
      list.push(d);
    }
    return list;
  };
  const last7CalendarDays = getLast7DaysList();

  // Helper to dynamically categorise score severity (Green=Normal, Yellow=Risk, Red=Danger)
  const getAssessmentClassAndLabel = (log: MentalHealthLog) => {
    if (!log.assessmentResult) return null;
    const { score, status, screening } = log.assessmentResult;
    
    let label = "ปกติ";
    let colorClass = "bg-emerald-500 text-white border-emerald-600";

    const statusStr = status || "";
    if (
      statusStr.includes("รุนแรง") || 
      statusStr.includes("สูง") || 
      statusStr.includes("อันตราย") || 
      statusStr.includes("หนักมาก") ||
      (screening === "9Q" && score >= 13) ||
      (screening === "8Q" && score >= 4) ||
      (screening === "ST-5" && score >= 8)
    ) {
      label = "อันตราย";
      colorClass = "bg-rose-500 text-white border-rose-600";
    } else if (
      statusStr.includes("ปานกลาง") || 
      statusStr.includes("เฝ้าระวัง") || 
      statusStr.includes("เสี่ยง") || 
      statusStr.includes("น้อย") ||
      (screening === "9Q" && score >= 7) ||
      (screening === "2Q" && score >= 1) ||
      (screening === "ST-5" && score >= 5) ||
      (screening === "8Q" && score >= 1)
    ) {
      label = "เสี่ยง";
      colorClass = "bg-amber-400 text-slate-900 border-amber-500";
    } else {
      label = "ปกติ";
      colorClass = "bg-emerald-500 text-white border-emerald-600";
    }

    return { label, colorClass, score, screening };
  };

  // Helper to normalize different screening scores (2Q, 9Q, 8Q, ST-5) for visualization
  const getNormalizedScoreForGraph = (log: MentalHealthLog) => {
    if (!log.assessmentResult) return { val: 0, max: 10, pct: 0, label: '' };
    const { score, screening } = log.assessmentResult;
    let max = 10;
    if (screening === '9Q') max = 27;
    else if (screening === '8Q') max = 9;
    else if (screening === '2Q') max = 2;
    else if (screening === 'ST-5') max = 15;
    return { val: score, max, pct: score / max, label: `${screening}: ${score}/${max}` };
  };

  // Mood Score Mapping for graphing
  const moodPoints: { [key: string]: number } = {
    great: 4,
    neutral: 3,
    sad: 2,
    stressed: 1
  };
  const last7LogsForGraph = reversedLogs.slice(-7);
  
  // Filter only logs with assessment results for scores graphing
  const assessmentLogsForGraph = reversedLogs.filter(l => l.assessmentResult);
  const last7AssessmentLogsForGraph = assessmentLogsForGraph.slice(-7);

  // COMMUNITY METRICS CALCULATIONS (REAL-TIME AGGREGATES)
  const totalCommunityLogsCount = logs.length;
  // Unique emails + nicknames in full state for total community size
  const uniqueParticipantsCount = Array.from(new Set(logs.map(l => l.email || l.nickname))).length || 4;

  const filteredCommunityLogs = selectedGroup === 'all'
    ? logs
    : logs.filter(l => l.targetGroup === selectedGroup);

  const totalFilteredCount = filteredCommunityLogs.length || 1;

  // Mood percentages
  const moodCounts = {
    great: filteredCommunityLogs.filter(l => l.mood === 'great').length,
    neutral: filteredCommunityLogs.filter(l => l.mood === 'neutral').length,
    sad: filteredCommunityLogs.filter(l => l.mood === 'sad').length,
    stressed: filteredCommunityLogs.filter(l => l.mood === 'stressed').length,
  };

  const moodPcts = {
    great: Math.round((moodCounts.great / totalFilteredCount) * 100),
    neutral: Math.round((moodCounts.neutral / totalFilteredCount) * 100),
    sad: Math.round((moodCounts.sad / totalFilteredCount) * 100),
    stressed: Math.round((moodCounts.stressed / totalFilteredCount) * 100),
  };

  // Assessment Risk categorizations
  const communityAssessments = filteredCommunityLogs.filter(l => l.assessmentResult);
  const totalAssessmentsCount = communityAssessments.length || 1;

  const normalAssessmentsCount = communityAssessments.filter(l => {
    const status = l.assessmentResult?.status || '';
    return status.includes('ปกติ') || status.includes('ปลอดภัย');
  }).length;

  const highAssessmentsCount = communityAssessments.filter(l => {
    const status = l.assessmentResult?.status || '';
    return status.includes('รุนแรง') || status.includes('สูง') || status.includes('เคร่งเครียด');
  }).length;

  const midAssessmentsCount = Math.max(0, communityAssessments.length - normalAssessmentsCount - highAssessmentsCount);

  const riskPcts = {
    normal: Math.round((normalAssessmentsCount / totalAssessmentsCount) * 100),
    medium: Math.round((midAssessmentsCount / totalAssessmentsCount) * 100),
    high: Math.round((highAssessmentsCount / totalAssessmentsCount) * 100),
  };

  // Live Check-in Ticker feed based on current filtered logs
  const tickerEvents = filteredCommunityLogs.slice(0, 6);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-natural-sage/15 select-none text-slate-800">
      
      {/* 1. Dynamic Toggle Tabs for Personal vs Community Dashboard */}
      <div className="bg-white border-b border-rose-50 p-2.5 flex items-center justify-between shrink-0 shadow-3xs">
        <div className="flex bg-slate-100 rounded-xl p-0.5 flex-1 max-w-[340px] mx-auto">
          <button
            onClick={() => setCurrentView('personal')}
            className={`flex-1 py-1.5 px-3 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentView === 'personal'
                ? 'bg-natural-secondary text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>เส้นทางของฉัน</span>
          </button>
          
          <button
            onClick={() => setCurrentView('community')}
            className={`flex-1 py-1.5 px-3 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentView === 'community'
                ? 'bg-natural-secondary text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>พลังใจชุมชน ({uniqueParticipantsCount})</span>
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* VIEW A: PERSONAL MIND ALARM & SCREENING TRACKER */}
        {currentView === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in items-start">
            
            {/* Left Column: Main Journey Tracking Board */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* Welcome Greeting */}
              <div className="bg-white/80 border border-slate-200/40 p-4 rounded-3xl shadow-xs relative overflow-hidden flex items-center justify-between">
                <div className="space-y-1 z-10">
                  <h2 className="text-sm font-black text-natural-primary flex items-center gap-1 font-display">
                    อัสสาลามูอาลัยกุมนะคะคุณ {profile.nickname} ✨
                  </h2>
                  <p className="text-[10px] text-natural-primary/80 font-semibold leading-relaxed">
                    ยินดีต้อนรับกลับบ้านใจดี ย้ายจิตเข้ามาหลีกหนีความวุ่นวายภายนอกกันนะคะ
                  </p>
                </div>
                <div className="text-3xl shrink-0 filter opacity-80 z-10">🌴</div>
              </div>

              {/* GOOGLE SHEETS ACTIVE PRIMARY DATABASE CONNECTOR */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-[#E1EFEB]/60 p-4 rounded-3xl shadow-3xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-800">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black font-display font-black">
                      ฐานข้อมูลหลักของระบบ (Google Sheets Database)
                    </h4>
                  </div>
                  {googleUser ? (
                    <span className="text-[7.5px] font-black text-emerald-600 bg-emerald-100/65 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                      CONNECTED 🟢
                    </span>
                  ) : (
                    <span className="text-[7.5px] font-black text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      DISCONNECTED ⚪
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] text-slate-600 leading-normal font-sans font-medium">
                    {googleUser ? (
                      <div className="space-y-2">
                        <div>
                          เชื่อมต่อฐานข้อมูลชีตหลักสำเร็จแล้วกับบัญชี{' '}
                          <strong className="text-emerald-800 font-extrabold">{googleUser.email || googleUser.displayName || 'Google Account'}</strong>
                        </div>
                        <div className="p-2.5 bg-white/80 border border-emerald-100 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wide">สเปรดชีตเป้าหมาย:</span>
                            {spreadsheetId === '1emPE5kgg5Gd3fr8caWKV5Km5WYs5WTmKFaGhOlsshPA' ? (
                              <span className="text-[7.5px] font-bold text-[#E65100] bg-orange-50 px-1.5 py-0.5 border border-orange-100 rounded-md">
                                แผ่นงานทดสอบระบบ (สาธารณะ) 🌐
                              </span>
                            ) : (
                              <span className="text-[7.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-100 rounded-md">
                                แผ่นงานส่วนตัวของคุณ 🔒
                              </span>
                            )}
                          </div>
                          
                          <a 
                            href={spreadsheetUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 underline hover:text-emerald-800 break-all font-mono font-bold text-[9px] block bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50"
                          >
                            {spreadsheetUrl}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p>
                          แอปพลิเคชันได้รับการตั้งค่าให้บันทึกข้อมูลทุกสภาวะ ผลตรวจระดับอาการ และพฤติกรรมต้นไม้ปัญญา <br />
                          ลงสู่อุปกรณ์เป็นระเบียบตามคอลัมน์ใน Google Sheets
                        </p>
                        <div className="text-[9px] text-[#A67C43] bg-[#FFFBF0] border border-[#F5E6CA] p-2 rounded-xl flex items-start gap-1 font-semibold leading-normal">
                          <span>💡</span>
                          <span>คุณสามารถเชื่อมบัญชี Google เพื่อให้ระบบช่วยสร้างและอัปเดตไฟล์แบบประเมินส่วนตัวบน Drive ของคุณได้แบบเรียลไทม์เลยนะคะ ปลอดภัยสูงมากค่ะ</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {googleUser ? (
                      <>
                        <button
                          type="button"
                          onClick={onManualSync}
                          disabled={isSyncingSheets}
                          className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-[9px] font-black transition-all cursor-pointer shadow-3xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                          <span>{isSyncingSheets ? 'กำลังซิงก์ข้อมูล...' : 'ซิงก์ข้อมูลประวัติลงชีตนี้ 📊'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={onCreateNewSheet}
                          disabled={isSyncingSheets}
                          className="py-1.5 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-[9px] font-black border border-teal-200 transition-all cursor-pointer"
                          title="สร้างหน้าไฟล์ Google Sheet อันใหม่สดๆ บนบัญชีของคุณ"
                        >
                          ✨ สร้างหรือย้ายสเปรดชีตส่วนตัวใหม่บน Drive ของคุณ
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowSheetSettings(!showSheetSettings)}
                          className="py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black transition-all cursor-pointer"
                        >
                          ⚙️ ตั้งค่ารหัส ID ชีตเอง
                        </button>

                        <button
                          type="button"
                          onClick={onDisconnectGoogle}
                          className="py-1.5 px-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl text-[9px] font-bold transition-all cursor-pointer"
                        >
                          ตัดเชื่อมต่อ
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={onConnectGoogle}
                        className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 hover:shadow-xs active:scale-98 text-white rounded-xl text-[9px] font-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>เชื่อมต่อ Google Sheets และลงชื่อเข้าใช้ 📊</span>
                      </button>
                    )}
                  </div>

                  {/* CUSTOM SPREADSHEET MANAGER DRAWER / POPUP SECTOR */}
                  {googleUser && showSheetSettings && (
                    <div className="bg-white/80 border border-slate-200 p-3 rounded-2xl space-y-2 mt-2 text-[10px] show-sheet-config-manager animate-fade-in shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-700">⚙️ กำหนดรหัส Google Spreadsheet เอง</span>
                      </div>
                      {showDriveBackupsList && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-2 max-h-40 overflow-y-auto animate-fade-in pr-0.5 scrollbar-thin">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">รายการไฟล์สำรองที่พบน่ะคะ:</span>
                          {isLoadingBackupsDrive ? (
                            <div className="text-center py-3 text-[9px] text-slate-400 font-bold animate-pulse">
                              กำลังค้นหาไฟล์ใน Google Drive ของคุณ...
                            </div>
                          ) : driveBackups.length === 0 ? (
                            <div className="text-center py-3 text-[9.5px] text-slate-400 font-bold border border-slate-100 border-dashed rounded-xl">
                              ไม่พบไฟล์สำรองในระบบขณะนี้ค่ะ <br />
                              (กดปุ่ม "สำรองข้อมูล" ด้านบนเพื่อเริ่มสำรองครั้งแรกล่ะคะ 💚)
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {driveBackups.map(file => (
                                <div key={file.id} className="flex items-center justify-between bg-emerald-50/30 p-2 rounded-xl border border-emerald-100 text-[9.5px]">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-800 truncate">{file.name}</p>
                                    <p className="text-[8px] text-slate-400 mt-0.5">
                                      สร้างเมื่อ: {new Date(file.createdTime).toLocaleString('th-TH')}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRestoreDriveBackup(file.id, file.name)}
                                    className="ml-2 py-1 px-2.5 bg-teal-100 hover:bg-teal-200 text-teal-800 font-black rounded-lg cursor-pointer transition-colors shrink-0 text-[8.5px]"
                                  >
                                    คืนค่าประวัติ 📂
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Save mood check-in zone */}
              <MoodCheck
                onSaveMood={onSaveMood}
                lastMoodRecorded={userLogs[0]?.mood}
              />

              {/* 7-DAY EMOTIONAL PROGRESS GRAPH */}
              <div className="bg-white border border-slate-200/40 rounded-3xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-natural-primary">
                    <BarChart3 className="w-4 h-4 text-natural-secondary" />
                    <h4 className="text-xs font-bold font-display">กราฟบันทึกระดับคะแนนการประเมินใจใน 1 สัปดาห์</h4>
                  </div>
                  <span className="text-[9px] font-bold text-[#4A5D53] bg-natural-sage border border-natural-secondary/20 px-2.5 py-0.5 rounded-full">
                    ประเมินแล้ว: {assessmentLogsForGraph.length} ครั้ง
                  </span>
                </div>

                {last7AssessmentLogsForGraph.length > 0 ? (
                  <div className="space-y-3 animate-fade-in text-center font-bold">
                    <div className="w-full h-44 bg-natural-sage/10 rounded-2xl border border-slate-200/50 p-2.5 relative flex flex-col justify-end">
                      <svg viewBox="0 0 300 135" className="w-full h-full">
                        {/* Grid guidelines */}
                        <line x1="0" y1="20" x2="300" y2="20" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" />
                        <line x1="0" y1="60" x2="300" y2="60" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" />
                        <line x1="0" y1="100" x2="300" y2="100" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3,3" />

                        {/* Map scores onto path */}
                        {(() => {
                          const widthStep = 300 / (last7AssessmentLogsForGraph.length + 1);
                          const points = last7AssessmentLogsForGraph.map((log, i) => {
                            const { pct, val, max, label } = getNormalizedScoreForGraph(log);
                            const x = (i + 1) * widthStep;
                            const y = 95 - (pct * 60); // limits y values between 35 and 95 to leave margin
                            return { x, y, log, label, val };
                          });

                          const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                          return (
                            <g>
                              {points.length > 1 && (
                                <path d={pathStr} fill="none" stroke="#7AA38F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              )}
                              {points.map((p, i) => {
                                const info = getAssessmentClassAndLabel(p.log);
                                const dateObj = new Date(p.log.timestamp);
                                const formattedDate = dateObj.toLocaleDateString([], { month: '2-digit', day: '2-digit' });
                                return (
                                  <g key={i}>
                                    {/* Score display above the node */}
                                    <text x={p.x} y={p.y - 12} fontSize="7" fill="#1E293B" fontWeight="black" textAnchor="middle">
                                      {p.label}
                                    </text>
                                    
                                    {/* Status tag below the point */}
                                    <text x={p.x} y={p.y + 11} fontSize="7" fontWeight="bold" fill={
                                      info?.label === "อันตราย" ? "#EF4444" :
                                      info?.label === "เสี่ยง" ? "#D97706" :
                                      "#10B981"
                                    } textAnchor="middle">
                                      {info?.label}
                                    </text>

                                    {/* Point node */}
                                    <circle cx={p.x} cy={p.y} r="4.5" fill={
                                      info?.label === "อันตราย" ? "#EF4444" :
                                      info?.label === "เสี่ยง" ? "#F59E0B" :
                                      "#10B981"
                                    } stroke="#FFF" strokeWidth="1.2" />

                                    {/* Date aligned directly below */}
                                    <text x={p.x} y="125" fontSize="7.5" fill="#64748B" fontWeight="extrabold" textAnchor="middle">
                                      {formattedDate}
                                    </text>
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div className="bg-natural-sage/10 rounded-2xl p-6 text-center text-natural-primary/70 text-[10px] font-bold">
                    กรุณาทำแบบประเมินประคองใจเพื่อเริ่มวาดสถิติและระดับคะแนนของท่านนะคะ 💚
                  </div>
                )}
              </div>

              {/* WEEK TIMELINE SECTION */}
              <div className="bg-white border border-slate-200/40 rounded-3xl p-4 shadow-xs space-y-4 animate-fade-in">
                <div className="flex items-center justify-between text-slate-850 border-b pb-2.5 border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black font-display">สัปดาห์ย้อนหลัง (History)</h4>
                  </div>
                </div>

                {/* 7 Days Timeline Grid Controls Slider */}
                <div className="flex items-center justify-between bg-slate-50/80 border border-slate-200/50 p-2 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setCalendarOffset(prev => prev - 1)}
                    className="px-2.5 py-1 text-[9px] font-black bg-white hover:bg-slate-100 border border-slate-250 text-slate-705 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 shadow-3xs"
                    title="สัปดาห์ก่อนหน้า"
                  >
                    <span>← สัปดาห์ย้อนหลัง (History)</span>
                  </button>
                  
                  <div className="text-center font-display text-[9.5px] font-extrabold text-[#11331e] flex flex-col items-center justify-center">
                    {calendarOffset === 0 ? (
                      <span className="text-rose-700 font-black bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-100">📅 สัปดาห์ปัจจุบัน (มีวันนี้)</span>
                    ) : (
                      <span className="text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">🕒 ย้อนหลัง {Math.abs(calendarOffset)} สัปดาห์</span>
                    )}
                  </div>

                  <div className="flex gap-1.5 justify-center">
                    {calendarOffset !== 0 && (
                      <button
                        type="button"
                        onClick={() => setCalendarOffset(0)}
                        className="px-2 py-1 text-[9px] font-black bg-[#faf5f5] hover:bg-rose-50 border border-rose-200 text-rose-800 rounded-xl cursor-pointer transition-colors"
                        title="กระโดดกลับมาวันนี้"
                      >
                        กลับวันนี้ 🎯
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setCalendarOffset(prev => prev + 1)}
                      className={`px-2.5 py-1 text-[9px] font-black bg-white border rounded-xl transition-all flex items-center justify-center gap-1 ${
                        calendarOffset >= 0 
                          ? 'opacity-40 cursor-not-allowed border-slate-100 text-slate-350' 
                          : 'hover:bg-slate-100 border-slate-250 text-slate-700 cursor-pointer shadow-3xs'
                      }`}
                      disabled={calendarOffset >= 0}
                      title="สับสัปดาห์ถัดไป"
                    >
                      <span>ไปยังปฏิทินถัดไป →</span>
                    </button>
                  </div>
                </div>

                {/* 7 Days Timeline Grid */}
                <div id="calendar-grid-timeline" className="grid grid-cols-7 gap-1.5 pt-1">
                  {last7CalendarDays.map((day, idx) => {
                    const dayISO = day.toISOString().split('T')[0];
                    const dayLocal = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                    // Find any log with assessment result on this specific date starting with ISO or local calendar format
                    const testLogOnDay = userLogs.find(l => {
                      const ts = l.timestamp || "";
                      return (ts.startsWith(dayISO) || ts.startsWith(dayLocal)) && l.assessmentResult;
                    });
                    const info = testLogOnDay ? getAssessmentClassAndLabel(testLogOnDay) : null;
                    
                    const dayOfWeekName = day.toLocaleDateString('th-TH', { weekday: 'short' });
                    const dateNum = day.getDate();
                    const isToday = dayLocal === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

                    return (
                      <div 
                        key={idx} 
                        className={`flex flex-col items-center rounded-xl p-1.5 border transition-all text-center relative ${
                          isToday 
                            ? 'bg-rose-50/50 border-rose-200 shadow-3xs ring-1 ring-rose-200/50' 
                            : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50/80'
                        }`}
                      >
                        <span className="text-[8px] text-slate-400 font-bold block leading-none">{dayOfWeekName}</span>
                        <span className="text-xs font-black text-slate-800 leading-tight mt-1">{dateNum}</span>

                        {/* Assessment indicator */}
						{testLogOnDay && info ? (
                          <div className="mt-2 flex flex-col items-center gap-1 w-full animate-fade-in">
                            <span 
                              className={`inline-block text-[7.5px] font-black px-1.5 py-0.5 rounded-md w-full leading-none text-center truncate ${info.colorClass}`}
                              title={`${info.screening}: ${testLogOnDay.assessmentResult?.status} (คะแนน: ${info.score})`}
                            >
                              {info.label} ({info.score} ค.)
                            </span>
                            
                            <button
                              type="button"
                              onClick={() => setShowAdviceModal(testLogOnDay)}
                              className="p-1 hover:bg-slate-200/50 rounded-md transition-all cursor-pointer flex items-center justify-center text-slate-400 hover:text-slate-850"
                              title="ดูใบแผงคำแนะนำรักษาใจ"
                            >
                              <Eye className="w-3 h-3 text-slate-500" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTab('test')}
                            className="mt-2 w-5 h-5 border border-dashed border-slate-300 rounded-full flex items-center justify-center text-slate-400 hover:border-natural-secondary hover:text-natural-secondary transition-colors cursor-pointer"
                            title="ทำสภาวะแบบประเมินประคองจิตน้า"
                          >
                            <span className="text-[10px] font-bold leading-none">+</span>
                          </button>
                        )}

                        {isToday && (
                          <span className="absolute -top-1 right-1 flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Informative advice note regarding clinical assessments */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-2xl flex items-start gap-1.5 animate-fade-in">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-[#224430] font-bold leading-relaxed">
                    * คำแนะนำ: เฝ้าระวังสแกนสุขภาพหัวใจอย่างต่อเนื่อง ทุกวันอาทิตย์หรือทุกสัปดาห์ ท้องถิ่นเรามีความส่วนตัวและความปลอดภัยสูงค่ะ
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Support Widgets & settings Sidebar ("แถบข้างๆ") */}
            <div className="space-y-4">

              {/* Daily Affirmation */}
              <div className="bg-[#FFF9F0]/90 border border-[#FFF0D4] p-4 rounded-3xl relative overflow-hidden text-center shadow-xs">
                <div className="absolute top-2.5 left-2.5 text-[#E65100]/50">
                  <Sparkles className="w-4 h-4" />
                </div>
                
                <p className="text-xs font-black text-amber-900 tracking-wide mb-1 leading-relaxed">
                  " {HEAL_QUOTES[quoteIndex]} "
                </p>
                <span className="text-[8.5px] uppercase font-bold text-[#E65100]/70 tracking-widest block">
                  คำพูดประคองใจประจำวันจากเจ้าฮีลใจ 💚
                </span>
              </div>

              {/* Emergency Hotline */}
              <div className="bg-rose-50 border border-rose-200/50 p-4 rounded-3xl shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2 bg-rose-500 rounded-lg text-white font-bold text-center text-[8px] uppercase leading-none">
                    ฉุกเฉิน / วิกฤตใจ
                  </div>
                  <span className="text-[9px] text-rose-800 font-black">พร้อมปรึกษาอบอุ่นฟรี 24 ชม.</span>
                </div>
                
                <p className="text-[10px] text-rose-800/90 font-semibold leading-relaxed">
                  เมื่อรู้สึกเหนื่อยล้า ซึมเศร้า หรือฉุกเฉิน ทนต่อแรงกดดันไม่ไหว ไม่ต้องทนคนเดียวนะคะ
                </p>

                <a
                  href="tel:1323"
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white text-xs font-bold rounded-xl flex justify-center items-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-600/10"
                >
                  <Phone className="w-4 h-4 animate-bounce" />
                  <span>โทรสายด่วนสุขภาพจิต 1323</span>
                </a>

                {/* Trusted Guardians Segment using Google Contacts */}
                <div className="bg-white/80 border border-rose-100 rounded-2xl p-3 flex flex-col gap-2 text-[10px] text-slate-700 mt-1 shadow-3xs animate-fade-in">
                  <div className="flex items-center justify-between border-b pb-1.5 border-rose-100/50">
                    <span className="font-extrabold text-[#7A1C1C] flex items-center gap-1 font-display">
                      💖 ผู้พิทักษ์ใจที่ไว้วางใจ (Trusted Guardians)
                    </span>
                    <span className="text-[8px] bg-rose-500 text-white font-mono font-black px-1.5 py-0.5 rounded-full leading-none">
                      {trustedGuardians.length}/3
                    </span>
                  </div>
                  
                  <p className="text-[9px] text-slate-500 leading-normal font-semibold">
                    บันทึกเบอร์โทรคนสำคัญ ครอบครัว หรือเพื่อนสนิทที่คุณไว้วางใจที่สุด เพื่อติดต่อด่วนยามวิกฤตความปลอดภัย
                  </p>

                  {trustedGuardians.length > 0 ? (
                    <div className="space-y-1.5">
                      {trustedGuardians.map((guardian, i) => (
                        <div key={i} className="flex items-center justify-between bg-rose-50/20 p-2 rounded-xl border border-rose-100/60 text-[9.5px]">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 truncate">{guardian.name}</p>
                            <p className="text-[8px] text-slate-450 mt-0.5 font-bold">{guardian.phone}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <a
                              href={`tel:${guardian.phone}`}
                              className="p-1 px-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-black text-[9px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                              title={`โทรหา ${guardian.name}`}
                            >
                              <Phone className="w-2.5 h-2.5" />
                              <span>โทรด่วน</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteGuardian(i)}
                              className="p-1 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                              title="ลบผู้พิทักษ์ใจ"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-2.5 text-center text-[9px] text-slate-400 font-bold bg-slate-50/50 border border-dashed rounded-xl">
                      ยังไม่ได้ระบุรายชื่อผู้พิทักษ์น่ะคะ 🌸
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-rose-100/50">
                    {googleUser ? (
                      <button
                        type="button"
                        onClick={handleLoadGoogleContacts}
                        className="w-full py-1.5 px-3 bg-rose-100/50 hover:bg-rose-100 text-[#912A2A] text-[9.5px] font-black border border-rose-200 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-3xs"
                      >
                        {isLoadingContacts ? (
                          <span className="animate-pulse">⏳ กำลังดึงรายชื่อผู้ติดต่อ...</span>
                        ) : (
                          <>
                            <span>👥 ซิงก์ดึงรายชื่อจาก Google Contacts</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <p className="text-[8.5px] text-[#A64545] font-bold bg-[#FFF5F5] p-2 rounded-xl border border-rose-100 leading-normal">
                        💡 แนะนะเชื่อมสิทธิ์บัญชี Google ในระบบด้านบน เพื่อสแกนและดึงรายชื่อบุคคลสำคัญของคุณจาก Google Contacts มาเลือกเป็นผู้พิทักษ์ได้อย่างสะดวกรวดเร็วนะคะ
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW B: COMMUNITY OVERVIEW PUBLIC DASHBOARD */}
        {currentView === 'community' && (
          <div className="space-y-4 animate-fade-in">
            
            {/* Header statistics info */}
            <div className="bg-white border border-slate-200/40 p-4 rounded-3xl shadow-3xs space-y-3.5 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500 rounded-xl text-white">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-natural-primary leading-none">พลังใจร่วมเดินทางในชุมชน 💚</h4>
                  <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">สถิติสะท้อนแผงรวมสุขภาพจิตผู้ใชะและเพื่อนร่วมทางทั้งหมด</p>
                </div>
              </div>

              {/* Grid numeric metrics summary */}
              <div className="grid grid-cols-2 gap-3.5 pt-0.5">
                <div className="bg-[#FAFDFB] border border-emerald-100 p-3 rounded-2xl">
                  <span className="text-[9px] text-[#425C4B] font-black block">เพื่อนผู้สะท้อนใจสะสม</span>
                  <span className="text-xl font-black text-emerald-800 block mt-0.5">{uniqueParticipantsCount} คน</span>
                </div>
                
                <div className="bg-[#FAFDFB] border border-emerald-100 p-3 rounded-2xl">
                  <span className="text-[9px] text-[#425C4B] font-black block">จำนวนใบประเมินและอารมณ์รวม</span>
                  <span className="text-xl font-black text-emerald-800 block mt-0.5">{totalCommunityLogsCount} แถว</span>
                </div>
              </div>
            </div>

            {/* Target Group Analysis Segmentation Switcher */}
            <div className="bg-white border border-slate-200/40 p-4 rounded-3xl shadow-3xs space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-[10.5px] font-black text-slate-800 flex items-center gap-1">
                  <Sparkle className="w-3.5 h-3.5 text-natural-secondary" />
                  <span>สถิติเจาะลึกวิเคราะห์ในกลุ่มเป้าหมาย</span>
                </h5>
                <span className="text-[8px] bg-natural-sage text-natural-primary font-bold px-2 py-0.5 rounded-sm">
                  เรียลไทม์ ฟิลเตอร์
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { id: 'all', label: 'ทั้งหมด' },
                  { id: 'student', label: 'กำลังศึกษา' },
                  { id: 'general_labor', label: 'รับจ้างทั่วไป' },
                  { id: 'unemployed', label: 'ว่างงาน' },
                  { id: 'merchant', label: 'ค้าขาย' },
                  { id: 'civil_servant', label: 'ข้าราชการ' },
                ].map(group => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.id)}
                    className={`text-[9.5px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      selectedGroup === group.id
                        ? 'bg-[#1D3E3A] border-[#1D3E3A] text-white shadow-3xs font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CHART A: MOOD DISTRIBUTION OVERVIEW (PERCENTAGE GRAPHS) */}
            <div className="bg-white border border-slate-200/40 p-4 rounded-3xl shadow-3xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h5 className="text-[10.5px] font-black text-slate-800 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-emerald-600" />
                  <span>ร้อยละของสัดส่วนอารมณ์เฉลี่ยเฉียดทาง (Mood Distribution Log %)</span>
                </h5>
              </div>

              {totalFilteredCount > 1 || filteredCommunityLogs.length > 0 ? (
                <div className="space-y-3.5 pt-1">
                  {/* Great Mood Percentage */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-700">😊 ดีมาก / ปลื้มสงบนิ่ง</span>
                      <span className="text-emerald-700 font-mono font-black">{moodPcts.great}% ({moodCounts.great} ครั้ง)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${moodPcts.great}%` }} />
                    </div>
                  </div>

                  {/* Neutral Mood Percentage */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-700">😐 เฉย ๆ / สบายปนกลาง</span>
                      <span className="text-sky-700 font-mono font-black">{moodPcts.neutral}% ({moodCounts.neutral} ครั้ง)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-400 rounded-full transition-all duration-500" style={{ width: `${moodPcts.neutral}%` }} />
                    </div>
                  </div>

                  {/* Sad Mood Percentage */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-700">😢 เศร้าใจ / เหงาหงอย</span>
                      <span className="text-amber-700 font-mono font-black">{moodPcts.sad}% ({moodCounts.sad} ครั้ง)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${moodPcts.sad}%` }} />
                    </div>
                  </div>

                  {/* Stressed Mood Percentage */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-700">😣 เครียดสะสม / กังวลหนัก</span>
                      <span className="text-rose-700 font-mono font-black">{moodPcts.stressed}% ({moodCounts.stressed} ครั้ง)</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full transition-all duration-500" style={{ width: `${moodPcts.stressed}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-[11px] text-slate-400 font-medium">
                  ไม่มีประวัติการบันทึกอารมณ์ของกลุ่มเป้าหมายนี้ในระบบค่ะ
                </div>
              )}
            </div>

            {/* CHART B: ASSESSMENT STATS & DEPRESSION / STRESS RISK LEVEL PERCENTAGES */}
            <div className="bg-white border border-slate-200/40 p-4 rounded-3xl shadow-3xs space-y-4">
              <div>
                <h5 className="text-[10.5px] font-black text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>วิเคราะห์สัดส่วนจำแนกความเสี่ยงสุขภาพจิตเฉลี่ยร้อยละ (%)</span>
                </h5>
                <p className="text-[8.5px] text-slate-400 font-semibold pt-0.5 leading-tight">คำนวณจากทุกรายงานผลสัมฤทธิ์แบบประเมิน (2Q, 9Q, 8Q, ST-5) ทั่วหน้าแอปค่ะ</p>
              </div>

              {communityAssessments.length > 0 ? (
                <div className="space-y-4 pt-1">
                  
                  {/* Horizontal Bar segment representation */}
                  <div className="w-full h-5 rounded-xl overflow-hidden flex shadow-inner border">
                    <div className="h-full bg-emerald-500 hover:opacity-90 transition-all cursor-help" style={{ width: `${riskPcts.normal}%` }} title={`ปลอดภัย/ปกติ ${riskPcts.normal}%`} />
                    <div className="h-full bg-amber-400 hover:opacity-90 transition-all cursor-help" style={{ width: `${riskPcts.medium}%` }} title={`ความเสี่ยงปานกลาง ${riskPcts.medium}%`} />
                    <div className="h-full bg-rose-500 hover:opacity-90 transition-all cursor-help" style={{ width: `${riskPcts.high}%` }} title={`ระดับความเสี่ยงสูง ${riskPcts.high}%`} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[8.5px] font-bold">
                    <div className="p-2 border rounded-xl bg-emerald-50 flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block mb-1" />
                      <span className="text-slate-500">ระดับปกติ/ปลอดภัย</span>
                      <span className="text-emerald-800 font-black font-mono text-xs">{riskPcts.normal}%</span>
                    </div>

                    <div className="p-2 border rounded-xl bg-amber-50 flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block mb-1" />
                      <span className="text-slate-500">กลุ่มเสี่ยงปานกลาง</span>
                      <span className="text-amber-800 font-black font-mono text-xs">{riskPcts.medium}%</span>
                    </div>

                    <div className="p-2 border rounded-xl bg-rose-50 flex flex-col items-center">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block mb-1" />
                      <span className="text-slate-500">เฝ้าระวังอย่างใกล้ชิด</span>
                      <span className="text-rose-800 font-black font-mono text-xs">{riskPcts.high}%</span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-8 text-center text-[10.5px] text-slate-400 font-semibold bg-slate-50 border border-dashed rounded-2xl">
                  ยังไม่มีผู้ใช้ทำแบบประเมินในกลุ่มนี้เลยค่ะ 🌿
                </div>
              )}
            </div>

            {/* LIVE CHECK-IN COMMUNICATION TICKER FEED (Real-time update) */}
            <div className="bg-[#FAFDFB] border border-emerald-100 p-4 rounded-3xl shadow-3xs space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h5 className="text-[10.5px] font-black text-emerald-900 flex items-center gap-1.5 animate-pulse">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>กล่องข่าวความรู้สึกผู้เดินทางสด ๆ (Real-time Live Activity)</span>
                </h5>
                <span className="text-[8px] text-slate-400 font-bold">อัปเดตทุก 5 วิ</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {tickerEvents.map((ev, i) => {
                  const evTime = new Date(ev.timestamp);
                  const displayTime = evTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div key={ev.id || i} className="bg-white border rounded-2xl p-2.5 text-[9.5px] font-bold text-slate-700 flex justify-between items-start gap-2.5 translate-y-0 hover:-translate-y-0.5 transition-all shadow-3xs">
                      <div className="space-y-0.5">
                        <span className="text-emerald-950 font-black block">
                          คุณคนเหงา (อาชีพ: {
                            ev.targetGroup === 'student' ? 'กำลังศึกษา' : 
                            ev.targetGroup === 'general_labor' ? 'รับจ้างทั่วไป' : 
                            ev.targetGroup === 'unemployed' ? 'ว่างงาน' : 
                            ev.targetGroup === 'merchant' ? 'ค้าขาย' : 
                            ev.targetGroup === 'civil_servant' ? 'ข้าราชการ' : 
                            ev.targetGroup === 'worker' ? 'ทำงานทั่วไป' : 
                            ev.targetGroup === 'teenager' ? 'วัยรุ่น' : 'ทั่วไป'
                          })
                        </span>
                        
                        <p className="text-[8.5px] text-slate-500 font-medium italic mt-0.5">
                          "{ev.journal || 'สะท้อนใจนิ่งสงวน'}"
                        </p>
                        
                        {ev.assessmentResult && (
                          <div className="pt-1 select-none">
                            <span className="inline-block bg-purple-50 text-purple-800 text-[8px] px-2 py-0.5 border border-purple-200 rounded-full font-black scale-95 origin-left">
                              ประเมินผล: {ev.assessmentResult.status}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                        <span className="text-lg leading-none">
                          {ev.mood === 'great' ? '😊' : ev.mood === 'neutral' ? '😐' : ev.mood === 'sad' ? '😢' : '😣'}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold font-mono">
                          {displayTime} น.
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[8.5px] text-center text-slate-400 font-bold">
                * ข้อมูลทั้งหมดถูกนำเสนอแบบไม่ประสงค์ออกชื่อส่วนตัว เพื่อโอบอุ้มพี่น้องอย่างปลอดภัยไร้ความล้นหลอดค่ะ
              </p>
            </div>

          </div>
        )}

      </div>

      {/* HISTORIC ADVICE DETAILS MODAL POPUP */}
      {showAdviceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white border w-full max-w-[340px] rounded-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center gap-2 bg-[#FFF9F0] border border-[#FFF0D4] p-3 rounded-2xl">
              <span className="text-xl">📊</span>
              <div>
                <h3 className="text-xs font-black text-[#E65100]">ผลบันทึกตรวจสุขภาพจิตย้อนหลัง</h3>
                <span className="text-[8.5px] text-slate-400 font-mono">วันที่ตรวจสอบ: {new Date(showAdviceModal.timestamp).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-3.5 text-center py-1">
              {/* Screening Type Badge */}
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-[9.5px] text-slate-400 font-bold">ชุดคำถามที่ประเมิน</span>
                <span className="bg-purple-600 text-white font-mono text-[9px] font-black px-2.5 py-0.5 rounded-sm uppercase tracking-wide">
                  {showAdviceModal.assessmentResult?.screening}
                </span>
              </div>

              {/* Score Indicator */}
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-[9.5px] text-slate-400 font-bold">คะแนนรวมความเสี่ยง:</span>
                <span className="text-sm font-black text-rose-600 font-mono">
                  {showAdviceModal.assessmentResult?.score} คะแนน
                </span>
              </div>

              {/* Status diagnosis text */}
              <div className="space-y-1 text-left pt-1">
                <span className="text-[9px] text-slate-400 font-bold">ผลสรุปวิเคราะห์สภาวะจิต:</span>
                <p className="text-xs font-black text-slate-705 bg-slate-50 border p-2.5 rounded-xl leading-relaxed">
                  {showAdviceModal.assessmentResult?.status}
                </p>
              </div>

              {/* Loving Loving Advice */}
              <div className="space-y-1 text-left pt-1 mb-1">
                <span className="text-[9px] text-slate-405 font-bold">คำปลอบใจและแนวทางรักษาใจ:</span>
                <p className="text-[10px] font-bold text-[#1D3E3A] bg-[#FAFDFB] border border-emerald-100 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {showAdviceModal.assessmentResult?.advice}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAdviceModal(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-98 text-white text-[11px] font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <span>ขอบคุณน่ะคะ / ปิดแผง</span>
            </button>
          </div>
        </div>
      )}

      {/* GOOGLE CONTACTS CHOOSE MODAL */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          <div className="bg-white border w-full max-w-[320px] rounded-[32px] p-5 shadow-2xl flex flex-col gap-3.5 max-h-[75vh]">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-black text-[#5B1010] flex items-center gap-1.5 font-display">
                👥 เลือกจาก Google Contacts
              </h3>
              <button 
                onClick={() => setShowContactsModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold px-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-0.5 space-y-1 scrollbar-thin">
              {contacts.length === 0 ? (
                <p className="text-center py-6 text-[10px] text-slate-400 font-bold">
                  ไม่พบรายชื่อใน Google Contacts ของครอบครัวคุณ <br />
                  หรือ บัญชีของคุณยังไม่มีรายเลขหมายบันทึกไว้ในสิทธิ์ขณะนี้ค่ะ
                </p>
              ) : (
                contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleAddGuardianFromContact(contact)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-rose-50 hover:border-rose-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-800 truncate">{contact.name}</p>
                      <p className="text-[8px] text-slate-450 font-bold font-mono mt-0.5">{contact.phone}</p>
                    </div>
                    <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      เลือก 💖
                    </span>
                  </button>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowContactsModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-xl cursor-pointer"
            >
              ยกเลิก / ปิดหน้ารายชื่อ
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
