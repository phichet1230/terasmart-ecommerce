const crypto = require('crypto');
const fs = require('fs');

/**
 * 1. PDPA Data Masking Utility (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล)
 * ปกปิดข้อมูลส่วนบุคคลก่อนบันทึกลงฐานข้อมูลหรือส่งตอบกลับ API
 */
const pdpaMask = {
  // ปกปิดชื่อ-นามสกุล เช่น "นาย สมชาย ใจดี" -> "น** สม*** ใ**ดี"
  name: (fullName) => {
    if (!fullName || typeof fullName !== 'string') return 'ไม่ระบุชื่อ';
    const words = fullName.trim().split(/\s+/);
    return words.map(w => {
      if (w.length <= 2) return w[0] + '*';
      return w[0] + '*'.repeat(Math.min(w.length - 2, 4)) + w[w.length - 1];
    }).join(' ');
  },

  // ปกปิดเลขบัญชีธนาคาร เช่น "123-4-56789-0" -> "12x-x-x6789-0"
  accountNo: (accNo) => {
    if (!accNo || typeof accNo !== 'string') return 'xxx-x-xxxx-x';
    const clean = accNo.replace(/[^0-9]/g, '');
    if (clean.length < 8) return 'xxx-xxxx';
    const first2 = clean.slice(0, 2);
    const last4 = clean.slice(-4);
    return `${first2}x-x-x${last4}`;
  },

  // ปกปิดหมายเลข PromptPay เช่น "0812345678" -> "08x-xxx-5678"
  promptPay: (ppId) => {
    if (!ppId || typeof ppId !== 'string') return '08x-xxx-xxxx';
    const clean = ppId.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 2)}x-xxx-${clean.slice(-4)}`;
    }
    if (clean.length === 13) {
      return `${clean.slice(0, 3)}-xxxx-xxxxx-${clean.slice(-2)}`;
    }
    return 'xxx-xxx-xxxx';
  },

  // ปกปิดอีเมล เช่น "john.doe@company.com" -> "j***e@company.com"
  email: (emailStr) => {
    if (!emailStr || !emailStr.includes('@')) return 'u***r@domain.com';
    const [user, domain] = emailStr.split('@');
    if (user.length <= 2) return user[0] + '*@' + domain;
    return `${user[0]}${'*'.repeat(user.length - 2)}${user[user.length - 1]}@${domain}`;
  }
};

/**
 * 2. EMVCo QR Code Standard (Mini QR / 000201 Parser & CRC16 CCITT-FALSE Validator)
 */
function calculateCRC16(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function parseEMVCoQR(qrPayload) {
  if (!qrPayload || typeof qrPayload !== 'string' || !qrPayload.startsWith('000201')) {
    return { isValid: false, reason: 'ไม่ใช่รูปแบบ EMVCo QR Code มาตรฐาน (ต้องขึ้นต้นด้วย 000201)' };
  }

  // 1. ตรวจสอบ CRC16
  const checksumIndex = qrPayload.lastIndexOf('6304');
  let isChecksumValid = false;
  if (checksumIndex !== -1) {
    const dataToVerify = qrPayload.substring(0, checksumIndex + 4);
    const expectedCrc = qrPayload.substring(checksumIndex + 4, checksumIndex + 8).toUpperCase();
    const calculatedCrc = calculateCRC16(dataToVerify);
    isChecksumValid = (expectedCrc === calculatedCrc);
  }

  // 2. สกัดถอดค่า TLV (Tag-Length-Value)
  const tlvData = {};
  let i = 0;
  while (i < qrPayload.length) {
    const tag = qrPayload.substr(i, 2);
    const len = parseInt(qrPayload.substr(i + 2, 2), 10);
    if (isNaN(len) || len <= 0 || i + 4 + len > qrPayload.length) break;
    const value = qrPayload.substr(i + 4, len);
    tlvData[tag] = value;
    i += 4 + len;
  }

  const result = {
    isValid: true,
    isChecksumValid,
    payloadFormat: tlvData['00'] || '01',
    initiationMethod: tlvData['01'] === '12' ? 'Dynamic' : 'Static',
    currencyCode: tlvData['53'] || '764', // 764 = THB
    amount: tlvData['54'] ? parseFloat(tlvData['54']) : null,
    countryCode: tlvData['58'] || 'TH',
    merchantInfo: tlvData['29'] || tlvData['30'] || null,
    additionalData: tlvData['62'] || null
  };

  return result;
}

/**
 * 3. OWASP Security Input Validation (Magic Number Header Check)
 */
function validateUploadedFile(filePath, mimetype) {
  if (!fs.existsSync(filePath)) {
    return { isValid: false, message: 'ไม่พบไฟล์ภาพที่อัปโหลด' };
  }

  const stat = fs.statSync(filePath);
  if (stat.size > 5 * 1024 * 1024) { // Max 5MB
    return { isValid: false, message: 'ขนาดไฟล์ภาพเกินขีดจำกัดสูงสุด (5 MB)' };
  }
  if (stat.size < 512) {
    return { isValid: false, message: 'ขนาดไฟล์ภาพเล็กเกินไปหรือไม่สมบูรณ์' };
  }

  // อ่าน 8 ไบต์แรกเพื่อตรวจสอบ Magic Number (File Signature)
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(8);
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);

  const hexHeader = buffer.toString('hex').toUpperCase();

  // JPEG: FF D8 FF
  // PNG: 89 50 4E 47
  // WEBP: 52 49 46 46 ... 57 41 56 45 (RIFF....WEBP)
  const isJpeg = hexHeader.startsWith('FFD8FF');
  const isPng = hexHeader.startsWith('89504E47');
  const isWebp = hexHeader.startsWith('52494646') && buffer.toString('utf8', 8, 12) === 'WEBP';

  if (!isJpeg && !isPng && !isWebp) {
    return { isValid: false, message: 'ความปลอดภัยระบบ: ไฟล์ที่อัปโหลดไม่ใช่ไฟล์ภาพจริง (ปลอมแปลงนามสกุลไฟล์)' };
  }

  return { isValid: true, format: isJpeg ? 'JPEG' : isPng ? 'PNG' : 'WEBP' };
}

/**
 * 4. ISO 20022 Financial Message Mapper
 * แปลงข้อมูลสลิปโอนเงินให้อยู่ในรูปแบบ ISO 20022 Financial Standard Structure
 */
function buildISO20022Message({ orderId, amount, transRef, sendingBank, senderName, senderAcc, receiverAcc, transDatetime }) {
  return {
    Document: {
      FIToFICstmrCdtTrf: {
        GrpHdr: {
          MsgId: `TERA-ISO20022-${orderId}-${Date.now()}`,
          CreDtTm: new Date().toISOString(),
          NbOfTxs: "1",
          SttlmInf: { SttlmMtd: "CLRG" }
        },
        CdtTrfTxInf: {
          PmtId: { EndToEndId: orderId, TxId: transRef },
          Amt: { InstdAmt: { "@Ccy": "THB", "#text": parseFloat(amount).toFixed(2) } },
          Dbtr: { Nm: pdpaMask.name(senderName) },
          DbtrAcct: { Id: { Othr: { Id: pdpaMask.accountNo(senderAcc) } } },
          DbtrAgt: { FinInstnId: { Othr: { Id: sendingBank || 'UNKNOWN_BANK' } } },
          Cdtr: { Nm: "บจก. เทอรา สมาร์ท อีคอมเมิร์ซ" },
          CdtrAcct: { Id: { Othr: { Id: pdpaMask.promptPay(process.env.PROMPTPAY_ID || '0812345678') } } },
          RmtInf: { Ustrd: `ORDER_ID:${orderId}|TX:${transRef}` }
        }
      }
    }
  };
}

module.exports = {
  pdpaMask,
  parseEMVCoQR,
  calculateCRC16,
  validateUploadedFile,
  buildISO20022Message
};
