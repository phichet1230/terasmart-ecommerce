// utils/sms.js
const hasTwilioConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER;

/**
 * จัดส่งข้อความ SMS จริงผ่าน Twilio Gateway
 * @param {string} toPhone - เบอร์โทรศัพท์ผู้รับ (เช่น 0820761709)
 * @param {string} body - ข้อความที่จะจัดส่ง
 */
exports.sendSms = async (toPhone, body) => {
  if (!hasTwilioConfig) {
    console.warn('⚠️ Twilio credentials not found in .env. SMS dispatch simulated in server logs.');
    console.log(`💬 [SMS Simulation] to ${toPhone}: ${body}`);
    return;
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  // แปลงเบอร์โทรศัพท์ไทยเป็นฟอร์แมตสากล (เช่น 0820761709 -> +66820761709)
  let formattedTo = toPhone.trim();
  if (formattedTo.startsWith('0')) {
    formattedTo = '+66' + formattedTo.slice(1);
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');

  const params = new URLSearchParams();
  params.append('To', formattedTo);
  params.append('From', fromPhone);
  params.append('Body', body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.message || 'Failed to dispatch SMS via Twilio');
    }
    console.log(`✉️ Real SMS sent successfully to ${toPhone} via Twilio! Message SID: ${resData.sid}`);
  } catch (err) {
    console.error('❌ Twilio SMS dispatch failed:', err.message);
    throw err;
  }
};
