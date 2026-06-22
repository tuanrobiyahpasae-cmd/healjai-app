import { MentalHealthLog } from '../types';

export interface GoogleContact {
  id: string;
  name: string;
  phone: string;
}

export interface GoogleDriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
}

// 1. Save data to Google Drive as a JSON file
export async function backupToGoogleDrive(
  accessToken: string,
  nickname: string,
  logs: MentalHealthLog[]
): Promise<{ success: boolean; fileId?: string }> {
  try {
    const filename = `healjai_backup_${nickname}.json`;
    const metadata = {
      name: filename,
      mimeType: 'application/json',
      description: 'Healjai ฮีลใจ - บันทึกประวัติและผลประเมินสุขภาพจิตเพื่อการดูแลตนเองอย่างเป็นส่วนตัว'
    };
    
    const backupContent = {
      logs: logs,
      nickname: nickname,
      timestamp: new Date().toISOString(),
      app: 'Healjai ฮีลใจ Core v1.0'
    };

    const boundary = 'healjai_multipart_boundary';
    const multipartBody = 
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${JSON.stringify(backupContent)}\r\n` +
      `--${boundary}--`;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartBody
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Drive backup upload failed: ${errText}`);
    }

    const data = await res.json();
    return { success: true, fileId: data.id };
  } catch (err) {
    console.error('Error backing up to Google Drive:', err);
    throw err;
  }
}

// 2. Search and list backups on Google Drive
export async function listBackupsFromGoogleDrive(
  accessToken: string,
  nickname: string
): Promise<GoogleDriveBackupFile[]> {
  try {
    const q = encodeURIComponent(`name contains 'healjai_backup_' and mimeType = 'application/json'`);
    const fields = encodeURIComponent('files(id, name, createdTime)');
    
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=createdTime%20desc`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Drive search failed: ${errText}`);
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      createdTime: f.createdTime
    }));
  } catch (err) {
    console.error('Error listing backups from Google Drive:', err);
    return [];
  }
}

// 3. Download/restore backup content from Google Drive
export async function downloadBackupFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<{ logs: MentalHealthLog[]; nickname: string } | null> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Drive download failed: ${errText}`);
    }

    const data = await res.json();
    if (data && Array.isArray(data.logs)) {
      return {
        logs: data.logs,
        nickname: data.nickname || ''
      };
    }
    return null;
  } catch (err) {
    console.error('Error downloading backup from Google Drive:', err);
    throw err;
  }
}

// 4. Fetch Google Contacts to set up Trusted helper contacts
export async function fetchGoogleContacts(accessToken: string): Promise<GoogleContact[]> {
  try {
    // Call people connection endpoint
    const res = await fetch(
      'https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers&pageSize=50',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`People API fetch failed: ${errText}`);
      return [];
    }

    const data = await res.json();
    const connections = data.connections || [];
    
    const contacts: GoogleContact[] = [];
    connections.forEach((conn: any) => {
      const nameObj = conn.names?.[0];
      const phoneObj = conn.phoneNumbers?.[0];
      
      const displayName = nameObj?.displayName || '';
      const displayPhone = phoneObj?.value || phoneObj?.canonicalForm || '';
      const resourceName = conn.resourceName || Math.random().toString();
      
      if (displayName && displayPhone) {
        contacts.push({
          id: resourceName,
          name: displayName,
          phone: displayPhone
        });
      }
    });

    return contacts;
  } catch (err) {
    console.error('Error fetching Google Contacts:', err);
    return [];
  }
}
