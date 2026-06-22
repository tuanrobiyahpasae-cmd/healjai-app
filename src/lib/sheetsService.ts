import { MentalHealthLog } from '../types';

// Create a brand new Google Spreadsheet using the Sheets API
export async function createSpreadsheet(accessToken: string, title = "Healjai ฮีลใจ - บันทึกสุขภาพจิต"): Promise<{ id: string; url: string }> {
  try {
    const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: title
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Sheet API creation failed: ${errText}`);
    }

    const data = await res.json();
    return {
      id: data.spreadsheetId,
      url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`
    };
  } catch (err: any) {
    console.error('Error creating spreadsheet:', err);
    throw err;
  }
}

// Helper to parse "Day/Month/Year" (Buddhist or Christian) or "YYYY-MM-DD" reliably
function extractDMY(dateOrString: any): { d: number, m: number, y: number } | null {
  if (!dateOrString) return null;
  const s = String(dateOrString).trim();

  // Try parsing as DD/MM/YYYY or DD/MM/BE (Christian or Buddhist Era)
  // Match patterns like "17/6/2569", "17-6-2569", "17.6.2569", "17/06/2569", with optional time
  const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    let d = parseInt(dmyMatch[1], 10);
    let m = parseInt(dmyMatch[2], 10);
    let y = parseInt(dmyMatch[3], 10);
    if (y > 2400) {
      y -= 543;
    }
    if (!isNaN(d) && !isNaN(m) && !isNaN(y) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { d, m, y };
    }
  }

  // Try parsing as YYYY-MM-DD (standard ISO date or similar)
  const ymdMatch = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    let y = parseInt(ymdMatch[1], 10);
    let m = parseInt(ymdMatch[2], 10);
    let d = parseInt(ymdMatch[3], 10);
    if (y > 2400) {
      y -= 543;
    }
    if (!isNaN(d) && !isNaN(m) && !isNaN(y) && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return { d, m, y };
    }
  }

  // Standard JSON ISO strings or native JS format fallback
  try {
    const parsedDate = new Date(s);
    if (!isNaN(parsedDate.getTime())) {
      let d = parsedDate.getDate();
      let m = parsedDate.getMonth() + 1;
      let y = parsedDate.getFullYear();
      if (y > 2400) {
        y -= 543;
      }
      return { d, m, y };
    }
  } catch (e) {
    // Ignore
  }

  // Last-resort fallback splitting
  const pieces = s.split(' ')[0].split(/[\/\-\.]/);
  if (pieces.length >= 3) {
    let d = 0, m = 0, y = 0;
    if (pieces[0].length === 4) {
      y = parseInt(pieces[0], 10);
      m = parseInt(pieces[1], 10);
      d = parseInt(pieces[2], 10);
    } else {
      d = parseInt(pieces[0], 10);
      m = parseInt(pieces[1], 10);
      y = parseInt(pieces[2], 10);
    }
    if (y > 2400) {
      y -= 543;
    }
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return { d, m, y };
    }
  }

  return null;
}

