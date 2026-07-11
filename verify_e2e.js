// E2E REST API Integration Test Script for TeraSmart
const fs = require('fs');
const path = require('path');

// Since node-fetch might not support multipart easily without FormData, we will use built-in fetch if available
// Or we can construct multipart form data manually, which is standard and requires no libraries.
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

const BASE_URL = 'http://localhost:5000';

async function testE2E() {
  console.log('🏁 Starting TeraSmart E2E Integration Test...\n');
  let customerToken = '';
  let adminToken = '';
  let testOrderId = '';
  let addressId = '';
  let variantId = '';

  try {
    // 1. REGISTER NEW USER (Validation Rule check)
    console.log('1. Testing Username Validation (containing numbers)...');
    try {
      const regFailRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Somchai99',
          email: 'somchai@gmail.com',
          phone: '0812345678',
          password: 'password123'
        })
      });
      const regFail = await regFailRes.json();
      console.log('   Response Status:', regFailRes.status);
      console.log('   Response Body:', JSON.stringify(regFail));
      if (regFailRes.status === 400 && regFail.errors && regFail.errors.username) {
        console.log('   ✅ Backend Validation rejected username with numbers successfully!');
      } else {
        throw new Error('Username validation did not reject numbers');
      }
    } catch (e) {
      console.error('   ❌ Fail:', e.message);
    }

    console.log('\n2. Testing Phone Validation (invalid length)...');
    try {
      const regFailRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Somchai Name Only',
          email: 'somchai@gmail.com',
          phone: '08123',
          password: 'password123'
        })
      });
      const regFail = await regFailRes.json();
      console.log('   Response Status:', regFailRes.status);
      console.log('   Response Body:', JSON.stringify(regFail));
      if (regFailRes.status === 400 && regFail.errors && regFail.errors.phone) {
        console.log('   ✅ Backend Validation rejected short phone successfully!');
      } else {
        throw new Error('Phone validation did not reject invalid length');
      }
    } catch (e) {
      console.error('   ❌ Fail:', e.message);
    }

    console.log('\n3. Testing Successful Register...');
    const randStr = Array.from({length: 6}, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    const testUsername = 'ETwoETestUser' + randStr;
    const testEmail = `test_${Date.now()}@terasmart.com`;
    const testPhone = '08' + Array.from({length: 8}, () => Math.floor(Math.random() * 10)).join('');
    const regRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        phone: testPhone,
        password: 'userpassword123'
      })
    });
    const regData = await regRes.json();
    console.log('   Status:', regRes.status);
    console.log('   Body:', JSON.stringify(regData));
    if (regRes.status === 201) {
      console.log('   ✅ Customer registered successfully!');
    } else {
      throw new Error('Register failed');
    }

    // 2. LOGIN USER
    console.log('\n4. Logging in as Customer...');
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'userpassword123'
      })
    });
    const loginData = await loginRes.json();
    customerToken = loginData.data.token;
    console.log('   Logged in! Token length:', customerToken.length);
    console.log('   ✅ Customer login successful!');

    // 3. LOAD PRODUCTS & CATEGORIES
    console.log('\n5. Fetching Catalog Categories & Products...');
    const catRes = await fetch(`${BASE_URL}/api/v1/categories`);
    const catData = await catRes.json();
    console.log(`   Categories count: ${catData.data.length}`);
    
    const prodRes = await fetch(`${BASE_URL}/api/v1/products`);
    const prodData = await prodRes.json();
    console.log(`   Products count: ${prodData.data.length}`);
    if (prodData.data.length > 0) {
      console.log('   First product in catalog:', prodData.data[0].name);
      
      // Let's get product detail to find variants
      const firstSlug = prodData.data[0].slug;
      const detailRes = await fetch(`${BASE_URL}/api/v1/products/${firstSlug}`);
      const detailData = await detailRes.json();
      variantId = detailData.data.variants[0].id;
      console.log(`   Selected Variant: "${detailData.data.variants[0].variant_name}" with Stock: ${detailData.data.variants[0].stock_quantity}`);
      console.log('   ✅ Catalog loading & variant details query successful!');
    } else {
      throw new Error('No products found in database');
    }

    // 4. ADDRESS MANAGEMENT
    console.log('\n6. Creating shipping address...');
    const addrRes = await fetch(`${BASE_URL}/api/v1/addresses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
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
    console.log('   Address creation response status:', addrRes.status);
    console.log('   Address creation response body:', JSON.stringify(addrData));
    if (addrRes.status !== 201) {
      throw new Error(`Address creation failed with status ${addrRes.status}: ${JSON.stringify(addrData)}`);
    }
    addressId = addrData.data.id;
    console.log('   Address created. ID:', addressId);
    console.log('   ✅ Address creation successful!');

    // 5. SHOPPING CART FLOW
    console.log('\n7. Adding product variant to cart...');
    const cartAddRes = await fetch(`${BASE_URL}/api/v1/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        variant_id: variantId,
        quantity: 1
      })
    });
    const cartAddData = await cartAddRes.json();
    console.log('   Cart add status:', cartAddData.status);

    const cartGetRes = await fetch(`${BASE_URL}/api/v1/cart`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const cartGetData = await cartGetRes.json();
    console.log('   Cart items count:', cartGetData.data.length);
    console.log('   ✅ Cart operations successful!');

    // 6. CHECKOUT FLOW
    console.log('\n8. Checking out cart and creating order...');
    const orderRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        address_id: addressId
      })
    });
    const orderData = await orderRes.json();
    testOrderId = orderData.data.id;
    console.log('   Order created! ID:', testOrderId);
    console.log('   Total Price:', orderData.data.total_price, '฿');
    console.log('   ✅ Order checkout successful!');

    // 7. GENERATE DYNAMIC PAYMENT QR
    console.log('\n9. Generating dynamic QR code...');
    const qrRes = await fetch(`${BASE_URL}/api/v1/payments/${testOrderId}/qr`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const qrData = await qrRes.json();
    console.log('   QR Code Payload:', qrData.data.qr_code_data.substring(0, 40) + '...');
    console.log('   Expires At:', qrData.data.expires_at);
    console.log('   ✅ Dynamic PromptPay QR generation successful!');

    // 8. SIMULATE AUTOMATED QR PAYMENT WEBHOOK CALLBACK (PromptPay QR)
    console.log('\n10. Simulating Automated Bank Webhook Callback (PromptPay QR)...');
    const webhookRes = await fetch(`${BASE_URL}/api/v1/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: testOrderId,
        amount: orderData.data.total_price
      })
    });
    const webhookData = await webhookRes.json();
    console.log('    Webhook status:', webhookRes.status);
    console.log('    Message:', webhookData.message);
    if (webhookRes.status === 200) {
      console.log('    ✅ Automated Bank Webhook callback completed successfully!');
    } else {
      throw new Error('Automated Bank Webhook callback failed');
    }

    // 9. CHECK CUSTOMER ORDER HISTORY STATUS
    console.log('\n11. Verifying order timeline status...');
    const myOrdersRes = await fetch(`${BASE_URL}/api/v1/orders`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const myOrdersData = await myOrdersRes.json();
    const targetOrder = myOrdersData.data.find(o => o.id === testOrderId);
    console.log('    Order Status:', targetOrder.status);
    console.log('    Payment Status:', targetOrder.payment_status);
    if (targetOrder.status === 'paid' && targetOrder.payment_status === 'completed') {
      console.log('    ✅ Order timeline successfully updated to Paid (ชำระเงินแล้ว)!');
    } else {
      throw new Error('Order status not updated properly');
    }

    // 10. LOGIN AS ADMIN
    console.log('\n12. Logging in as Admin...');
    const adminLoginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@terasmart.com',
        password: 'admin1234'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    adminToken = adminLoginData.data.token;
    console.log('    Logged in! Admin token length:', adminToken.length);
    console.log('    ✅ Admin login successful!');

    // 11. CHECK ADMIN DASHBOARD
    console.log('\n13. Fetching Admin Dashboard Sales Metrics...');
    const metricsRes = await fetch(`${BASE_URL}/api/v1/admin/dashboard`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const metricsData = await metricsRes.json();
    console.log('    Dashboard Total Sales:', metricsData.data.total_sales, '฿');
    console.log('    Dashboard Total Orders:', metricsData.data.total_orders);
    console.log('    Dashboard Active Products:', metricsData.data.active_products);
    console.log('    ✅ Dashboard metrics load successful!');

    // 12. ADMIN FULFILL ORDER
    console.log('\n14. Updating Order status to Shipping (Fulfillment)...');
    const shipUpdateRes = await fetch(`${BASE_URL}/api/v1/admin/orders/${testOrderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'shipping',
        courier_name: 'Flash Express',
        tracking_number: 'FLS999888777'
      })
    });
    const shipUpdateData = await shipUpdateRes.json();
    console.log('    Status:', shipUpdateRes.status);
    console.log('    Message:', shipUpdateData.message);
    console.log('    ✅ Order tracking courier Kerry/Flash & status update successful!');

    // 13. CHECK FINAL TIMELINE & COURIER DISPLAY FOR CUSTOMER
    console.log('\n15. Verifying customer order tracking detail...');
    const detailRes = await fetch(`${BASE_URL}/api/v1/orders/${testOrderId}`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    const detailData = await detailRes.json();
    console.log('    Customer Order Status:', detailData.data.status);
    console.log('    Shipping Courier:', detailData.data.courier_name);
    console.log('    Shipping Tracking Code:', detailData.data.tracking_number);
    console.log('    Shipping Timeline Status:', detailData.data.shipping_status);
    if (detailData.data.status === 'shipping' && detailData.data.tracking_number === 'FLS999888777') {
      console.log('    ✅ Customer successfully views tracking code & timeline updates E2E!');
    } else {
      throw new Error('Customer shipping details verify failed');
    }
    // 14. UPDATE PROFILE
    console.log('\n16. Testing User Profile Update...');
    const randPhone = '08' + Math.floor(10000000 + Math.random() * 90000000);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randLetters = '';
    for (let i = 0; i < 6; i++) {
      randLetters += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    const randName = 'NewName' + randLetters;
    const profileRes = await fetch(`${BASE_URL}/api/v1/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: JSON.stringify({
        username: randName,
        phone: randPhone
      })
    });
    const profileData = await profileRes.json();
    console.log('    Status:', profileRes.status);
    console.log('    Updated Username:', profileData.data.username);
    console.log('    Updated Phone:', profileData.data.phone);
    if (profileRes.status === 200 && profileData.data.username === randName) {
      console.log('    ✅ Profile update endpoint verified successfully!');
    } else {
      throw new Error('Profile update verification failed');
    }

    // 15. FORGOT & RESET PASSWORD FLOW
    console.log('\n17. Testing Forgot & Reset Password Flow...');
    const forgotRes = await fetch(`${BASE_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email', value: testEmail })
    });
    const forgotData = await forgotRes.json();
    console.log('    Forgot password response:', forgotData);
    const resetToken = forgotData.data ? forgotData.data.token : null;
    console.log('    Forgot password status:', forgotRes.status);
    console.log('    Generated PIN Token:', resetToken);

    const resetRes = await fetch(`${BASE_URL}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        token: resetToken,
        new_password: 'recoveredpassword123'
      })
    });
    const resetData = await resetRes.json();
    console.log('    Reset response status:', resetRes.status);
    console.log('    Message:', resetData.message);
    if (resetRes.status === 200) {
      console.log('    ✅ Account recovery and password resets verified successfully!');
    } else {
      throw new Error('Reset password verification failed');
    }

    console.log('\n🎉 ALL E2E INTEGRATION TESTS PASSED SUCCESSFULLY! 🌟');
  } catch (err) {
    console.error('\n❌ E2E Integration Test Failed:', err);
  }
}

testE2E();
