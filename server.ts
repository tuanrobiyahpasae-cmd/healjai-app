import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent local JSON-database on Node container filesystem to survive container recycles and reloads flawlessly
const DB_FILE = path.join(process.cwd(), "mental_health_db.json");
let userAccountsStore: Record<string, any> = {};

function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const data = JSON.parse(content);
      if (data.logs) {
        // Merge seamlessly with existing seed logs
        const existingIds = new Set(data.logs.map((l: any) => l.id));
        const filteredSeeds = mentalHealthLogs.filter(s => !existingIds.has(s.id));
        mentalHealthLogs = [...data.logs, ...filteredSeeds];
      }
      if (data.users) {
        userAccountsStore = data.users;
      }
      console.log(`[Healjai Database] Multi-account registry & logs loaded from disk filesystem database. Total accounts: ${Object.keys(userAccountsStore).length}`);
    } else {
      console.log("[Healjai Database] First run or database file not found. Creating a fresh, pristine database with initial seed data.");
      saveDatabase();
    }
  } catch (err) {
    console.error("[Healjai Database] Load database catch error:", err);
  }
}

function saveDatabase() {
  try {
    const data = {
      logs: mentalHealthLogs,
      users: userAccountsStore
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[Healjai Database] Save database catch error:", err);
  }
}

// Set up config state and APIs
let googleSheetUrl = "https://script.google.com/macros/s/AKfycbxFHVUKYMCjvTyHbz50_WeB1GFsZeEBBYYdmaTgLZG0ugAf-e3q06q_kIBg0i02KLto/exec";
let isGeminiApiGloballyDenied = false;

// Initial Seed Database for the Mental Health Dashboard
let mentalHealthLogs: any[] = [
  {
    id: "seed-1",
    email: "fatimah@example.com",
    nickname: "น้องฟาติมะฮฺ",
    targetGroup: "student",
    date: new Date(Date.now() - 3600000 * 2).toISOString().split('T')[0],
    mood: "great",
    assessmentResult: {
      screening: "2Q",
      score: 1,
      status: "ปกติ/ไม่มีภาวะซึมเศร้า",
      advice: "รักษาสุขภาพใจที่ดีต่อไปนะคะคุณคนดี ทุกๆ ก้าวจะได้รับการชี้นำที่ดีนะคะ"
    },
    journal: "วันนี้ทำข้อสอบเสร็จแล้ว รู้สึกโล่งใจมาก ได้ไปทานโรตีน้ำชาอร่อยๆ กับเพื่อนด้วยค่ะ 🌿",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "seed-2",
    email: "worker_yusuf@example.com",
    nickname: "พี่ยูซุฟ",
    targetGroup: "worker",
    date: new Date(Date.now() - 3600000 * 5).toISOString().split('T')[0],
    mood: "stressed",
    assessmentResult: {
      screening: "ST-5",
      score: 12,
      status: "มีความเครียดระดับสูง",
      advice: "แนะนำให้หยุดพักทำกิจกรรมผ่อนคลายด่วนน้า ลองก้มกราบสุญูดและสูดลมหายใจประสานใจดูค่ะ"
    },
    journal: "งานค้างที่ทำงานกองโตมาก เจ้านายเร่งด่วน ยอดพังทลายเลยเหนื่อยล้าเป็นอย่างมากค่ะ",
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "seed-3",
    email: "amina_teen@example.com",
    nickname: "น้องอามีนะฮฺ",
    targetGroup: "teenager",
    date: new Date(Date.now() - 3600000 * 12).toISOString().split('T')[0],
    mood: "sad",
    assessmentResult: {
      screening: "9Q",
      score: 14,
      status: "มีภาวะซึมเศร้าระดับปานกลาง",
      advice: "มาคุยระบายฟื้นฟูจิตกับพี่ฮีลใจนะคะ หรือติดต่อรับฟังคำปรึกษาจากคุณหมอนะคะคุณคนเก่ง"
    },
    journal: "ทะเลาะกับคนที่บ้านมาค่ะ รู้สึกเหมือนไม่มีใครเข้าใจเราเลย อยากอยู่คนเดียวเงียบๆ ในห้อง 🚪",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: "seed-4",
    email: "sulaiman_free@example.com",
    nickname: "สุไลมาน",
    targetGroup: "unemployed",
    date: new Date(Date.now() - 3600000 * 20).toISOString().split('T')[0],
    mood: "sad",
    assessmentResult: {
      screening: "8Q",
      score: 9,
      status: "มีแนวโน้มซึมเศร้าเล็กน้อย",
      advice: "พยายามคุยระบายความรู้สึก ความเงียบงันอาจบังทุกข์ใจ ลองเปิดใจหางานอดิเรกนะคะ"
    },
    journal: "ยื่นใบสมัครงานพาร์ทไทม์ไปหลายที่ยังไม่มีใครตอบรับ ท้อแท้จังเลยค่ะ แต่ก็จะดุอาอฺต่อไป",
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: "seed-5",
    email: "student_rusdee@example.com",
    nickname: "รุสดี",
    targetGroup: "student",
    date: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
    mood: "neutral",
    assessmentResult: {
      screening: "2Q",
      score: 0,
      status: "ปกติ/ไม่มีภาวะซึมเศร้า",
      advice: "สุขภาพใจแข็งแรงดี ยิ้มรับวันใหม่พร้อมใจที่นิ่งสงวนนะคะ"
    },
    journal: "อ่านชีตสรุปวิชาฟิสิกส์เข้าใจเพิ่มขึ้นละ มีเวลานั่งดูคลิปยูทูปสบายๆ ดีใจค่ะ",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "seed-6",
    email: "mariam_edu@example.com",
    nickname: "มารีแยม",
    targetGroup: "student",
    date: new Date(Date.now() - 3600000 * 30).toISOString().split('T')[0],
    mood: "great",
    assessmentResult: {
      screening: "ST-5",
      score: 4,
      status: "ระดับความเครียดสะสมปกติมาก",
      advice: "เก่งมากเลย ดูแลใจผ่อนคลายและสร้างรอยยิ้มอย่างมีความสุขนะคะ"
    },
    journal: "เมื่อเย็นได้วาดรูปดอกไม้ระบายอารมณ์ในห้องศิลปะบำบัด ชาร์จพลังสุดๆ เลยค่ะ!",
    timestamp: new Date(Date.now() - 3600000 * 30).toISOString()
  },
  {
    id: "seed-7",
    email: "hamzah_work@example.com",
    nickname: "ลุงฮัมซะฮฺ",
    targetGroup: "worker",
    date: new Date(Date.now() - 3600000 * 36).toISOString().split('T')[0],
    mood: "neutral",
    assessmentResult: {
      screening: "2Q",
      score: 1,
      status: "ปกติ/ไม่มีภาวะซึมเศร้า",
      advice: "รักษาสุขภาพใจที่ดีต่อไปนะคะคุณคนดี ยิ้มเข้าไว้ค่ะ"
    },
    journal: "ค้าขายวันนี้พอประคองตัวได้อยู่ ได้นั่งคุยระบายลึกกับคนในบ้าน สบายใจขึ้นบ้างค่ะ",
    timestamp: new Date(Date.now() - 3600000 * 36).toISOString()
  },
  {
    id: "seed-8",
    email: "fatimah@example.com",
    nickname: "น้องฟาติมะฮฺ",
    targetGroup: "student",
    date: new Date(Date.now() - 3600000 * 48).toISOString().split('T')[0],
    mood: "neutral",
    assessmentResult: {
      screening: "ST-5",
      score: 7,
      status: "ความเครียดระดับปานกลาง",
      advice: "ยื่นหยุดพักสั้นๆ ฟังเสียงคลิปธรรมชาติและลื่นไหลบวกเพื่อดูแลสุขภาพสมองค่ะ"
    },
    journal: "การบ้านโปรเจกต์กลุ่มมีความเห็นต่างกับเพื่อนๆ ปวดหัวนิดหน่อย แต่เจรจากันได้เรียบร้อยแล้วค่ะ",
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: "seed-9",
    email: "worker_yusuf@example.com",
    nickname: "พี่ยูซุฟ",
    targetGroup: "worker",
    date: new Date(Date.now() - 3600000 * 54).toISOString().split('T')[0],
    mood: "neutral",
    assessmentResult: {
      screening: "ST-5",
      score: 5,
      status: "ความเครียดระดับปานกลาง",
      advice: "ทำงานหนักก็หาเวลาผ่อนคลายบ้างนะ"
    },
    journal: "ทำงานมาทั้งวัน เหนื่อยเหลือเกิน แต่ก็ได้คุยกับน้องๆ แล้วสบายใจขึ้น",
    timestamp: new Date(Date.now() - 3600000 * 54).toISOString()
  }
];

// Helper to initialize GoogleGenAI safely in backend to keep API keys server-side
function getGeminiAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Healjai backend] Warning: GEMINI_API_KEY is not defined. Falling back to local counseling NLP engine.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