// Helper to convert log to row format columns
function mapLogToRow(log: MentalHealthLog): any[] {
  const rawDate = log.timestamp ? new Date(log.timestamp) : new Date();
  // Format to Bangkok localized datetime e.g. "17/6/2569 14:48"
  const localDateTime = rawDate.toLocaleString("th-TH", { 
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(/\,/, '');

  const moodMap: Record<string, string> = {
    great: "ยอดเยี่ยม 😊",
    neutral: "ปกติ/เฉยๆ 😐",
    sad: "เศร้า/ล้า 😢",
    stressed: "เครียด/กังวล 😰"
  };
  const moodThai = moodMap[log.mood] || log.mood || "-";

  // Format demographics
  const genderLabel = log.gender === 'male' ? 'ชาย 👨‍♂️' : log.gender === 'female' ? 'หญิง 👩‍🏼' : 'ไม่ระบุ 👤';
  const ageLabel = log.ageRange 
    ? (log.ageRange === '35+' ? '35 ปีขึ้นไป' : `${log.ageRange} ปี`) 
    : 'ไม่ระบุ';
  
  const groupLabel = 
    log.targetGroup === 'student' ? 'กำลังศึกษา 🎓' : 
    log.targetGroup === 'general_labor' ? 'รับจ้างทั่วไป 🔨' : 
    log.targetGroup === 'unemployed' ? 'ว่างงาน 🌾' : 
    log.targetGroup === 'merchant' ? 'ค้าขาย 🛍️' : 
    log.targetGroup === 'civil_servant' ? 'ข้าราชการ 👔' : 
    log.targetGroup === 'worker' ? 'ทำงานทั่วไป 💼' : 
    log.targetGroup === 'teenager' ? 'วัยรุ่น 🌱' : 'ทั่วไป';

  const problemCategory = log.problemTreeCategory || "-";
  const problemDetail = log.problemTreeProblem || "-";
  const problemReason = log.problemTreeReason || "-";

  let helpingFactorsText = "-";
  if (log.problemTreeHelpingFactors && log.problemTreeHelpingFactors.length > 0) {
    helpingFactorsText = log.problemTreeHelpingFactors.join(", ");
  } else if ((log as any).helpingFactors && Array.isArray((log as any).helpingFactors)) {
    helpingFactorsText = (log as any).helpingFactors.join(", ");
  }

  const ventText = log.journal && log.journal !== "-" ? log.journal : "";

  let stressScoreText = "-";
  let interpretationText = "-";

  if (log.assessmentResult) {
    const ar = log.assessmentResult;
    stressScoreText = `${ar.screening || 'ประเมินใจ'}: ${ar.score !== undefined ? ar.score : '-'} คะแนน`;
    interpretationText = ar.status || "-";
  }

  const userCode = log.email || "-";

  return [
    localDateTime,
    log.nickname || "ไม่มีชื่อเล่น",
    genderLabel,
    ageLabel,
    groupLabel,
    problemCategory,
    problemDetail,
    problemReason,
    helpingFactorsText,
    moodThai,
    ventText,
    stressScoreText,
    interpretationText,
    userCode
  ];
}

// Generate the specific background color format block for the stress score interpretation
function getInterpretationFormatRequest(sheetId: number, physicalRow: number, val: string) {
  let r = 1.0;
  let g = 1.0;
  let b = 1.0;
  let hasFormat = false;

  if (val.includes("ปกติ") || val.includes("ไม่มี") || val.includes("ผ่านคัดกรอง")) {
    // Soft Light Green
    r = 0.85; g = 0.95; b = 0.85;
    hasFormat = true;
  } else if (val.includes("รุนแรง") || val.includes("อันตราย") || val.includes("สูง") || val.includes("ทำร้ายตัวเอง")) {
    // Soft Light Red
    r = 0.98; g = 0.83; b = 0.83;
    hasFormat = true;
  } else if (val.includes("เสี่ยง") || val.includes("ปานกลาง") || val.includes("น้อย") || val.includes("เฝ้าระวัง")) {
    // Soft Light Yellow
    r = 1.0; g = 0.93; b = 0.78;
    hasFormat = true;
  }

  if (hasFormat) {
    return {
      repeatCell: {
        range: {
          sheetId: sheetId,
          startRowIndex: physicalRow,
          endRowIndex: physicalRow + 1,
          startColumnIndex: 12, // Column M
          endColumnIndex: 13
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: r, green: g, blue: b }
          }
        },
        fields: "userEnteredFormat.backgroundColor"
      }
    };
  }
  return null;
}

// Helper to convert date to Ms timestamp reliably
function parseTimeToMs(dateTimeStr: any): number {
  if (!dateTimeStr) return 0;
  try {
    const s = String(dateTimeStr).trim();
    if (s.includes('T') || s.includes('Z')) {
      return new Date(s).getTime();
    }
    const dmy = extractDMY(s);
    if (!dmy) return 0;
    
    let hours = 12;
    let minutes = 0;
    let seconds = 0;
    const timePart = s.split(' ')[1];
    if (timePart) {
      const parts = timePart.split(':');
      hours = parseInt(parts[0], 10) || 12;
      minutes = parseInt(parts[1], 10) || 0;
      seconds = parseInt(parts[2], 10) || 0;
    }
    return new Date(dmy.y, dmy.m - 1, dmy.d, hours, minutes, seconds).getTime();
  } catch (e) {
    return 0;
  }
}

