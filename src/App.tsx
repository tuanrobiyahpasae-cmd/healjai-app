import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, MentalHealthLog, MoodType, showToast } from './types';
import MobileFrame from './components/MobileFrame';
import WelcomeScreen from './components/WelcomeScreen';
import Navigation, { TabType } from './components/Navigation';
import HomeDashboard from './components/HomeDashboard';
import AIChat from './components/AIChat';
import ProblemTree from './components/ProblemTree';
import Relaxation from './components/Relaxation';
import Assessment from './components/Assessment';
import ToastContainer from './components/ToastContainer';
import QuickLogModal from './components/QuickLogModal';
import { Bell, Music, Volume2, VolumeX, Play, Pause, LogOut } from 'lucide-react';
import { initAuth, googleSignIn, logoutGoogle } from './lib/sheetsAuth';
import { appendLogsToSheet, createSpreadsheet } from './lib/sheetsService';
// Removed old database connections of sheets and firestore


export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('healjai_user_profile');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [logs, setLogs] = useState<MentalHealthLog[]>([]);
  const [savedProblems, setSavedProblems] = useState<any[]>([]);

  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  const [spreadsheetId, setSpreadsheetId] = useState<string>('1emPE5kgg5Gd3fr8caWKV5Km5WYs5WTmKFaGhOlsshPA');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('https://docs.google.com/spreadsheets/d/1emPE5kgg5Gd3fr8caWKV5Km5WYs5WTmKFaGhOlsshPA/edit');

  // Load and sync sheet configs for the user
  useEffect(() => {
    if (profile) {
      const savedId = localStorage.getItem(`healjai_spreadsheet_id_${profile.nickname}`);
      const savedUrl = localStorage.getItem(`healjai_spreadsheet_url_${profile.nickname}`);
      if (savedId && savedUrl) {
        setSpreadsheetId(savedId);
        setSpreadsheetUrl(savedUrl);
      } else {
        setSpreadsheetId('1emPE5kgg5Gd3fr8caWKV5Km5WYs5WTmKFaGhOlsshPA');
        setSpreadsheetUrl('https://docs.google.com/spreadsheets/d/1emPE5kgg5Gd3fr8caWKV5Km5WYs5WTmKFaGhOlsshPA/edit');
      }
    }
  }, [profile]);

  // Initialize and track Google Sheets authentication status
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const handleConnectGoogle = async () => {
    try {
      showToast('กำลังเชื่อมต่อ Google Sheets...', 'info', 'กรุณายอมรับสิทธิ์และการลงชื่อเข้าใช้ Google ในป๊อปอัปนะคะ');
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        showToast('เชื่อมต่อสำเร็จค่ะ! 🟢', 'success', 'พร้อมบันทึกสภาวะอารมณ์และผลลัพธ์สุขภาพจิตลงใน Spreadsheet เรียบร้อยแล้วค่ะ');
        
        // Auto-sync existing local logs on first connection
        if (logs.length > 0) {
          setIsSyncingSheets(true);
          try {
            await appendLogsToSheet(res.accessToken, spreadsheetId, logs);
            showToast('ซิงก์ข้อมูลประวัติสำเร็จค่ะ 📊', 'success', 'ระบบส่งประวัติและข้อมูลส่วนบุคคลทั้งหมดเข้า Spreadsheet เรียบร้อยแล้วค่ะ');
          } catch (syncErr: any) {
            const errStr = String(syncErr.message || syncErr);
            if (errStr.includes('Unauthenticated') || errStr.includes('401') || errStr.includes('credential') || errStr.includes('เซสชัน')) {
              console.warn('[Initial sync warning] Google session has expired, clearing token:', syncErr.message || syncErr);
              setGoogleUser(null);
              setGoogleToken(null);
              localStorage.removeItem('healjai_google_access_token');
            } else {
              console.error('[Initial sync error]', syncErr);
            }
          } finally {
            setIsSyncingSheets(false);
          }
        }
      }
    } catch (err) {
      console.error('Connection failed:', err);
      showToast('การเชื่อมต่อล้มเหลว', 'warning', 'ไม่สามารถลงชื่อเข้าใช้ Google ได้ กรุณาลองใหม่อีกครั้งนะคะ');
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleToken(null);
      showToast('ตัดการเชื่อมต่อสำเร็จค่ะ 🌿', 'info', 'ตัดการเชื่อมต่อบัญชี Google ของคุณออกจากระบบแล้วค่ะ');
    } catch (err) {
      console.error('Disconnect issue:', err);
    }
  };

  const handleManualSync = async () => {
    if (!googleToken) {
      showToast('ไม่ได้เชื่อมต่อชีตหลัก', 'warning', 'กรุณาเชื่อมต่อบัญชี Google ก่อนนะคะ');
      return;
    }
    setIsSyncingSheets(true);
    try {
      showToast('กำลังส่งข้อมูลสุขภาพจิต...', 'info', 'กำลังนำเข้าประวัติคำแนะนำ ผลคะแนน และข้อมูลคัดกรองทั้งหมดลงใน Google Sheets ค่ะ');
      await appendLogsToSheet(googleToken, spreadsheetId, logs);
      showToast('ซิงก์ฐานข้อมูลสำเร็จบริบูรณ์ค่ะ! 🟢', 'success', 'จัดเก็บคอลัมน์และรูปแบบเรียบร้อยใน Google Sheet ของคุณอย่างเป็นระบบระเบียบแล้วค่ะ');
    } catch (err: any) {
      const errStr = String(err.message || err);
      if (errStr.includes('Unauthenticated') || errStr.includes('401') || errStr.includes('credential') || errStr.includes('เซสชัน')) {
        console.warn('[Manual Sync Warning] Google session has expired:', err.message || err);
        setGoogleUser(null);
        setGoogleToken(null);
        localStorage.removeItem('healjai_google_access_token');
        showToast('เซสชันหมดอายุ', 'warning', 'บัญชี Google ของท่านหมดอายุหรือถูกถอนสิทธิ์แล้วค่ะ กรุณาคลิก "เชื่อมต่อ Google Sheets" ใหม่อีกครั้งเพื่อรีเฟรชสิทธิ์นะคะ');
      } else {
        console.error('Manual sync failure:', err);
        showToast('การซิงก์ข้อมูลผิดพลาด', 'warning', `ไม่สามารถส่งข้อมูลได้: ${err.message || err}`);
      }
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleCreateNewSheet = async () => {
    if (!googleToken || !profile) {
      showToast('ไม่ได้เชื่อมต่อบัญชี Google', 'warning', 'กรุณาเชื่อมต่อบัญชี Google ก่อนนะคะ');
      return;
    }
    setIsSyncingSheets(true);
    try {
      showToast('กำลังสร้างสเปรดชีตใหม่...', 'info', 'กรุณารอสักครู่ ระบบกำลังสร้าง Google Sheet ใหม่ในบัญชีของคุณนะคะ');
      const title = `Healjai ฮีลใจ - บันทึกสุขภาพจิต ของคุณ ${profile.nickname}`;
      const newSheet = await createSpreadsheet(googleToken, title);
      
      setSpreadsheetId(newSheet.id);
      setSpreadsheetUrl(newSheet.url);
      localStorage.setItem(`healjai_spreadsheet_id_${profile.nickname}`, newSheet.id);
      localStorage.setItem(`healjai_spreadsheet_url_${profile.nickname}`, newSheet.url);
      
      showToast('สร้างสเปรดชีตสำเร็จค่ะ! 🎉', 'success', 'สร้าง Google Sheet ใหม่ใน Drive ของคุณเรียบร้อยแล้วค่ะ');
      
      // Sync history to the new sheet immediately
      if (logs.length > 0) {
        showToast('กำลังนำเข้าข้อมูลประวัติ...', 'info', 'กำลังส่งประวัติก่อนหน้าทั้งหมดเข้าสู่สเปรดชีตส่วนตัวอันใหม่นี้ค่ะ');
        await appendLogsToSheet(googleToken, newSheet.id, logs);
        showToast('นำเข้าข้อมูลสำเร็จแล้วค่ะ 📊', 'success', 'ประวัติทั้งหมดเชื่อมโยงกับสเปรดชีตใหม่ของคุณเรียบร้อยแล้วค่ะ');
      }
    } catch (err: any) {
      const errStr = String(err.message || err);
      if (errStr.includes('Unauthenticated') || errStr.includes('401') || errStr.includes('credential') || errStr.includes('เซสชัน')) {
        console.warn('[Create Sheet Warning] Google session has expired:', err.message || err);
        setGoogleUser(null);
        setGoogleToken(null);
        localStorage.removeItem('healjai_google_access_token');
        showToast('เซสชันหมดอายุ', 'warning', 'การเชื่อมต่อหมดอายุแล้ว กรุณาเชื่อมต่อบัญชี Google ของท่านอีกครั้งเพื่อดำเนินการต่อค่ะ');
      } else {
        console.error('Failed to create new spreadsheet:', err);
        showToast('ไม่สามารถสร้างสเปรดชีตได้', 'warning', `เกิดข้อผิดพลาด: ${err.message || err}`);
      }
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleSaveCustomSheetId = (newId: string) => {
    if (!profile) return;
    const cleanId = newId.trim();
    if (!cleanId) {
      showToast('รหัสสเปรดชีตไม่ถูกต้อง', 'warning', 'กรุณาระบุรหัสสเปรดชีตที่ถูกต้องนะคะ');
      return;
    }
    const url = `https://docs.google.com/spreadsheets/d/${cleanId}/edit`;
    setSpreadsheetId(cleanId);
    setSpreadsheetUrl(url);
    localStorage.setItem(`healjai_spreadsheet_id_${profile.nickname}`, cleanId);
    localStorage.setItem(`healjai_spreadsheet_url_${profile.nickname}`, url);
    showToast('บันทึกสเปรดชีตใหม่สำเร็จค่ะ 📑', 'success', 'เปลี่ยนการบันทึกข้อมูลไปสู่ Google Sheet ID ใหม่ที่คุณกำหนดเรียบร้อยค่ะ');
  };

  const handleResetToDemoSheet = () => {
    if (!profile) return;
    const demoId = '1emPE5kgg5Gd3fr8caWKV5Km5WYs5WTmKFaGhOlsshPA';
    const demoUrl = 'https://docs.google.com/spreadsheets/d/1emPE5kgg5Gd3fr8caWKV5Km5WYs5WTmKFaGhOlsshPA/edit';
    setSpreadsheetId(demoId);
    setSpreadsheetUrl(demoUrl);
    localStorage.removeItem(`healjai_spreadsheet_id_${profile.nickname}`);
    localStorage.removeItem(`healjai_spreadsheet_url_${profile.nickname}`);
    showToast('รีเซ็ตเป็นแผ่นงานสาธารณะแล้วค่ะ 🌿', 'info', 'เปลี่ยนกลับมาใช้แผ่นงานสาธารณะจำลองของระบบเรียบร้อยค่ะ');
  };

  // Sync problems list whenever active profile is updated
  useEffect(() => {
    if (profile) {
      const local = localStorage.getItem(`healjai_saved_problems_${profile.nickname}`);
      if (local) {
        try {
          setSavedProblems(JSON.parse(local));
        } catch (e) {
          setSavedProblems((profile as any).selectedProblems || []);
        }
      } else {
        setSavedProblems((profile as any).selectedProblems || []);
      }
    } else {
      setSavedProblems([]);
    }
  }, [profile]);

  const handleSaveProblem = async (problem: any) => {
    if (!profile) return;
    
    const newProblem = {
      id: "prob-" + Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      ...problem
    };

    const updated = [newProblem, ...savedProblems];
    setSavedProblems(updated);
    localStorage.setItem(`healjai_saved_problems_${profile.nickname}`, JSON.stringify(updated));

    showToast(
      'บันทึกพฤติกรรมต้นไม้ปัญหาวางใจแล้วค่ะ 🌳💚',
      'success',
      `ผลลัพธ์ได้รับการจัดเก็บเรียบร้อย แม้ปิดเว็บหรือเปลี่ยนเครื่องข้อมูลก็ปลอดภัยค่ะ`
    );

    // Sync to Firestore
    try {
      await fetch('/api/users/update-problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: profile.nickname,
          selectedProblems: updated
        })
      });
    } catch (e) {
      console.warn("Backend API update problems failed:", e);
    }

    // Also trigger handleSaveLog so this problem tree session is recorded in Google Sheets
    await handleSaveLog({
      problemTreeCategory: problem.category,
      problemTreeProblem: problem.problem,
      problemTreeReason: problem.reason,
      problemTreeHelpingFactors: problem.helpingFactors,
    });
  };

  const handleDeleteProblem = async (id: string) => {
    if (!profile) return;

    const updated = savedProblems.filter(p => p.id !== id);
    setSavedProblems(updated);
    localStorage.setItem(`healjai_saved_problems_${profile.nickname}`, JSON.stringify(updated));

    showToast(
      'ลบบันทึกข้อมูลปัญหานี้แล้วค่ะ 🗑️',
      'info',
      'นำรายการตัวเลือกและการวิเคราะห์ออกจากรอยความจำส่วนบุคคลแล้วค่ะ'
    );

    // Sync to Firestore
    try {
      await fetch('/api/users/update-problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: profile.nickname,
          selectedProblems: updated
        })
      });
    } catch (e) {
      console.warn("Backend API delete problem failed:", e);
    }
  };

  const handleUpdateProblem = async (id: string, updatedFields: any) => {
    if (!profile) return;

    const updated = savedProblems.map(p => {
      if (p.id === id) {
        return { ...p, ...updatedFields };
      }
      return p;
    });

    setSavedProblems(updated);
    localStorage.setItem(`healjai_saved_problems_${profile.nickname}`, JSON.stringify(updated));

    showToast(
      'อัปเดตระดับความก้าวหน้าและการเติบโตทางใจสําเร็จแล้วค่ะ 🌱✨',
      'success',
      'เราช่วยจดจำบันทึกเพื่อประเมินระดับความเพียรเผชิญหน้าให้คุณแล้วน้า'
    );

    // Sync to Firestore
    try {
      await fetch('/api/users/update-problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: profile.nickname,
          selectedProblems: updated
        })
      });
    } catch (e) {
      console.warn("Backend API update problems failed:", e);
    }
  };

  const [showAlarmPopup, setShowAlarmPopup] = useState(false);
  const [alarmTriggerTime, setAlarmTriggerTime] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  // Sourced dynamically from localStorage sounds database
  const [globalTracks, setGlobalTracks] = useState<any[]>(() => {
    const local = localStorage.getItem('healjai_sounds');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        return parsed.filter((s: any) => !s.isYoutube);
      } catch (e) {
        return [];
      }
    }
    // Set to empty array by default (meaning all deleted!)
    return [];
  });

  // Keep synced in real-time between app tabs
  useEffect(() => {
    const syncTracksList = () => {
      const local = localStorage.getItem('healjai_sounds');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setGlobalTracks(parsed.filter((s: any) => !s.isYoutube));
        } catch (e) {
          setGlobalTracks([]);
        }
      } else {
        setGlobalTracks([]);
      }
    };

    window.addEventListener('healjai_sounds_changed', syncTracksList);
    return () => {
      window.removeEventListener('healjai_sounds_changed', syncTracksList);
    };
  }, []);

  // Global background player state
  const [globalPlayingId, setGlobalPlayingId] = useState<string | null>(null);
  const [globalVolume, setGlobalVolume] = useState<number>(0.35);
  const [showGlobalMusicPanel, setShowGlobalMusicPanel] = useState<boolean>(false);
  const globalAudioRef = React.useRef<HTMLAudioElement | null>(null);

  // Mute global music when Relaxation screen audio triggers
  useEffect(() => {
    if (activeTab === 'relax' && globalPlayingId) {
      if (globalAudioRef.current) globalAudioRef.current.pause();
      setGlobalPlayingId(null);
    }
  }, [activeTab, globalPlayingId]);

  // Cleanup global on unmount
  useEffect(() => {
    return () => {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
      }
    };
  }, []);

  const handleToggleGlobalTrack = (trackId: string) => {
    const track = globalTracks.find(t => t.id === trackId);
    if (!track) return;

    if (globalPlayingId === trackId) {
      if (globalAudioRef.current) globalAudioRef.current.pause();
      setGlobalPlayingId(null);
    } else {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
      }
      globalAudioRef.current = new Audio(track.url);
      globalAudioRef.current.loop = true;
      globalAudioRef.current.volume = globalVolume;
      globalAudioRef.current.play().catch(e => console.warn("Autoplay global blocked by sandbox:", e));
      setGlobalPlayingId(trackId);
    }
  };

  const handleGlobalVolumeChange = (vol: number) => {
    setGlobalVolume(vol);
    if (globalAudioRef.current) {
      globalAudioRef.current.volume = vol;
    }
  };

  // Daily Alarm Active Evaluation Loop
  useEffect(() => {
    let lastCheckedMinute = '';
    const alarmInterval = setInterval(() => {
      const isEnabled = localStorage.getItem('healjai_alarm_enabled') === 'true';
      const scheduledTime = localStorage.getItem('healjai_alarm_time') || '20:00';
      
      if (isEnabled) {
        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        const formattedMin = `${hh}:${mm}`;

        if (formattedMin === scheduledTime && lastCheckedMinute !== formattedMin) {
          lastCheckedMinute = formattedMin;
          setAlarmTriggerTime(scheduledTime);
          setShowAlarmPopup(true);
          showToast(
            'กริ๊งๆ! ได้เวลาสะท้อนอารมณ์และดูแลใจแล้วนะคะ 🔔',
            'alarm',
            `เวลาแจ้งเตือนรายวันของคุณ (${scheduledTime} น.) มาถึงแล้วค่ะ เข้ามาผ่อนคลายและสะท้อนอารมณ์กับพี่ฮีลใจสักนิดน้าคนเก่ง 💚`,
            6000
          );
        }
      }
    }, 12000); // Check every 12 seconds

    return () => clearInterval(alarmInterval);
  }, []);

  // Synchronous profile restoration handled in state initializer

  // 2. Fetch recorded logs simple REST proxy & local fallback
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.warn("Backend logs API connection failed, falling back to local storage.", error);
      const localLogs = localStorage.getItem('healjai_local_logs');
      if (localLogs) {
        setLogs(JSON.parse(localLogs));
      }
    }
  };

  useEffect(() => {
    if (profile) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000); // Real-time background sync every 5 seconds
      return () => clearInterval(interval);
    }
  }, [profile]);



  // 3. Save logs to memory on server & back up locally
  const handleSaveLog = async (logPayload: Partial<MentalHealthLog>) => {
    if (!profile) return;

    // Retrieve the latest problem tree results for automatic consolidation
    const latestProblem = savedProblems[0] || null;

    // Retrieve the latest assessmentResult from logs
    const latestAssessmentLog = logs.find(l => l.assessmentResult);
    const latestAssessmentResult = latestAssessmentLog ? latestAssessmentLog.assessmentResult : undefined;

    const fullLog: MentalHealthLog = {
      id: Math.random().toString(36).substring(2, 9),
      email: profile.email,
      nickname: profile.nickname,
      targetGroup: profile.targetGroup,
      gender: profile.gender || '',
      ageRange: profile.ageRange || '',
      date: new Date().toISOString().split('T')[0],
      mood: logPayload.mood || (logs[0]?.mood ?? 'neutral'),
      journal: logPayload.journal !== undefined ? logPayload.journal : (logs[0]?.journal ?? ''),
      problemTreeCategory: logPayload.problemTreeCategory || latestProblem?.category || '-',
      problemTreeProblem: logPayload.problemTreeProblem || latestProblem?.problem || '-',
      problemTreeReason: logPayload.problemTreeReason || latestProblem?.reason || '-',
      problemTreeHelpingFactors: logPayload.problemTreeHelpingFactors || latestProblem?.helpingFactors || [],
      assessmentResult: logPayload.assessmentResult || latestAssessmentResult,
      timestamp: new Date().toISOString(),
      ...logPayload
    };

    // Update state immediately for real-time responsiveness
    const updatedLogs = [fullLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('healjai_local_logs', JSON.stringify(updatedLogs));

    // Display beautiful UI Toast notification
    if (logPayload.assessmentResult) {
      showToast(
        'อัปเดตสถานะสุขภาพจิตเสร็จสมบูรณ์ค่ะ 📝',
        'success',
        `บันทึกผลตรวจสอบระดับ "${logPayload.assessmentResult.status}" แล้ว โอบกอดใจไว้เก่งมากแล้วค่ะ 💚`
      );
    } else if (logPayload.mood) {
      const moodLabels: Record<string, string> = { 
        great: 'ยอดเยี่ยม (รู้สึกเบาสบายใจ)', 
        neutral: 'เฉยๆ เรื่อยๆ (เรียบง่ายแจ่มใส)', 
        sad: 'เศร้า/หมองหม่น (แสนเหนื่อยล้า)', 
        stressed: 'เครียด/ตึงเครียด (กังวลสับสน)' 
      };
      const label = moodLabels[logPayload.mood] || 'ปกติ';
      showToast(
        'บันทึกสภาวะอารมณ์สำเร็จค่ะ 🌸',
        'success',
        `คุณบันทึกใจวันนี้ว่ารู้สึก "${label}" พี่ฮีลใจพร้อมโอบกอดและรับฟังคุณเสมอนะคะ 💚`
      );
    }

    // Save to the Full-stack Node database proxy
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullLog)
      });
    } catch (e) {
      console.error("Save log to server database proxy failed:", e);
    }

    // Real-time synchronization to Google Sheets if user has authenticated their Google drive/sheets access
    if (googleToken) {
      appendLogsToSheet(googleToken, spreadsheetId, [fullLog])
        .then(() => {
          console.log('[Sheets API Sync] Log synced successfully on submission.');
        })
        .catch((sheetErr) => {
          const errStr = String(sheetErr.message || sheetErr);
          if (errStr.includes('Unauthenticated') || errStr.includes('401') || errStr.includes('credential') || errStr.includes('เซสชัน')) {
            console.warn('[Sheets API Sync Warning] Failed to sync log on submission (session expired):', sheetErr.message || sheetErr);
            setGoogleUser(null);
            setGoogleToken(null);
            localStorage.removeItem('healjai_google_access_token');
            showToast('เชื่อมต่อชีตหลักหลุด', 'warning', 'การซิงก์เรียลไทม์ล้มเหลวเนื่องจากเซสชันหมดอายุ กรุณาลงชื่อเข้าใช้ Google ใหม่อีกครั้งนะคะ');
          } else {
            console.error('[Sheets API Sync] Failed to sync log on submission:', sheetErr);
          }
        });
    }
  };

  const handleStartOnboarding = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('healjai_user_profile', JSON.stringify(newProfile));
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogoutAction = () => {
    setProfile(null);
    localStorage.removeItem('healjai_user_profile');
    setActiveTab('home');
    setShowLogoutConfirm(false);
    showToast(
      'ออกจากระบบสําเร็จแล้วค่ะ 🌿',
      'info',
      'พี่ฮีลใจพร้อมต้อนรับคุณกลับมาเสมอเมื่อต้องการแวะพักและฟื้นฟูจิตใจนะคะ 💚'
    );
  };

  // Render content according to tab selections
  const renderTabContent = () => {
    if (!profile) return null;

    switch (activeTab) {
      case 'home':
        return (
          <HomeDashboard
            profile={profile}
            logs={logs}
            onSaveMood={(mood, journal) => handleSaveLog({ mood, journal })}
            setActiveTab={setActiveTab}
            googleUser={googleUser}
            googleToken={googleToken}
            onConnectGoogle={handleConnectGoogle}
            isSyncingSheets={isSyncingSheets}
            onDisconnectGoogle={handleDisconnectGoogle}
            onManualSync={handleManualSync}
            spreadsheetId={spreadsheetId}
            spreadsheetUrl={spreadsheetUrl}
            onCreateNewSheet={handleCreateNewSheet}
            onSaveCustomSheetId={handleSaveCustomSheetId}
            onResetToDemoSheet={handleResetToDemoSheet}
            onRestoreLogs={(restoredLogs) => {
              setLogs(restoredLogs);
              localStorage.setItem('healjai_local_logs', JSON.stringify(restoredLogs));
            }}
          />
        );
      case 'chat':
        return <AIChat profile={profile} logs={logs} />;
      case 'tree':
        return (
          <ProblemTree
            onSaveProblem={handleSaveProblem}
            savedProblems={savedProblems}
            onDeleteProblem={handleDeleteProblem}
            onUpdateProblem={handleUpdateProblem}
          />
        );
      case 'relax':
        return <Relaxation />;
      case 'test':
        return (
          <Assessment
            nickname={profile.nickname}
            onCompleteCheck={(screening, score, status, advice) => {
              handleSaveLog({
                mood: logs[0]?.mood || 'neutral',
                assessmentResult: {
                  screening,
                  score,
                  status,
                  advice
                }
              });
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MobileFrame
      isFullscreen={isFullscreen}
      setIsFullscreen={setIsFullscreen}
      nickname={profile?.nickname}
    >
      {!profile ? (
        <WelcomeScreen onStart={handleStartOnboarding} />
      ) : (
        <div id="main-app-container" className="flex-1 flex flex-col h-full overflow-hidden select-none">
          
          {/* Top User Status Header Inside Phone Screen */}
          <div className="bg-white border-b border-rose-50 px-4 py-2 shrink-0 flex items-center justify-between z-10 shadow-3xs relative">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-500 text-sm animate-pulse">🌿</span>
              <span className="text-[11px] font-black text-slate-800 tracking-tight">ฮีลใจ Healjai</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-100/80 pl-2 pr-1 py-0.5 rounded-full">
                <span className="text-[9px] font-sans font-black text-slate-500 truncate max-w-[120px] flex items-center gap-0.5">
                  คุณ {profile.nickname}
                  {profile.gender === 'male' && <span title="ชาย">🙋‍♂️</span>}
                  {profile.gender === 'female' && <span title="หญิง">🙋‍♀️</span>}
                  {profile.ageRange && <span className="text-[7.5px] font-bold text-slate-400">({profile.ageRange})</span>}
                </span>
                <button
                  id="header-logout-btn"
                  onClick={handleLogout}
                  title="ออกจากระบบอย่างปลอดภัย"
                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-1 rounded-full cursor-pointer transition-all border border-rose-100 shrink-0"
                >
                  <LogOut className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>

            {/* GLOBAL MUSIC CONTROL DROPDOWN */}
            {showGlobalMusicPanel && (
              <div className="absolute right-4 top-10 bg-white border border-slate-200 p-3 rounded-2xl shadow-xl z-50 w-56 text-slate-700 animate-fade-in">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
                  <span className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                    <Music className="w-3 h-3 text-emerald-600" />
                    คลื่นเสียงดนตรีคลายเครียด 📻
                  </span>
                  <button 
                    onClick={() => setShowGlobalMusicPanel(false)}
                    className="text-[10px] text-slate-400 font-bold hover:text-slate-600 px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-[8px] text-slate-400 font-bold leading-tight mb-2">
                  เปิดทำนองสวมดนตรีช่วยบำบัดให้คุณใจเย็นลงขณะสำรวจแอปค่ะ
                </p>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-0.5 scrollbar-none">
                  {globalTracks.length === 0 ? (
                    <div className="py-3 text-center text-[9px] font-bold text-slate-400 bg-slate-50 border border-dashed rounded-xl px-1">
                      ไม่มีเพลงในระบบขณะนี้ค่ะ 🌱
                      <p className="text-[7.5px] text-slate-400 mt-1 font-semibold leading-normal">
                        (คุณสามารถเพิ่มลิงก์เพลง หรือกดโหลดค่าเริ่มต้นได้ที่เมนู "ระบาย & สมาธิ")
                      </p>
                    </div>
                  ) : (
                    globalTracks.map((track) => {
                      const isTrackPlaying = globalPlayingId === track.id;
                      return (
                        <button 
                          key={track.id}
                          onClick={() => handleToggleGlobalTrack(track.id)}
                          className={`w-full flex items-center justify-between p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isTrackPlaying
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                              : 'bg-slate-50/60 border-slate-100 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[9.5px] font-black truncate leading-tight">{track.title}</p>
                            <p className="text-[8px] text-slate-400 font-bold truncate leading-none mt-0.5">{track.desc}</p>
                          </div>
                          <div className="ml-1 shrink-0">
                            {isTrackPlaying ? (
                              <div className="p-1 bg-rose-500 text-white rounded-full">
                                <Pause className="w-2 h-2" />
                              </div>
                            ) : (
                              <div className="p-1 bg-emerald-600 text-white rounded-full">
                                <Play className="w-2 h-2" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Special YouTube playlist prompt */}
                <div className="mt-2 p-1.5 bg-[#FFF9F0] rounded-xl border border-[#FFF0D4] flex items-start gap-1">
                  <span className="text-[10px] animate-bounce">🎶</span>
                  <div className="flex-1">
                    <p className="text-[8.5px] font-black text-amber-950 leading-tight">มีเพลง YouTube บำบัดพิเศษมาใหม่!</p>
                    <p className="text-[7.5px] text-amber-800 font-semibold leading-tight mt-0.5">
                      รับชมวิดีโอและซึมซับท่วงทำนองปลอบประโลมใจได้ที่ปุ่มเมนู <span className="underline font-black">ระบาย & สมาธิ</span> เจ้าร่างกายเก่งมากค่ะ 💚
                    </p>
                  </div>
                </div>

                {/* Volume Slider */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <button 
                    onClick={() => handleGlobalVolumeChange(globalVolume === 0 ? 0.35 : 0)}
                    className="text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                  >
                    {globalVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={globalVolume}
                    onChange={(e) => handleGlobalVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[8px] font-bold text-slate-400 w-5 text-right">
                    {Math.round(globalVolume * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Core scrollable content layer */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {renderTabContent()}
            <ToastContainer />

            {/* FLOATING QUICK LOG TRIGGER BUTTON */}
            <button
              type="button"
              id="global-quick-log-fab"
              onClick={() => setIsQuickLogOpen(true)}
              className="absolute bottom-5 right-5 z-40 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white py-2 px-3.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all border border-emerald-500/30 cursor-pointer animate-fade-in group"
              title="จดบันทึกอารมณ์ด่วน"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
              </div>
              <span className="text-[10px] font-black tracking-tight flex items-center gap-1 font-sans">
                จดใจด่วน ✍️
              </span>
            </button>

            {/* QUICK LOG MODAL SHEET */}
            <QuickLogModal
              isOpen={isQuickLogOpen}
              onClose={() => setIsQuickLogOpen(false)}
              onSave={(mood, journal) => handleSaveLog({ mood, journal })}
              userNickname={profile.nickname}
            />

            {/* ALARM / REMINDER POPUP LAYER */}
            {showAlarmPopup && (
              <div className="absolute inset-x-4 top-14 bg-[#1C4E44] text-white rounded-3xl p-4 shadow-2xl z-50 animate-bounce duration-500 border border-emerald-500 flex flex-col gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-white/20 rounded-xl shrink-0 text-white">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-black leading-none mb-1">กริ๊ง! ถึงเวลาดูแลใจแล้วนะคะ 🔔</h4>
                    <p className="text-[9.5px] leading-relaxed font-bold opacity-90">
                      เวลาเตือนที่คุณตั้งไว้ ({alarmTriggerTime} น.) หมุนเวียนมาบรรจบแล้วค่ะ เข้ามาสะท้อนอารมณ์และสงบสติสัก 1 นาทีด้วยกันนะคะเจ้าคนเก่ง 💚
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    onClick={() => setShowAlarmPopup(false)}
                    className="px-2.5 py-1 text-[8.5px] bg-white/10 hover:bg-white/20 font-bold rounded-lg cursor-pointer transition-all"
                  >
                    ไว้ทีหลังนะคะ
                  </button>
                  <button
                    onClick={() => {
                      setShowAlarmPopup(false);
                      setActiveTab('home');
                    }}
                    className="px-3.5 py-1 text-[8.5px] bg-emerald-400 text-emerald-950 font-black rounded-lg hover:bg-emerald-300 cursor-pointer shadow-xs transition-all animate-pulse"
                  >
                    เริ่มจดบันทึกเลยค่ะ
                  </button>
                </div>
              </div>
            )}

            {/* CUSTOM LOGOUT CONFIRMATION DIALOG */}
            <AnimatePresence>
              {showLogoutConfirm && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 10 }}
                    transition={{ type: "spring", damping: 25, stiffness: 350 }}
                    className="w-full max-w-[270px] bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-4"
                  >
                    {/* Logout Warning icon frame */}
                    <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 animate-pulse shrink-0">
                      <LogOut className="w-4.5 h-4.5 stroke-[2.5]" />
                    </div>

                    {/* Heading & description */}
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-black text-slate-800 font-display">
                        ต้องการออกจากระบบใช่ไหมคะ? 🌿
                      </h3>
                      <p className="text-[9.5px] text-slate-500 font-bold leading-normal font-sans">
                        ประวัติแวะพักใจและบันทึกต่างๆ จะยังคงปลอดภัยในเครื่องนี้ นิกเนมและ PIN จะกลับมาล็อกอินเข้าบัญชีเดิมเมื่อไหร่ก็ได้น้าคะคนเก่ง 💚
                      </p>
                    </div>

                    {/* Button Grid actions */}
                    <div className="w-full space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={confirmLogoutAction}
                        className="w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-98 text-white rounded-full text-[10.5px] font-black cursor-pointer shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>ออกจากระบบอย่างปลอดภัย</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(false)}
                        className="w-full py-3 bg-slate-50 border border-slate-100 hover:bg-slate-100 active:scale-98 text-slate-700 rounded-full text-[10.5px] font-black cursor-pointer transition-all"
                      >
                        อยู่ดูแลใจต่อด้วยกัน
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Tabs navigation element */}
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
      )}
    </MobileFrame>
  );
}