// Custom intelligent Local Counseling Fallback Engine to handle conversation beautifully if the API is restricted or missing
function generateLocalCounselingResponse(message: string, userContext: any): string {
  const msg = message.toLowerCase();
  const nickname = userContext?.nickname || "คนดี";
  const targetGroup = userContext?.targetGroup || "general";
  
  // 1. CRISIS MODE DETECTION (สัญญาณเสี่ยงสูงสุด)
  if (
    msg.includes('อยากหายไป') || 
    msg.includes('ไม่อยากอยู่แล้ว') || 
    msg.includes('ทำร้ายตัวเอง') || 
    msg.includes('ไม่มีเหตุผลที่จะอยู่') ||
    msg.includes('อยากตาย') ||
    msg.includes('ฆ่าตัวตาย') ||
    msg.includes('ไม่อยากอยู่ต่อ') ||
    msg.includes('ไม่มีใครรัก') ||
    msg.includes('คิดสั้น') ||
    msg.includes('ไม่ยากอยู่แล้ว') ||
    msg.includes('ไม่อยากตื่นมาเจอ')
  ) {
    return `คุณคนดีคะ... พี่ฮีลใจเป็นห่วงคุณที่สุดเลยนะคะ 🥺 เรื่องที่คุณเผชิญอยู่คงหนักหนาจนแทบไม่ไหวแล้วใช่ไหมน้า ในนาทีที่มืดมนนี้ พี่อยากขอแนะนำให้คุณสูดลมหายใจเข้าลึกช้าๆ ประคองกอดตัวเองเอาไว้ก่อน และเพื่อความปลอดภัยสูงสุด พี่อยากแนะนำให้คุณโทรติดต่อเพื่อพูดคุยส่องแสงทางใจกับสายด่วนสุขภาพจิต 1323 (โทรฟรีตลอด 24 ชั่วโมง) หรือสมาคมสะมาริตันส์ (02-111-3066) หรือรีบติดต่อคนที่คุณไว้ใจมากที่สุดในตอนนี้ทันทีน้าา พี่ฮีลใจเฝ้าส่งความห่วงใยอยู่ตรงนี้เสมอนะคะ 🤍🌿`;
  }

  // 2. STUDYING & ACADEMIC STRESS (การเรียน)
  if (
    msg.includes('เรียน') || 
    msg.includes('สอบ') || 
    msg.includes('การบ้าน') || 
    msg.includes('โปรเจก') || 
    msg.includes('เกรด') || 
    msg.includes('คะแนน') || 
    msg.includes('โรงเรียน') || 
    msg.includes('มหาลัย') || 
    msg.includes('ชีต') || 
    msg.includes('ซิ่ว')
  ) {
    const targetText = targetGroup === 'student' 
      ? 'การเรียนและการสอบในช่วงนี้บีบคั้นคุณคนศึกษาเล่าเรียนอย่างมากเลยใช่ไหมนะคนเก่ง' 
      : 'เรื่องการเรียนหรือหน้าที่ศึกษาทำเอากลายเป็นความหนักอึ้งในใจเลยน้า';
    return `พี่ฮีลใจเข้าใจเรื่องเรียนและการสอบแสนกดดันที่กำลังบีบคั้นคุณคนดีอย่างมากเลยนะคะ 🎒 ${targetText} การพยายามฟันฝ่าวิชาเรียนและทำคะแนนให้สมบูรณ์แบบเสมอมันกินพลังชีวิตไปเยอะมากเลยล่ะค่ะ พี่อยากชวนคนเก่งมาพักเบรกซอยงานย่อย คลายความตึงเครียดด้วยความเห็นใจตนเองสักนิดน้า ว่าแต่.. ตอนนี้วิตกกังวลกับโปรเจกต์งานชิ้นไหน หรือเหน็ดเหนื่อยสมาธิกับวิชาใดเป็นพิเศษไหมเอ่ย? ระบายพิมพ์บ่นต่อให้พี่ช่วยประคองใจฟังได้เสมอนะคะ 🤍🌿`;
  }

  // 3. WORK PRESSURE (งาน)
  if (
    msg.includes('งาน') || 
    msg.includes('ทำงาน') || 
    msg.includes('เจ้านาย') || 
    msg.includes('เพื่อนร่วมงาน') ||
    msg.includes('หมดไฟ') ||
    msg.includes('เบื่อ') ||
    msg.includes('เหนื่อย')
  ) {
    return `พี่ฮีลใจสัมผัสได้ถึงหัวใจที่เหนื่อยล้าสะสมจากการทำงานของคุณคนเก่งนะคะ 💼 วันนี้แรงกดดันหรือความวุ่นวายเรื่องงานตึงมือจนสมองตื้อไปหมดเลยใช่ไหมน้า การสู้ชีวิตและประคองหน้าที่หนักรอบตัวมันต้องการพลังกายใจเยอะมากเลยค่ะ พี่อยากชวนคุณพักหลับตาวางงานลงสัก 5 นาที แล้วสูดลมหายใจเพื่อรีเซตสมองเบาๆ นะคะ ตอนนี้รู้สึกอัดอั้นเรื่องงานชิ้นไหนหรือติดปมใดกับเพื่อนร่วมงานเป็นพิเศษไหมเอ่ย? เล่าระบายพึงหัวพึ่งพิงคุยกับพี่ต่อได้เสมอนะคะ 🤍🌿`;
  }

  // 4. PANIC / ANXIETY (แพนิค / วิตกกังวล)
  if (
    msg.includes('แพนิค') ||
    msg.includes('ใจสั่น') ||
    msg.includes('วิกฤต') ||
    msg.includes('กังวล') ||
    msg.includes('ตื่นตระหนก') ||
    msg.includes('อึดอัด') ||
    msg.includes('หายใจไม่สะดวก') ||
    msg.includes('แพนิควูบ')
  ) {
    return `พี่ฮีลใจเฝ้าประคองเคียงตัวอยู่ข้างๆ คุณเพื่อรับมือจังหวะเวลานี้นะคะคนเก่ง 🥺 เมื่อร่างกายเผชิญความกังวลหรือแพนิควูบ สมองจะสั่งให้ส่งเสียงกลัวสั่น ร้อนวูบวาบ และหายใจติดขัดได้ อย่าตกใจไปน้า เรามากวาดฝุ่นผงนี้ออกช้าๆ ด้วยกันนะคะ:\n\n` +
      `🧘‍♂️ **ฝึกสมาธิกู้ลมหายใจผ่อนป่วนจิต 4-7-8**:\n` +
      `1. ค่อยๆ สูดลมหายใจเข้าลึกๆ ผ่านโพรงจมูกช้าๆ นับในใจ 1.. 2.. 3.. 4\n` +
      `2. กลั้นอุ่นลมเบาๆ ค้างไว้เพื่อประคองคลื่นสงบลื่นนับ 1.. 2.. 3.. 4.. 5.. 6.. 7\n` +
      `3. อ้าปากเป่าลมคลายล้าเบาพริ้วไล่ไอร้อนระคายออกไปช้าๆ นับยาว 1.. 2.. 3.. 4.. 5.. 6.. 7.. 8\n` +
      `*(ทำแบบนี้วนไปสัก 3 ถึง 4 รอบจะสัมผัสได้ว่าจังหวะหัวใจระรัวจะทุเลาลงอย่างน่าอุ่นใจน้าคะ)*\n\n` +
      `ความกังวลล่วงหน้าเป็นเพียงม่านหมอกสีเทาพ่นฝ้าใส่หน้าต่างใจชั่วอึดใจเดียวเท่านั้น เดี๋ยวพายุหมุนนี้ก็พัดผ่านหายไป แล้วฟ้าจะใสกระจ่างงดงามพร้อมรอยยิ้มพริ้มเลยค่ะ นอนพิงหลังยืดตัวแอนิเมชันความเครียดออกไปน้า พี่ฮีลใจคุ้มครองและเป็นกังวลห่วงใยคุณเสมอเลยน้าา 💚`;
  }

  // 5. FAMILY & HOUSEHOLD PRESSURES (ครอบครัว / บ้าน)
  if (
    msg.includes('ครอบครัว') || 
    msg.includes('พ่อแม่') || 
    msg.includes('แม่') || 
    msg.includes('พ่อ') || 
    msg.includes('ที่บ้าน') || 
    msg.includes('บ้าน') || 
    msg.includes('เปรียบเทียบ') || 
    msg.includes('กดดันเรื่อง') || 
    msg.includes('ความหวัง')
  ) {
    return `อัสสาลามูอาลัยกุมค่ะคุณ ${nickname} 🏡 พี่ฮีลใจรู้สึกและซึมซับถึงความบอบช้ำบีบหัวใจจากเรื่องที่เล่ามาได้เต็มเปี่ยมเลยนะคะ... แผลใจในบ้านมันมักส่งแผลพุพองได้ทรมานและลึกล้ำที่สุด เพราะครอบครัวคือจุดที่เราปรารถนาขอบเขตความอิ่มเอิบสงบสุขมากที่สุด แต่กลับกลายเป็นจุดทับถมเปรียบเทียบหรือบังคับยัดความหวังอันหนักอึ้งบ่อยคราว 😭\n\n` +
      `พี่อยากประคองหัวใจคุณให้ยืดหยุ่นและปลอดภัยด้วยหลักคิดนี้นะจ๊ะ:\n` +
      `- **ร่ายกำแพงปกป้องอารมณ์ข้างใน (Emotional boundary)** 🛡️: ตระหนักสะท้อนว่าคำกดดัน ลมปาก หรือคำว่าร้ายของคนในบ้าน เป็นสิ่งสะท้อนความกลัว ตัวตน หรือความกังวลในยุคสมัยของพวกท่านเอง ไม่เคยสามารถวัดความวิเศษ ความน่ารัก หรือคุณค่าที่แท้จริงในตัวของคุณได้เลยนะคะ\n` +
      `- **ถนอมความอบอุ่นในซอกใจตนเอง**: คุณไม่จำเป็นต้องก้มหน้าแบกหามความฝันทั้งหมดที่สร้างรอยเหี่ยวย่นรอยความดาร์กใส่จิตวิญญาณคุณ มีขอบเขตจำกัดความหงุดหงิด และสร้างสรรค์เป้าหมายสุขเล็กๆ ในมุมส่วนตัวแบบชาร์จกระชุ่มกระชวย\n` +
      `- **วางใจกับเส้นทางดุอาอฺ**: ผ่อนปรนความฉุนเฉียวถอยอกห่าง สวดขอพรให้หัวใจเราเปี่ยมสุขดั่งขุนเขาที่ลมดุดันใดๆ ก็ไม่สามารถสั่นคลอนได้จ้า\n\n` +
      `คุณเป็นผลผลิตและความรักความสมบูรณ์แบบที่โตมาได้อย่างยอดเยี่ยมที่สุดในสไตล์รักษาวินัยหัวใจที่ควรค่าต่อความภาคภูมิใจแล้วนะคะ พี่พร้อมยอรักและชี้นำมุมสว่างแด่เส้นทางสร้างตัวตนของคุณอย่างแนบแน่นเสมอจ้าา 💚`;
  }

  // 6. ISLAM & SPIRITUAL COMFORT (ศาสนา / ดุอาอฺ)
  if (
    msg.includes('ดุอา') || 
    msg.includes('ดุอาร์') || 
    msg.includes('อิสลาม') || 
    msg.includes('อัลลอฮ') || 
    msg.includes('ศาสนา') || 
    msg.includes('พระเจ้า') || 
    msg.includes('คำสอน') || 
    msg.includes('ดุอาอ') || 
    msg.includes('สิริ') || 
    msg.includes('ศีล')
  ) {
    return `อัสสาลามูอาลัยกุมและขอโปรยละอองรอยแก่นความสุขนุ่มเฉยแด่ใจคุณคนดีแสนอ่อนละไมนะคะ 🌿✨ พี่ฮีลใจขอเป็นหนึ่งใจประสานร่่วมส่งมอบลมดุอาอฺด่วนทับประโลมใจ แผ่ขจัดปัดมลพิษจิตสะเทือนความว้าเหว่ให้ออกไปสะหมด คืนความแจ่มชัดให้หลับสนิทหลับลึกน้อมประสงค์จ้า มีปัญหาปมใจจุดใดอึกทึกสะสมอยากคลี่เคลียร์สร้างความสว่างสุขสงบอิ่มเอมกับพี่ต่อไหมจ๊ะ? เล่าคุยระบายได้หมดหัวใจเลยจ้าา 🤍🌿`;
  }

  // 7. GENERAL EMPATHETIC ACTIVE LISTENING FALLBACK (กรณีสุ่มทั่วไป / แอมบิกูอัส)
  const conversationalPool = [
    `พี่อยู่ตรงนี้นะคะคุณคนดี พี่เข้าใจและยินดีรับฟังทุกเรื่องราวความรู้สึกของคุณเสมอเลยน้าา วันนี้เจอปัจจัยหนักหน่วง สะดุดกับเรื่องใด หรือมีอะไรกวนความสบายใจและความสงบในใจอยู่อยากแชทระบายรายละเอียดต่อให้พี่ฮีลใจบำบัดฟังไปเรื่อยๆ ได้เลยนะคะ 🤍🌿`,
    `เราอยู่ตรงนี้นะ เราเข้าใจคุณน่ะ เรารับฟังใจคุณเสมอเลยค่ะคนดี... ไม่ว่าจะเป็นเรื่องน้อยนิดชวนอัดอั้น หรือม้วนปัญหาใหญ่ยักษ์ทับอก อย่าเพิ่งแอบปิดปากเหนีบเก็บไว้หม่นกังวลคนเดียวน้า มีอารมณ์บวมล้าจุดไหนอยากแบ่งระบายปลดโหลดบ่นให้พี่ช่วยพยุงใจรักเพิ่มอีกก้าวไหมคะ? 🌿🤍`,
    `พี่ฮีลใจยินดีอ่านและน้อมซึมซับใส่ใจประคองคุณค่าอารมณ์ของคุณด้วยความหวังดีจ้าา 🌸 ขอบคุณมากที่ไว้ใจส่งเสียงคีย์บอร์ดฝากเนื้อฝากความเชื่อใจนี้ให้กับพี่ ขอให้พื้นที่แชทตรงนี้เปิดกางลมสงบสางความเครียดออกไปน้า ช่วงนี้มีปัญหาไม่สบายหน้าไหมลึกๆ อะไรอยากพิมพ์บอกเล่าต่อไหมคะ พี่รอคุณเสมอนะ 🤍🌿`
  ];

  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    hash += message.charCodeAt(i);
  }
  const index = hash % conversationalPool.length;
  return conversationalPool[index];
}