// Helper to extract clean date string "YYYY-MM-DD"
function getRowYMDKey(dateTimeStr: any): string {
  const dmy = extractDMY(dateTimeStr);
  if (!dmy) return "unknown-date";
  return `${dmy.y}-${dmy.m}-${dmy.d}`;
}

// Helper to merge two rows for the same day + user account, taking the most complete details
function mergeRows(r1: any[], r2: any[]): any[] {
  const len = 14;
  const out = new Array(len).fill("-");
  
  const t1 = parseTimeToMs(r1[0]);
  const t2 = parseTimeToMs(r2[0]);
  const latestRow = t1 >= t2 ? r1 : r2;
  const oldestRow = t1 >= t2 ? r2 : r1;

  for (let i = 0; i < len; i++) {
    const val1 = r1[i] !== undefined ? String(r1[i]).trim() : "-";
    const val2 = r2[i] !== undefined ? String(r2[i]).trim() : "-";
    
    out[i] = latestRow[i] !== undefined ? String(latestRow[i]).trim() : "-";
    if (out[i] === "" || out[i] === "undefined") out[i] = "-";

    const v1Clean = val1 === "undefined" ? "" : val1;
    const v2Clean = val2 === "undefined" ? "" : val2;

    if ((out[i] === "-" || out[i] === "") && v1Clean !== "-" && v1Clean !== "") {
      out[i] = v1Clean;
    }
    if ((out[i] === "-" || out[i] === "") && v2Clean !== "-" && v2Clean !== "") {
      out[i] = v2Clean;
    }

    if (i === 0) {
      out[i] = latestRow[0] || oldestRow[0] || "-";
    }
  }
  return out;
}

