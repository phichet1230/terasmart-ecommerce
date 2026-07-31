const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

function buildMultipartBody(boundary, fieldName, filePath, mimeType) {
  const fileName = path.basename(filePath);
  const fileData = fs.readFileSync(filePath);
  
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  
  return Buffer.concat([
    Buffer.from(header, 'utf-8'),
    fileData,
    Buffer.from(footer, 'utf-8')
  ]);
}

async function runTest() {
  console.log('🧪 Testing Duplicate Slip Detection...\n');
  let token = '';
  let testEmail = `user_dup_${Date.now()}@terasmart.com`;
  let testUsername = `UserDup${Array.from({length: 6}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('')}`;
  let testPhone = '08' + Array.from({length: 8}, () => Math.floor(Math.random() * 10)).join('');
  let addressId = null;
  let variantId = null;
  let order1Id = null;
  let order2Id = null;

  try {
    // 1. Register & Login
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        phone: testPhone,
        password: 'password123'
      })
    });
    const regData = await regRes.json();
    token = (await (await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    })).json()).data.token;

    // 2. Create Address
    const addrRes = await fetch(`${BASE_URL}/api/v1/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        receiver_name: 'สมชาย สายตรวจ',
        phone: '0812345678',
        address_detail: '999/99 หมู่บ้านสิริกมล ซอย 5',
        sub_district: 'คลองกุ่ม',
        district: 'บึงกุ่ม',
        province: 'กรุงเทพมหานคร',
        postal_code: '10240',
        is_default: true
      })
    });
    const addrData = await addrRes.json();
    addressId = addrData.data.id;

    // 3. Find Product Variant
    const prodRes = await fetch(`${BASE_URL}/api/v1/products`);
    const prodData = await prodRes.json();
    const detailRes = await fetch(`${BASE_URL}/api/v1/products/${prodData.data[0].slug}`);
    const detailData = await detailRes.json();
    variantId = detailData.data.variants[0].id;

    // 4. Create Order 1
    console.log('🛒 Creating Order 1...');
    await fetch(`${BASE_URL}/api/v1/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ variant_id: variantId, quantity: 1 })
    });
    const order1Res = await (await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ address_id: addressId })
    })).json();
    order1Id = order1Res.data.id;
    console.log(`   Order 1 Created. ID: ${order1Id}`);

    // 5. Create Order 2
    console.log('🛒 Creating Order 2...');
    await fetch(`${BASE_URL}/api/v1/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ variant_id: variantId, quantity: 1 })
    });
    const order2ResRaw = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ address_id: addressId })
    });
    const order2Res = await order2ResRaw.json();
    console.log('   Order 2 Response:', JSON.stringify(order2Res));
    order2Id = order2Res.data.id;
    console.log(`   Order 2 Created. ID: ${order2Id}`);

    // 6. Upload Slip for Order 1 (Should succeed)
    console.log('\n📤 Uploading slip for Order 1 (First time)...');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filePath = path.join(__dirname, '../uploads/dummy_slip.jpg');
    const body = buildMultipartBody(boundary, 'slip', filePath, 'image/jpeg');

    const upload1Res = await fetch(`${BASE_URL}/api/v1/payments/${order1Id}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`
      },
      body: body
    });
    const upload1Data = await upload1Res.json();
    console.log('   Response Status:', upload1Res.status);
    console.log('   Response Message:', upload1Data.message);
    if (upload1Res.status === 200 && upload1Data.status === 'success') {
      console.log('   ✅ Upload 1 Succeeded as expected.');
    } else {
      throw new Error(`Upload 1 failed unexpectedly: ${JSON.stringify(upload1Data)}`);
    }

    // 7. Upload SAME Slip for Order 2 (Should fail as duplicate!)
    console.log('\n📤 Uploading the EXACT SAME slip for Order 2...');
    const upload2Res = await fetch(`${BASE_URL}/api/v1/payments/${order2Id}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Bearer ${token}`
      },
      body: body
    });
    const upload2Data = await upload2Res.json();
    console.log('   Response Status:', upload2Res.status);
    console.log('   Response Message:', upload2Data.message);
    if (upload2Res.status === 400 && upload2Data.status === 'error' && upload2Data.message.includes('สลิปนี้เคยใช้ชำระเงินในระบบไปแล้ว')) {
      console.log('\n🎉 SUCCESS: The duplicate slip was successfully blocked by the system!');
    } else {
      throw new Error(`Duplicate slip check FAILED! It should have returned 400 error but returned ${upload2Res.status}: ${JSON.stringify(upload2Data)}`);
    }

  } catch (err) {
    console.error('\n❌ Test Failed:', err.message);
  }
}

runTest();