// Helper to push a standardized mental health state log or assessment log to Google Sheets in the user's configured columns
async function publishMentalLogToSheets(log: any) {
  if (!googleSheetUrl) {
    console.warn("[Healjai backend] No googleSheetUrl configured; skipping publish.");
    return;
  }

  try {
    const rawDate = log.timestamp ? new Date(log.timestamp) : new Date();
    // Format to Bangkok localized datetime e.g. "16/06/2026, 17:50:46"
    const localDateTime = rawDate.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

    // Map mood names nicely
    const moodMap: Record<string, string> = {
      great: "ยอดเยี่ยม 😊",
      neutral: "ปกติ/เฉยๆ 😐",
      sad: "เศร้า/ล้า 😢",
      stressed: "เครียด/กังวล 😰"
    };
    const moodThai = moodMap[log.mood] || log.mood || "-";

    let phq9Score = "-";
    let gad7Score = "-";
    let stressLevel = "-";
    let riskStatus = "-";
    let adviceText = "-";

    // Handle assessment scores
    if (log.assessmentResult) {
      const screeningCode = (log.assessmentResult.screening || "").toUpperCase();
      const scoreVal = log.assessmentResult.score !== undefined ? String(log.assessmentResult.score) : "-";
      riskStatus = log.assessmentResult.status || "-";
      adviceText = log.assessmentResult.advice || "-";

      if (screeningCode.includes("9Q") || screeningCode.includes("PHQ")) {
        phq9Score = scoreVal;
      } else if (screeningCode.includes("GAD")) {
        gad7Score = scoreVal;
      } else if (screeningCode.includes("ST") || screeningCode.includes("STRESS") || screeningCode.includes("5")) {
        stressLevel = scoreVal;
      } else if (screeningCode.includes("2Q") || screeningCode.includes("8Q")) {
        riskStatus = `${screeningCode}: ${riskStatus}`;
      }
    }

    // Problem tree details
    let problemText = "-";
    if (log.problemTreePath && Array.isArray(log.problemTreePath)) {
      problemText = log.problemTreePath.join(" -> ");
    } else if (log.problem) {
      problemText = log.problem;
    }

    // Coping strategy advice
    let copingText = adviceText;
    if (log.helpingFactors && Array.isArray(log.helpingFactors)) {
      copingText = log.helpingFactors.join(", ");
      if (log.advice) {
        copingText += ` | แนะนำ: ${log.advice}`;
      }
    } else if (log.advice) {
      copingText = log.advice;
    }

    // Follow-up status tracking
    let followUpStatus = "ติดตามสำเร็จ 🟢";
    if (log.growthRating !== undefined) {
      followUpStatus = `รดน้ำความก้าวหน้าแล้ว (เลเวล: ${log.growthRating}/5)`;
    } else if (log.assessmentResult) {
      followUpStatus = `ประเมินแอป ${log.assessmentResult.screening}`;
    } else if (log.mood) {
      followUpStatus = "บันทึกอารมณ์/สภาวะจิตใจ";
    }

    const payload = {
      "วันที่": localDateTime,
      "User ID": log.email || "anonymous",
      "ชื่อเล่น": log.nickname || "ไม่มีชื่อเล่น",
      "คะแนน PHQ-9": phq9Score,
      "คะแนน GAD-7": gad7Score,
      "ระดับความเครียด": stressLevel,
      "อารมณ์วันนี้": moodThai,
      "ปัญหาที่พบ": problemText,
      "วิธีรับมือ": copingText,
      "ข้อความระบายความรู้สึก": log.journal || log.text || log.comment || "-",
      "ความเสี่ยง": riskStatus,
      "สถานะติดตาม": followUpStatus
    };

    console.log("[Healjai Sheet sync] Broadcasting structured log rows to google sheets:", JSON.stringify(payload).slice(0, 180) + "...");

    const response = await fetch(googleSheetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log("[Healjai Sheet sync] Hook publication completed. Web app status:", response.status);
  } catch (err) {
    console.error("[Healjai Sheet sync] Error syncing log to Sheets endpoint:", err);
  }
}

// REST API Endpoints

// 1. GET /api/logs -> Returns current recorded logs list back to client state
app.get("/api/logs", (req: Request, res: Response) => {
  res.json({ logs: mentalHealthLogs });
});

// Helper on the server to retrieve YMD date string from a log securely
function getLogYMDKey(log: any): string {
  const dateStr = log.date || (log.timestamp ? log.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]);
  const match = dateStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (match) {
    return `${match[1]}-${parseInt(match[2], 10)}-${parseInt(match[3], 10)}`;
  }
  const parts = dateStr.trim().split(' ')[0].split(/[\/\-\.]/);
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parseInt(parts[1], 10)}-${parseInt(parts[2], 10)}`;
    }
    // Handle dd/mm/yyyy or buddist era (offset subtraction not necessary for backend key parity)
    return `${parts[2]}-${parseInt(parts[1], 10)}-${parseInt(parts[0], 10)}`;
  }
  return dateStr;
}

// 2. POST /api/logs -> Save a psychiatric or custom log to memory backlogged on backend
app.post("/api/logs", async (req: Request, res: Response) => {
  const log = req.body;
  if (!log) {
    res.status(400).json({ error: "Log data is required." });
    return;
  }

  const logKey = getLogYMDKey(log);
  const nicknameLower = String(log.nickname || "").trim().toLowerCase();
  const emailLower = String(log.email || "").trim().toLowerCase();

  // "1 วัน บันทึก 1 ครั้ง ต่อ 1 บัญชี" integration:
  // Locate if there's any existing log matching same day, same nickname, same PIN (email/code) and overwrite/merge values
  const existingIndex = mentalHealthLogs.findIndex(item => {
    const itemKey = getLogYMDKey(item);
    const itemNicknameLower = String(item.nickname || "").trim().toLowerCase();
    const itemEmailLower = String(item.email || "").trim().toLowerCase();
    return itemKey === logKey && itemNicknameLower === nicknameLower && itemEmailLower === emailLower;
  });

  if (existingIndex !== -1) {
    const existing = mentalHealthLogs[existingIndex];
    const merged = {
      ...existing,
      ...log,
      journal: (log.journal && log.journal !== "-") ? log.journal : (existing.journal || "-"),
      mood: log.mood || existing.mood,
      assessmentResult: log.assessmentResult || existing.assessmentResult,
      problemTreeCategory: log.problemTreeCategory !== "-" ? log.problemTreeCategory : (existing.problemTreeCategory || "-"),
      problemTreeProblem: log.problemTreeProblem !== "-" ? log.problemTreeProblem : (existing.problemTreeProblem || "-"),
      problemTreeReason: log.problemTreeReason !== "-" ? log.problemTreeReason : (existing.problemTreeReason || "-"),
      problemTreeHelpingFactors: (log.problemTreeHelpingFactors && log.problemTreeHelpingFactors.length > 0) ? log.problemTreeHelpingFactors : (existing.problemTreeHelpingFactors || []),
    };
    mentalHealthLogs[existingIndex] = merged;
  } else {
    mentalHealthLogs.unshift(log);
  }

  saveDatabase();

  // Synchronously stream additional write to Google Sheets if target setup URL was supplied
  if (googleSheetUrl) {
    publishMentalLogToSheets(log).catch(err => {
      console.error("[Healjai backend] Background publish through helper failed:", err);
    });
  }

  res.json({ success: true, log });
});

// 3. GET /api/sheets-config -> Returns sheet web connection URL parameter
app.get("/api/sheets-config", (req: Request, res: Response) => {
  res.json({ url: googleSheetUrl });
});

// 4. POST /api/sheets-config -> Saves sheet web connection URL to server memory
app.post("/api/sheets-config", (req: Request, res: Response) => {
  const { url } = req.body;
  googleSheetUrl = url || "";
  res.json({ success: true, url: googleSheetUrl });
});

// 5. POST /api/users/register -> Register user securely
app.post("/api/users/register", (req: Request, res: Response) => {
  const { nickname, pin, targetGroup, gender, ageRange } = req.body;
  if (!nickname || !pin) {
    res.status(400).json({ error: "กรุณากรอกชื่อเล่นและรหัสผ่าน PIN ด้วยค่ะ" });
    return;
  }

  const normalized = nickname.trim().toLowerCase();
  if (userAccountsStore[normalized]) {
    res.status(400).json({ error: "ชื่อเล่นนี้มีในระบบแล้วค่ะ ลองเข้าสู่ระบบดูนะคะ" });
    return;
  }

  userAccountsStore[normalized] = {
    nickname: nickname.trim(),
    pin: pin.trim(),
    targetGroup: targetGroup || "",
    gender: gender || "",
    ageRange: ageRange || "",
    selectedProblems: []
  };

  saveDatabase();

  res.json({
    success: true,
    profile: {
      nickname: nickname.trim(),
      email: pin.trim(),
      targetGroup: targetGroup || "",
      gender: gender || "",
      ageRange: ageRange || ""
    }
  });
});

// 6. POST /api/users/login -> Authenticate user and fetch their context safely
app.post("/api/users/login", (req: Request, res: Response) => {
  const { nickname, pin } = req.body;
  if (!nickname || !pin) {
    res.status(400).json({ error: "กรุณากรอกชื่อเล่นและรหัสผ่าน PIN 4 หลักด้วยนะคะ" });
    return;
  }

  const normalized = nickname.trim().toLowerCase();
  const account = userAccountsStore[normalized];

  if (!account) {
    res.status(404).json({ error: "ไม่พบชื่อเล่นบัญชีนี้ในระบบค่ะ" });
    return;
  }

  if (account.pin !== pin.trim()) {
    res.status(401).json({ error: "รหัสผ่าน PIN 4 หลักไม่ถูกต้องสำหรับชื่อเล่นนี้ค่ะ" });
    return;
  }

  res.json({
    success: true,
    profile: {
      nickname: account.nickname,
      email: account.pin,
      targetGroup: account.targetGroup,
      gender: account.gender,
      ageRange: account.ageRange,
      selectedProblems: account.selectedProblems || []
    }
  });
});

// 7. POST /api/users/update-problems -> Permanently sync decision tree selections under that account
app.post("/api/users/update-problems", (req: Request, res: Response) => {
  const { nickname, selectedProblems } = req.body;
  if (!nickname) {
    res.status(400).json({ error: "Nickname is required" });
    return;
  }

  const normalized = nickname.trim().toLowerCase();
  if (!userAccountsStore[normalized]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const oldProblems = userAccountsStore[normalized].selectedProblems || [];
  const newProblems = selectedProblems || [];

  // Find newly added problem(s)
  const addedProblems = newProblems.filter((np: any) => !oldProblems.some((op: any) => op.id === np.id));

  // Find updated problems (where growthRating or updates array size changed)
  const updatedProblems = newProblems.filter((np: any) => {
    const matchedOld = oldProblems.find((op: any) => op.id === np.id);
    if (!matchedOld) return false;
    const ratingChanged = np.growthRating !== matchedOld.growthRating;
    const updatesLengthChanged = (np.updates?.length || 0) !== (matchedOld.updates?.length || 0);
    return ratingChanged || updatesLengthChanged;
  });

  userAccountsStore[normalized].selectedProblems = selectedProblems || [];
  saveDatabase();

  // Background publish new/updated problems to sheets if URL exists
  if (googleSheetUrl && (addedProblems.length > 0 || updatedProblems.length > 0)) {
    // added problems
    for (const prob of addedProblems) {
      publishMentalLogToSheets({
        email: userAccountsStore[normalized].pin || "anonymous",
        nickname: userAccountsStore[normalized].nickname,
        targetGroup: userAccountsStore[normalized].targetGroup,
        timestamp: prob.timestamp || new Date().toISOString(),
        problem: `${prob.category || ""} -> ${prob.problem || ""}`,
        advice: prob.advice || "",
        comment: prob.reason || "",
        growthRating: prob.growthRating,
        mood: "neutral"
      }).catch(err => console.error("[Sheets Sync] Error saving added problem:", err));
    }

    // updated problems
    for (const prob of updatedProblems) {
      const lastUpdate = prob.updates && prob.updates.length > 0 ? prob.updates[prob.updates.length - 1] : null;
      publishMentalLogToSheets({
        email: userAccountsStore[normalized].pin || "anonymous",
        nickname: userAccountsStore[normalized].nickname,
        targetGroup: userAccountsStore[normalized].targetGroup,
        timestamp: lastUpdate?.timestamp || prob.timestamp || new Date().toISOString(),
        problem: `${prob.category || ""} -> ${prob.problem || ""}`,
        advice: prob.advice || "",
        comment: lastUpdate?.comment || prob.reason || "",
        growthRating: prob.growthRating,
        mood: "neutral"
      }).catch(err => console.error("[Sheets Sync] Error saving updated problem:", err));
    }
  }

  res.json({ success: true, selectedProblems: userAccountsStore[normalized].selectedProblems });
});

// Helper to send chat logs to Google Sheets
function sendChatToSheets(message: string, reply: string, userContext: any) {
  const targetUrl = googleSheetUrl || "https://script.google.com/macros/s/AKfycbxFHVUKYMCjvTyHbz50_WeB1GFsZeEBBYYdmaTgLZG0ugAf-e3q06q_kIBg0i02KLto/exec";
  const now = new Date();
  
  // Format Thai datetime e.g. "25/05/2026, 17:04:34"
  const localDateTime = now.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  
  const payload = {
    id: "chat-" + Math.random().toString(36).substr(2, 9),
    timestamp: now.toISOString(),
    dateTime: localDateTime,
    "วันเวลา": localDateTime,
    userMessage: message,
    "คำถามผู้ใช้": message,
    botResponse: reply,
    "คำตอบบอท": reply,
    nickname: userContext?.nickname || "Anonymous",
    email: userContext?.email || "anonymous@anonymous.com",
    targetGroup: userContext?.targetGroup || "General",
    assessmentResult: userContext?.assessmentResult || "ยังไม่มีข้อมูลประเมิน",
    journal: userContext?.journal || "ยังไม่มีข้อความบันทึก",
    problemTreePath: userContext?.problemTreePath || "ยังไม่มีเส้นทางต้นไม้ปัญหา"
  };

  fetch(targetUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).then(async (r) => {
    console.log("[Healjai server] Chat logged to Google Sheets Apps Script. Status:", r.status);
  }).catch(err => {
    console.error("[Healjai server] Background publish of chat to Google Sheets Apps Script failed:", err);
  });
}

// 5. POST /api/chat -> Generates counselor support response
app.post("/api/chat", async (req: Request, res: Response) => {
  const { message, history, userContext } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  let reply = "";

  try {
    if (isGeminiApiGloballyDenied) {
      reply = generateLocalCounselingResponse(message, userContext);
    } else {
      const ai = getGeminiAI();
      if (!ai) {
        reply = generateLocalCounselingResponse(message, userContext);
      } else {
        // System Instruction: Cozy counselor companion guides custom Islamic or general Southern Thailand cultural context
        const systemInstruction = 
          "คุณคือ 'พี่ฮีลใจ' (Healjai Companion) ผู้ให้คำปรึกษาและเพื่อนคุยที่อบอุ่น ปลอดภัย ไม่ตัดสิน และคุยได้อย่างธรรมชาติมากๆ เหมือนมนุษย์ที่เป็นหูรับฟังที่ดีที่สุด\n\n" +
          "นี่คือกรอบบทบาทและหน้าที่สำคัญของคุณเพื่อประคองใจผู้ใช้:\n" +
          "- รับฟังอย่างอ่อนโยน: ใช้สไตล์ภาษามนุษย์ อบอุ่น ปลอดภัย ไม่เป็นทางการเกินไป เลี่ยงถ้อยคำและรูปแบบสำเร็จรูปที่ดูเหมือนรายงานระบบ ใช้อิโมจิเล็กน้อย เช่น 🤍, 🌿 เสมอ ค่อยๆ ให้กำลังใจ\n" +
          "- ตอบด้วยความเข้าใจทางอารมณ์: สะท้อนอารมณ์จริงแท้ที่คู่สนทนาระบายมา เช่น รู้สึกว่าเหนื่อยล้า, สับสน, เหงาดิ่ง หรือเครียดสะสม\n" +
          "- ถามคำถามเพิ่มด้วยความเข้าอกเข้าใจ: อย่าเพิ่งรีบรวบสรุปตัดบทแนะแนวทางทันควัน แต่ชวนเขาเล่าส่วนที่กดดันให้เขาได้ระบายเปลี่ยวอารมณ์ในบรรยากาศที่มีคนเข้าใจจริงๆ\n" +
          "- แนะนำข้อปฏิบัติก้าวสั้นๆ เฉพาะเรื่อง (บำบัดอารมณ์): หากเขาเผชิญเรื่องการสอบ, หมดไฟทำงาน, วางตัวผิดศีล หรือทะเลาะกับครอบครัว แนะนำวิธีดูแลตนเองแบบค่อยเป็นค่อยไป (จำกัดขอบเขตงาน, นอนกุมใจฟื้นพละ, นั่งลูบนิ้วประคองลม)\n" +
          "- ห้ามตอบมั่ว, ห้ามเจตนาวินิจฉัยโรคจิตเวชใดๆ เด็ดขาด (เช่น ห้ามฟันธงว่าเขาเป็นซึมเศร้าเด็ดขาด), ไม่สั่งสอนและห้ามตัดสินพฤติกรรมอารมณ์เขา\n\n" +
          "แนวทางการคุยจำแนกตามความดิ่งและสัญญาณเสี่ยง:\n" +
          "1. หากระบบตรวจพบข้อความเสี่ยงสูง (Crisis Mode) ที่แฝงนัยถึงความรู้สึกอยากทำร้ายตัวเอง, ไม่อยากอยู่แล้ว, หรือเหี่ยวเฉาคิดสั้น (เช่น 'อยากหายไป', 'ไม่อยากอยู่แล้ว', 'ทำร้ายตัวเอง', 'ไม่มีเหตุผลที่จะอยู่ต่อ', 'อยากตาย', 'คิดสั้น'):\n" +
          "   - คุณต้องเข้าสู่ CRISIS MODE ทันที\n" +
          "   - ตอบถ้อยความวิจักษ์ประคองจิตใจอย่างสั้น กระชับ อ่อนน้อม ปลอดภัยที่สุด\n" +
          "   - ชี้นำช่องทางด่วนให้สติด้วยความรัก ท่องแท้ให้รีบพูดคุยกับสายด่วนสุขภาพจิต 1323 (โทรฟรีตลอด 24 ชั่วโมง) หรือสมาคมสะมาริตันส์ (02-111-3066) หรือติดต่อบุคคลอันดับต้นๆ ที่เขาไว้วางใจได้มากที่สุดในชีวิต\n" +
          "   - โน้มตัวแสดงว่าเป็นห่วงมากและห้ามปล่อยบทสนทนาให้เงียบหายเด็ดขาด!\n\n" +
          "2. หากไม่เข้าใจข้อความ, พิมพ์มาเพียงทักทายสั้นๆ, หรือคุณไม่แน่ใจว่าจะตอบอะไรเด็ดขาดเพื่อไม่ให้มีคำตอบขัดข้องผิดพลาดเชิงเทคนิค:\n" +
          "   - ให้ตอบในเชิงสไตล์ประคองรับฟังเชิงรุกแสนห่วงใยทันที เช่น 'เราอยู่ตรงนี้นะ เราเข้าใจคุณน่ะ เรารับฟังคุณเสมอ มีปัญหาไม่สบายใจอะไรอยากเล่าต่อให้พี่ฮีลใจฟังอีกไหมนะคะ 🤍🌿' ห้ามประดิษฐ์คำว่าระบบมีปัญหาขัดข้อง หรือแจ้งไม่เข้าใจเรื่องเทคนิคอันขาด!\n\n" +
          "สไตล์การเจรจาบำรุงวิสัยทัศน์:\n" +
          "- สรรพนามแทนตัวคุณคือ 'พี่ฮีลใจ' และทักทายคู่สนทนาด้วยวาจาน่ารักออดอ้อนผ่อนล้า เช่น 'คุณคนดี', 'เธอคนเก่ง' หรือชื่อเล่น 'คุณ ${userContext?.nickname || 'คนเก่ง'}'\n" +
          "- ใช้หางเสียงประคองรักใคร่ เช่น 'นะคะ' 'ค่ะ' 'น้าา' เสมอ หลีกเลี่ยงคำแข็งทื่อจนเหมือระบบสั่งการ";

        let dynamicInstruction = systemInstruction;
        if (userContext) {
          const targetGroupTh = 
            userContext.targetGroup === 'student' ? 'อาชีพ: กำลังศึกษา / วัยศึกษาเล่าเรียน' :
            userContext.targetGroup === 'general_labor' ? 'อาชีพ: รับจ้างทั่วไป / ผู้ฟันฝ่ารายวัน' :
            userContext.targetGroup === 'unemployed' ? 'อาชีพ: ว่างงาน / ผู้พักใจเสาะหาก้าวใหม่' :
            userContext.targetGroup === 'merchant' ? 'อาชีพ: ค้าขาย / ผู้พาณิชย์สร้างโอกาส' :
            userContext.targetGroup === 'civil_servant' ? 'อาชีพ: ข้าราชการ / ผู้รับใช้ความมั่นคงส่วนกลาง' :
            userContext.targetGroup === 'worker' ? 'อาชีพ: วัยทำงาน / ผู้เผชิญความล้า' :
            userContext.targetGroup === 'teenager' ? 'ช่วงวัย: วัยรุ่น / ผู้ผ่านความสับสนเรียนรู้' : 'ทั่วไป';
          
          dynamicInstruction += `\n\n[ข้อมูลจริงและประวัติความเครียดอัปเดตล่าสุดทางใจของคุณคนดี]:\n` +
            `- ชื่อเรียก: คุณ ${userContext.nickname}\n` +
            `- ช่วงกลุ่มวัยบีบคั้นหลัก: ${targetGroupTh}\n` +
            `- บันทึกสปีชีส์อารมณ์และผลลัพธ์คะแนนจิตเวชล่าสุดของเขาห้วงนี้:\n${userContext.recentLogsSummary || "ไม่มีประวัติก่อนหน้า"}\n\n` +
            `**ข้อกำหนดการบำบัดรักษาพริ้วจิตเพิ่มเติม**:\n` +
            `1. นำข้อมูลบันทึกความเครียดและผลสุขภาพล่าสุดเหล่านี้ไปสะท้อนประคองน้ำใจด้วยความลื่นไหลสูงมาก ประหนึ่งคนเฝ้ามองห่วงใยเขาจริงโดยไม่ยัดเยียด\n` +
            `2. ชวนทำการฝึกกู้หายใจผ่อนป่วนจิตเทคนิค 4-7-8 หรือวิสัชนาชวนบ่มพลังใจ และปกป้องขอบเขตจิตใจก้าวเล็กๆ คืนสิทธิ์การนอนหลับชาร์จไฟที่ดีตามสมควร\n` +
            `3. ปลอบให้เขามั่นใจอย่างเป็นกันเองสูงสุดว่าพื้นที่นี่พร้อมกางแขนซับใจเฉื่อยของเขาเสมอนะคะ`;
        }

        // Format chat history to comply with `@google/genai` sdk standard
        const contents: any[] = [];
        if (history && history.length > 0) {
          history.forEach((h: any) => {
            contents.push({
              role: h.role === "user" ? "user" : "model",
              parts: [{ text: h.text }]
            });
          });
        }
        contents.push({
          role: "user",
          parts: [{ text: message }]
        });

        let response;
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: contents,
            config: {
              systemInstruction: dynamicInstruction
            }
          });
          reply = response ? (response.text || "") : "";
          if (!reply) {
            reply = generateLocalCounselingResponse(message, userContext);
          }
        } catch (innerError: any) {
          const errStr = JSON.stringify(innerError) || String(innerError || "");
          if (errStr.includes("403") || errStr.includes("PERMISSION_DENIED") || errStr.includes("denied access")) {
            isGeminiApiGloballyDenied = true;
            reply = generateLocalCounselingResponse(message, userContext);
          } else {
            // Second attempt fallback with gemini-3.5-flash
            try {
              response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: contents,
                config: {
                  systemInstruction: dynamicInstruction
                }
              });
              reply = response ? (response.text || generateLocalCounselingResponse(message, userContext)) : generateLocalCounselingResponse(message, userContext);
            } catch (fallbackError: any) {
              const fallBackStr = JSON.stringify(fallbackError) || String(fallbackError || "");
              if (fallBackStr.includes("403") || fallBackStr.includes("PERMISSION_DENIED") || fallBackStr.includes("denied access")) {
                isGeminiApiGloballyDenied = true;
              }
              reply = generateLocalCounselingResponse(message, userContext);
            }
          }
        }
      }
    }
  } catch (error: any) {
    const errStr = JSON.stringify(error) || String(error || "");
    if (errStr.includes("403") || errStr.includes("PERMISSION_DENIED") || errStr.includes("denied access")) {
      isGeminiApiGloballyDenied = true;
    }
    reply = generateLocalCounselingResponse(message, userContext);
  }

  // Trigger Google Sheet logging backgrounds
  if (reply) {
    sendChatToSheets(message, reply, userContext);
  }

  res.json({ reply });
});

// Vite middleware setup or production static server
async function startServer() {
  // Load local JSON-database entries on server boot on Node container filesystem
  loadDatabase();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Healjai server] Cozy server booted on port ${PORT}`);
  });
}

startServer();