// Check spreadsheet, unique-ify logs, merge/overwrite if log on the same day for same account exists (1 วัน บันทึก 1 ครั้ง ต่อ 1 บัญชี)
export async function appendLogsToSheet(
  accessToken: string,
  spreadsheetId: string,
  logs: MentalHealthLog[]
): Promise<boolean> {
  if (logs.length === 0) return true;

  try {
    // 1. Fetch existing spreadsheet values to check contents and find records to replace
    let values: any[][] = [];
    let sheetIsEmpty = true;

    try {
      const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:N`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (checkRes.status === 401) {
        throw new Error("เซสชัน Google ของคุณหมดอายุแล้ว กรุณาเชื่อมต่อบัญชี Google ใหม่อีกครั้งเพื่ออัปเดตข้อมูลชีตนะคะ (Unauthenticated)");
      }
      if (checkRes.status === 403) {
        throw new Error("ไม่มีสิทธิ์เข้าถึงหรือแก้ไขไฟล์นี้ กรุณาเปิดสิทธิ์ชีตหลักเป็นทุกคนสามารถแก้ไขได้ หรือเชื่อมต่อบัญชีใหม่ค่ะ (Forbidden)");
      }
      if (checkRes.ok) {
        const data = await checkRes.json();
        values = data.values || [];
        if (values.length > 0) {
          sheetIsEmpty = false;
        }
      } else {
        const errText = await checkRes.text();
        console.warn('[Sheets API Sync] Failed to read sheets values:', errText);
      }
    } catch (readErr: any) {
      if (readErr.message && (readErr.message.includes("เซสชัน") || readErr.message.includes("สิทธิ์"))) {
        throw readErr;
      }
      console.warn('[Sheets API Sync] Warning: failed to read sheets values (treating as empty or uninitialized):', readErr);
    }

    // 2. We use a Map to group and merge ALL duplicate rows (existing on sheet + incoming logs) by user + day key
    const groupedRowsMap = new Map<string, any[]>();

    // Process existing sheet rows (skipping index 0 which is headers)
    if (values.length > 1) {
      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        const dateVal = row[0];
        const nickname = String(row[1] || "").trim();
        if (!dateVal || !nickname) continue; // Skip corrupted rows

        const ymdKey = getRowYMDKey(dateVal);
        const groupKey = `${nickname.toLowerCase()}_${ymdKey}`;

        const normRow = [...row];
        while (normRow.length < 14) {
          normRow.push("-");
        }

        if (groupedRowsMap.has(groupKey)) {
          const merged = mergeRows(groupedRowsMap.get(groupKey)!, normRow);
          groupedRowsMap.set(groupKey, merged);
        } else {
          groupedRowsMap.set(groupKey, normRow);
        }
      }
    }

    // Process incoming high priority logs
    logs.forEach(log => {
      const nickname = String(log.nickname || "anonymous").trim();
      const logDate = log.date || (log.timestamp ? log.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]);
      const ymdKey = getRowYMDKey(logDate);
      const groupKey = `${nickname.toLowerCase()}_${ymdKey}`;

      const newRow = mapLogToRow(log);

      if (groupedRowsMap.has(groupKey)) {
        const merged = mergeRows(groupedRowsMap.get(groupKey)!, newRow);
        groupedRowsMap.set(groupKey, merged);
      } else {
        groupedRowsMap.set(groupKey, newRow);
      }
    });

    // 3. Convert grouped Map values back to sorted array (Chronological order)
    const sortedMergedRows = Array.from(groupedRowsMap.values()).sort((a, b) => {
      return parseTimeToMs(a[0]) - parseTimeToMs(b[0]);
    });

    // 4. Overwrite Sheet with correct updated entries
    if (sheetIsEmpty) {
      const initialPayload = [
        [
          "วันที่/เดือน/ปี/เวลา",
          "ชื่อเล่น",
          "เพศ",
          "อายุ",
          "อาชีพ",
          "ปัญหาหลัก",
          "สาเหตุของปัญหา",
          "เพราะอะไร",
          "สิ่งที่ช่วยให้ดีขึ้น",
          "อารมณ์วันนี้",
          "ข้อความระบายความรู้สึก",
          "คะแนนระดับความเครียด",
          "การแปลผลความรู้สึก",
          "รหัสพินส่วนบุคคล (PIN)"
        ],
        ...sortedMergedRows
      ];

      const writeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values: initialPayload
          })
        }
      );
      if (!writeRes.ok) {
        const errText = await writeRes.text();
        throw new Error(`Failed to write headers and rows: ${errText}`);
      }
    } else {
      // Clear old rows first (starting from A2) to prevent leftover ghost values if count decreased
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:N9999:clear`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Write merged rows back from A2 downwards
      if (sortedMergedRows.length > 0) {
        const writeRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              values: sortedMergedRows
            })
          }
        );
        if (!writeRes.ok) {
          const errText = await writeRes.text();
          throw new Error(`Failed to write rows: ${errText}`);
        }
      }
    }

    // 5. Format and style changed rows dynamically with beautiful background shades
    let sheetId = 0;
    try {
      const spreadRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      if (spreadRes.ok) {
        const metadata = await spreadRes.json();
        if (metadata.sheets && metadata.sheets.length > 0) {
          sheetId = metadata.sheets[0].properties.sheetId || 0;
        }
      }
    } catch (metaErr) {
      console.warn("[Sheets API Sync] Failed to retrieve dynamic sheetId:", metaErr);
    }

    const styleRequests: any[] = [];
    sortedMergedRows.forEach((row, i) => {
      const physicalRow = 1 + i; // row index 1 is A2
      const val = String(row[12] || ""); // interpretation is at index 12 (Column M)
      const req = getInterpretationFormatRequest(sheetId, physicalRow, val);
      if (req) {
        styleRequests.push(req);
      }
    });

    if (styleRequests.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: styleRequests
        })
      });
    }

    return true;
  } catch (error: any) {
    const errStr = String(error.message || error);
    if (errStr.includes('Unauthenticated') || errStr.includes('401') || errStr.includes('credential') || errStr.includes('เซสชัน') || errStr.includes('Forbidden') || errStr.includes('403')) {
      console.warn('[Sheets API Sync] Google session has expired or permissions are missing:', error.message || error);
    } else {
      console.error('Error in appendLogsToSheet:', error);
    }
    throw error;
  }
}
