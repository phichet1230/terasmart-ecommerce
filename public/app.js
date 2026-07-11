// TeraSmart Client Application Engine
class TeraSmartApp {
  constructor() {
    this.user = JSON.parse(localStorage.getItem('tera_user')) || null;
    this.token = localStorage.getItem('tera_token') || null;
    this.activeTab = 'catalog';
    
    // Product list & Filter state
    this.products = [];
    this.categories = [];
    this.selectedCategories = [];
    this.searchQuery = '';
    this.maxPrice = 50000;
    this.limit = 6;
    this.offset = 0;
    this.totalProducts = 0;
    
    // Cart & Checkout state
    this.cartItems = [];
    this.addresses = [];
    this.selectedAddressId = null;
    this.selectedPaymentMethod = 'bank'; // default
    
    // Details variant state
    this.selectedProduct = null;
    this.selectedVariant = null;

    // Payment state
    this.currentOrder = null;
    this.slipFile = null;
    this.countdownTimer = null;
  }

  init() {
    this.setupEventListeners();
    this.loadCategories();
    this.loadProducts();
    this.updateAuthHeader();
    
    if (this.token) {
      this.loadCart();
      this.loadAddresses();
    }
  }

  // Helper function to issue requests to backend
  async apiRequest(url, method = 'GET', body = null, isMultipart = false) {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    let options = { method, headers };
    
    if (body) {
      if (isMultipart) {
        options.body = body; // let browser set content-type for FormData
      } else {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      // Catch unauthorized/expired token
      if (response.status === 401 && this.token) {
        this.logout();
        this.showToast('เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบใหม่', 'error');
        throw new Error('Unauthorized');
      }
      throw data; // Throw error response JSON
    }
    return data;
  }

  // Toast Notifications
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
      <span>${message}</span>
      <span class="toast-close">&times;</span>
    `;
    
    // close button event
    toast.querySelector('.toast-close').onclick = () => toast.remove();
    
    container.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 4000);
  }

  setupEventListeners() {
    // Dropzone drag-drop visual effects
    const dropzone = document.getElementById('slip-dropzone');
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.style.borderColor = 'var(--primary-color)';
          dropzone.style.backgroundColor = 'rgba(255, 50, 1, 0.03)';
        }, false);
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropzone.style.borderColor = 'var(--border-color)';
          dropzone.style.backgroundColor = 'var(--bg-input)';
        }, false);
      });

      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
          document.getElementById('slip-file-input').files = files;
          this.handleSlipFileSelect({ target: { files } });
        }
      }, false);
    }
  }

  // --- NAVIGATION TAB SWITCHING ---
  switchTab(tabName) {
    if (this.paymentPollingInterval) {
      clearInterval(this.paymentPollingInterval);
      this.paymentPollingInterval = null;
    }
    if (tabName === 'cart' || tabName === 'checkout' || tabName === 'payment') {
      if (!this.token) {
        this.showToast('กรุณาเข้าสู่ระบบเพื่อใช้งานฟังก์ชันนี้', 'error');
        this.switchTab('profile');
        return;
      }
    }

    this.activeTab = tabName;
    
    // Hide all tabs
    document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    // Show active tab
    const tabEl = document.getElementById(`tab-${tabName}`);
    if (tabEl) tabEl.classList.add('active');
    
    const navEl = document.getElementById(`nav-${tabName}`);
    if (navEl) navEl.classList.add('active');
    
    // Run tab specific updates
    if (tabName === 'catalog') {
      this.loadProducts();
    } else if (tabName === 'cart') {
      this.loadCart().then(() => this.renderCart());
    } else if (tabName === 'profile') {
      this.renderProfile();
    } else if (tabName === 'checkout') {
      this.loadAddresses().then(() => this.renderCheckout());
    }
    
    // scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- AUTHENTICATION MODULE ---
  updateAuthHeader() {
    const area = document.getElementById('auth-header-status');
    const adminBtn = document.getElementById('nav-admin-toggle');
    
    if (this.user) {
      const avatarHTML = this.user.profile_image 
        ? `<img src="${this.user.profile_image}" style="width:24px; height:24px; border-radius:50%; object-fit:cover; border:1px solid var(--border-color);">`
        : `<div style="width:24px; height:24px; border-radius:50%; background:var(--primary-color); color:#fff; display:flex; justify-content:center; align-items:center; font-size:0.7rem; font-weight:700;">${this.user.username.charAt(0).toUpperCase()}</div>`;
      
      area.innerHTML = `
        <div style="display:inline-flex; align-items:center; gap:8px; cursor:pointer;" onclick="app.switchTab('profile')">
          ${avatarHTML}
          <strong style="color:var(--primary-color);">${this.user.username}</strong>
        </div>
      `;
      if (this.user.role === 'admin') {
        adminBtn.classList.remove('hidden');
      } else {
        adminBtn.classList.add('hidden');
      }
    } else {
      area.innerHTML = `
        <button class="btn btn-secondary btn-sm" onclick="app.switchTab('profile')">เข้าสู่ระบบ / สมัครสมาชิก</button>
      `;
      adminBtn.classList.add('hidden');
    }
  }

  renderProfile() {
    const container = document.getElementById('profile-container');
    if (!this.token) {
      // Show Login & Register UI
      container.innerHTML = `
        <div class="auth-panel-wrapper">
          <!-- Inline Developer Notification Banner -->
          <div id="auth-dev-notification" class="hidden" style="margin-bottom:15px; padding:12px; border-radius:8px; border:1px solid var(--success-color); background:rgba(0,186,124,0.1); color:var(--text-main); font-size:0.8rem; line-height:1.4;"></div>

          <div class="auth-tabs" id="auth-tabs-container">
            <button id="auth-tab-login" class="auth-tab active" onclick="app.switchAuthForm('login')">เข้าสู่ระบบ</button>
            <button id="auth-tab-register" class="auth-tab" onclick="app.switchAuthForm('register')">สมัครสมาชิก</button>
          </div>
          
          <!-- LOGIN FORM -->
          <div id="auth-form-login" class="auth-form active">
            <h3>เข้าสู่ระบบผู้ใช้งาน</h3>
            <form onsubmit="app.handleLogin(event)">
              <div class="form-group form-group-margin">
                <label for="login-email">อีเมล</label>
                <input type="email" id="login-email" placeholder="email@terasmart.com" required>
              </div>
              <div class="form-group form-group-margin">
                <label for="login-password">รหัสผ่าน</label>
                <input type="password" id="login-password" placeholder="รหัสผ่านของคุณ" required>
              </div>
              <div style="text-align: right; margin-bottom: 15px;">
                <a href="#" style="font-size: 0.8rem; color: var(--primary-color); text-decoration: none; font-weight: 500;" onclick="app.showForgotPassword(event)">ลืมรหัสผ่าน?</a>
              </div>
              <button type="submit" class="btn btn-primary auth-btn">เข้าสู่ระบบ</button>
            </form>
            <div style="margin-top: 15px; text-align: center; font-size: 0.8rem; color: var(--text-muted)">
              บัญชีทดสอบ ลูกค้า: customer@terasmart.com / customer1234<br>
              บัญชีทดสอบ แอดมิน: admin@terasmart.com / admin1234
            </div>
          </div>
          
          <!-- REGISTER FORM -->
          <div id="auth-form-register" class="auth-form">
            <h3>ลงทะเบียนสมาชิกใหม่</h3>
            <form onsubmit="app.handleRegister(event)">
              <div class="form-group form-group-margin" id="group-reg-username">
                <label for="register-username">ชื่อผู้ใช้ (ตัวอักษรเท่านั้น ห้ามมีตัวเลข)</label>
                <input type="text" id="register-username" placeholder="เช่น สมเกียรติ ยิ่งใหญ่" required oninput="app.validateUsername(event)">
                <span class="error-message">ชื่อผู้ใช้งานต้องเป็นตัวอักษร (ภาษาไทย/อังกฤษ และเว้นวรรค) เท่านั้น ห้ามใส่ตัวเลข</span>
              </div>
              <div class="form-group form-group-margin">
                <label for="register-email">อีเมล</label>
                <input type="email" id="register-email" placeholder="example@terasmart.com" required>
              </div>
              <div class="form-group form-group-margin" id="group-reg-phone">
                <label for="register-phone">เบอร์โทรศัพท์ (ความยาว 10 หลัก)</label>
                <input type="text" id="register-phone" placeholder="เช่น 0891234567" maxLength="10" required oninput="app.validatePhone(event)">
                <span class="error-message">เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น</span>
              </div>
              <div class="form-group form-group-margin">
                <label for="register-password">รหัสผ่าน</label>
                <input type="password" id="register-password" placeholder="อย่างน้อย 6 ตัวอักษร" minLength="6" required>
              </div>
              <button type="submit" class="btn btn-primary auth-btn" id="register-submit-btn">สร้างบัญชีผู้ใช้</button>
            </form>
          </div>

          <!-- FORGOT PASSWORD FORM (Email only) -->
          <div id="auth-form-forgot" class="auth-form">
            <h3>กู้คืนบัญชีผู้ใช้งาน</h3>
            <p class="upload-guide" style="color:var(--text-muted); font-size:0.8rem; margin-bottom:15px;">ระบบจะส่งรหัส PIN 6 หลักไปยังอีเมลของคุณ</p>
            <form onsubmit="app.handleForgotPassword(event)">
              <div class="form-group form-group-margin">
                <label for="forgot-email">อีเมลผู้ใช้ของคุณ</label>
                <input type="email" id="forgot-email" placeholder="email@terasmart.com" required>
              </div>
              <button type="submit" class="btn btn-primary auth-btn" style="margin-top:15px;">ส่งรหัสกู้คืนทางอีเมล</button>
              <button type="button" class="btn btn-secondary auth-btn" style="margin-top: 10px;" onclick="app.switchAuthForm('login')">ยกเลิก</button>
            </form>
          </div>

          <!-- RESET PASSWORD FORM -->
          <div id="auth-form-reset" class="auth-form">
            <h3>ตั้งรหัสผ่านใหม่</h3>
            <p class="upload-guide" style="color:var(--primary-color); font-size:0.8rem; margin-bottom:15px;">กรุณากรอกรหัส PIN กู้คืน 6 หลัก และตั้งรหัสผ่านใหม่</p>
            <form onsubmit="app.handleResetPassword(event)">
              <div class="form-group form-group-margin">
                <label for="reset-token">รหัสกู้คืน (PIN เช่น TS-123456)</label>
                <input type="text" id="reset-token" placeholder="TS-xxxxxx" autocomplete="one-time-code" required>
              </div>
              <div class="form-group form-group-margin">
                <label for="reset-new-password">รหัสผ่านใหม่</label>
                <input type="password" id="reset-new-password" placeholder="อย่างน้อย 6 ตัวอักษร" minLength="6" autocomplete="new-password" required>
              </div>
              <div class="form-group form-group-margin">
                <label for="reset-confirm-password">ยืนยันรหัสผ่านใหม่</label>
                <input type="password" id="reset-confirm-password" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" minLength="6" autocomplete="new-password" required>
              </div>
              <button type="submit" class="btn btn-primary auth-btn">ตั้งรหัสผ่านใหม่</button>
              <button type="button" class="btn btn-secondary auth-btn" style="margin-top: 10px;" onclick="app.switchAuthForm('login')">ยกเลิก</button>
            </form>
          </div>
        </div>
      `;
    } else {
      // Show profile details, address management, and payment methods
      container.innerHTML = `
        <!-- Image Crop Modal -->
        <div id="crop-modal" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.85); display:none; align-items:center; justify-content:center;">
          <div style="background:var(--bg-card); border-radius:16px; padding:24px; width:min(500px,95vw); display:flex; flex-direction:column; gap:16px;">
            <h3 style="margin:0; font-size:1rem;">ปรับสัดส่วนรูปโปรไฟล์</h3>
            <div id="crop-image-wrapper" style="max-height:380px; overflow:hidden; border-radius:8px; background:#000;">
              <img id="crop-image-el" style="max-width:100%; display:block;">
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-primary" style="flex:1;" onclick="app.confirmCrop()">ยืนยันและอัปโหลด</button>
              <button class="btn btn-secondary" onclick="app.cancelCrop()">ยกเลิก</button>
            </div>
          </div>
        </div>

        <div class="profile-card-grid">
          <div class="user-info-sidebar">
            <div class="profile-avatar-wrapper" style="overflow:hidden; display:flex; justify-content:center; align-items:center;">
              ${this.user.profile_image ? `<img src="${this.user.profile_image}" style="width:100%; height:100%; object-fit:cover;">` : this.user.username.charAt(0).toUpperCase()}
            </div>
            <div class="profile-name">${this.user.username}</div>
            <div class="profile-role-tag">${this.user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ลูกค้าสมาชิก (Customer)'}</div>
            
            <div class="profile-details-list">
              <div class="profile-detail-item">
                <span class="profile-detail-label">บัญชีผู้ใช้</span>
                <strong>${this.user.email}</strong>
              </div>
              <div class="profile-detail-item" style="margin-top: 10px;">
                <span class="profile-detail-label">เบอร์โทรศัพท์</span>
                <strong id="profile-display-phone">${this.user.phone || 'ยังไม่ระบุ'}</strong>
              </div>
            </div>
            
            <button class="btn btn-secondary" style="margin-top: 15px;" onclick="app.showEditProfileModal()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              แก้ไขข้อมูลส่วนตัว
            </button>

            <button class="btn btn-secondary logout-btn" style="margin-top: 15px;" onclick="app.logout()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              ออกจากระบบ
            </button>
          </div>
          
          <div class="orders-history-panel">
            <!-- Profile Sub-tabs -->
            <div style="display:flex; gap:0; border-bottom:2px solid var(--border-color); margin-bottom:20px;">
              <button id="ptab-orders" class="profile-subtab active" onclick="app.switchProfileTab('orders')">ประวัติสั่งซื้อ</button>
              <button id="ptab-addresses" class="profile-subtab" onclick="app.switchProfileTab('addresses')">ที่อยู่จัดส่ง</button>
              <button id="ptab-payment" class="profile-subtab" onclick="app.switchProfileTab('payment')">การชำระเงิน</button>
            </div>

            <!-- Orders Panel -->
            <div id="ppanel-orders" class="profile-subpanel active">
              <div id="profile-orders-list">
                <div class="payment-loading"><div class="spinner"></div><span>กำลังโหลดประวัติสั่งซื้อ...</span></div>
              </div>
            </div>

            <!-- Addresses Panel -->
            <div id="ppanel-addresses" class="profile-subpanel" style="display:none;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h4 style="margin:0;">ที่อยู่จัดส่งของคุณ</h4>
                <button class="btn btn-primary btn-sm" onclick="app.openAddressModal(null)">+ เพิ่มที่อยู่ใหม่</button>
              </div>
              <div id="profile-address-list">
                <div class="payment-loading"><div class="spinner"></div><span>กำลังโหลด...</span></div>
              </div>
            </div>

            <!-- Payment Panel -->
            <div id="ppanel-payment" class="profile-subpanel" style="display:none;">
              <div style="margin-bottom:20px;">
                <h4 style="margin:0 0 8px;">ชำระเงินด้วย PromptPay</h4>
                <p style="color:var(--text-muted); font-size:0.85rem; margin:0 0 16px;">สร้าง QR Code พร้อมราคาสินค้า เพื่อสแกนจ่ายได้ทันที</p>
                <div style="display:flex; gap:10px; align-items:flex-end;">
                  <div class="form-group" style="flex:1; margin:0;">
                    <label>จำนวนเงิน (บาท)</label>
                    <input type="number" id="qr-amount-input" placeholder="เช่น 1500.00" min="1" step="0.01" style="margin-top:6px;">
                  </div>
                  <button class="btn btn-primary" onclick="app.generatePromptPayQR()">สร้าง QR</button>
                </div>
              </div>
              <div id="qr-result-panel" style="display:none; text-align:center;">
                <img id="qr-result-img" src="" alt="PromptPay QR" style="width:220px; height:220px; border-radius:12px; border:2px solid var(--border-color);">
                <div id="qr-result-amount" style="font-size:1.2rem; font-weight:700; color:var(--primary-color); margin:12px 0 4px;"></div>
                <div id="qr-result-id" style="font-size:0.75rem; color:var(--text-muted); margin-bottom:14px;"></div>
                <button class="btn btn-secondary" onclick="app.downloadQR()">บันทึก QR เป็นรูปภาพ</button>
              </div>
            </div>
          </div>
        </div>
      `;
      this.loadMyOrders();
      this.loadProfileAddresses();
    }
  }

  switchAuthForm(formType) {
    document.querySelectorAll('.auth-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(el => el.classList.remove('active'));
    
    const tabContainer = document.getElementById('auth-tabs-container');
    if (formType === 'login' || formType === 'register') {
      if (tabContainer) tabContainer.style.display = 'flex';
      const tabEl = document.getElementById(`auth-tab-${formType}`);
      if (tabEl) tabEl.classList.add('active');

      // ซ่อนแบนเนอร์กู้รหัส PIN เมื่อกลับเข้าสู่หน้าล็อกอิน/สมัครสมาชิก
      const devBox = document.getElementById('auth-dev-notification');
      if (devBox) devBox.classList.add('hidden');
    } else {
      if (tabContainer) tabContainer.style.display = 'none';
    }

    // ล้างค่าฟิลด์ฟอร์มกู้รหัสเพื่อเคลียร์ Autofill จากเบราว์เซอร์
    if (formType === 'reset') {
      const resetToken = document.getElementById('reset-token');
      const resetNew = document.getElementById('reset-new-password');
      const resetConf = document.getElementById('reset-confirm-password');
      if (resetToken) resetToken.value = '';
      if (resetNew) resetNew.value = '';
      if (resetConf) resetConf.value = '';
    }
    
    const formEl = document.getElementById(`auth-form-${formType}`);
    if (formEl) formEl.classList.add('active');
  }

  // --- Strict Front-end Form Validation Rules ---
  validateUsername(event) {
    const input = event.target;
    const group = document.getElementById('group-reg-username');
    // regex: accept only Thai, English letters, and spaces
    const regex = /^[a-zA-Z\u0e00-\u0e7f\s]*$/;
    
    if (/\d/.test(input.value) || !regex.test(input.value)) {
      group.classList.add('has-error');
      return false;
    } else {
      group.classList.remove('has-error');
      return true;
    }
  }

  validatePhone(event) {
    const input = event.target;
    const group = document.getElementById('group-reg-phone');
    // Filter out non-numbers
    input.value = input.value.replace(/\D/g, '');
    
    if (input.value.length !== 10) {
      group.classList.add('has-error');
      return false;
    } else {
      group.classList.remove('has-error');
      return true;
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await this.apiRequest('/api/v1/auth/login', 'POST', { email, password });
      
      this.token = res.data.token;
      this.user = res.data.user;
      
      localStorage.setItem('tera_token', this.token);
      localStorage.setItem('tera_user', JSON.stringify(this.user));
      
      this.showToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับครับ', 'success');
      this.updateAuthHeader();
      this.loadCart();
      this.loadAddresses();
      this.switchTab('catalog');
    } catch (err) {
      this.showToast(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;

    // Double-check validations
    if (/\d/.test(username)) {
      this.showToast('ชื่อผู้ใช้งานห้ามใส่ตัวเลข', 'error');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      this.showToast('เบอร์โทรศัพท์ต้องมี 10 หลักเท่านั้น', 'error');
      return;
    }

    try {
      await this.apiRequest('/api/v1/auth/register', 'POST', { username, email, phone, password });
      this.showToast('ลงทะเบียนบัญชีสำเร็จ! กรุณาเข้าสู่ระบบ', 'success');
      this.switchAuthForm('login');
    } catch (err) {
      if (err.errors) {
        const fieldErr = Object.values(err.errors)[0];
        this.showToast(fieldErr, 'error');
      } else {
        this.showToast(err.message || 'ลงทะเบียนไม่สำเร็จ', 'error');
      }
    }
  }

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('tera_token');
    localStorage.removeItem('tera_user');
    
    // Clear cart badge
    document.getElementById('cart-badge').innerText = '0';
    
    this.updateAuthHeader();
    this.switchTab('catalog');
  }

  // --- CATALOG MODULE ---
  async loadCategories() {
    try {
      const res = await this.apiRequest('/api/v1/categories');
      this.categories = res.data;
      this.renderCategoriesFilter();
    } catch (err) {
      console.error(err);
    }
  }

  renderCategoriesFilter() {
    const list = document.getElementById('category-filter-list');
    list.innerHTML = this.categories.map(c => `
      <label class="checkbox-item">
        <input type="checkbox" value="${c.id}" onchange="app.handleCategoryCheck(event)">
        ${c.name}
      </label>
    `).join('');
  }

  handleCategoryCheck(e) {
    const val = parseInt(e.target.value);
    if (e.target.checked) {
      this.selectedCategories.push(val);
    } else {
      this.selectedCategories = this.selectedCategories.filter(id => id !== val);
    }
    this.offset = 0; // reset to first page
    this.loadProducts();
  }

  handleSearch(e) {
    this.searchQuery = e.target.value;
    this.offset = 0;
    // Debounce search a bit
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadProducts();
    }, 450);
  }

  handlePriceSlider(e) {
    this.maxPrice = parseInt(e.target.value);
    document.getElementById('price-slider-value').innerText = `${this.maxPrice.toLocaleString()} ฿`;
    
    clearTimeout(this.priceTimeout);
    this.priceTimeout = setTimeout(() => {
      this.offset = 0;
      this.loadProducts();
    }, 450);
  }

  resetFilters() {
    document.getElementById('search-box').value = '';
    this.searchQuery = '';
    
    document.getElementById('price-slider').value = 50000;
    this.maxPrice = 50000;
    document.getElementById('price-slider-value').innerText = '50,000 ฿';
    
    this.selectedCategories = [];
    document.querySelectorAll('#category-filter-list input').forEach(el => el.checked = false);
    
    this.offset = 0;
    this.loadProducts();
  }

  async loadProducts() {
    try {
      const catParam = this.selectedCategories.join(',');
      let url = `/api/v1/products?limit=${this.limit}&offset=${this.offset}&max_price=${this.maxPrice}`;
      if (catParam) url += `&category=${catParam}`;
      if (this.searchQuery) url += `&search=${encodeURIComponent(this.searchQuery)}`;

      const res = await this.apiRequest(url);
      this.products = res.data;
      this.totalProducts = res.total;
      this.renderProducts();
      this.renderPagination();
    } catch (err) {
      console.error(err);
      this.showToast('ไม่สามารถโหลดรายการสินค้าได้', 'error');
    }
  }

  renderProducts() {
    const grid = document.getElementById('products-grid');
    if (this.products.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted)">
          ไม่พบสินค้าตามที่ระบุในตัวกรอง
        </div>
      `;
      return;
    }

    grid.innerHTML = this.products.map(p => {
      const priceStr = parseFloat(p.min_price).toFixed(2);
      const isOutOfStock = p.total_stock === 0 || p.total_stock === null;
      
      return `
        <div class="product-card" onclick="app.showProductDetail('${p.slug}')">
          <div class="product-image-container">
            <div class="product-image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            ${isOutOfStock ? '<span class="stock-status-badge stock-out" style="position:absolute; top:10px; left:10px; margin-bottom:0;">สินค้าหมด</span>' : ''}
          </div>
          <div class="product-card-body">
            <div class="product-category-tag">${p.category_name || 'ทั่วไป'}</div>
            <h4 class="product-title">${p.name}</h4>
            <div class="product-price-row">
              <span class="product-price">${priceStr} ฿</span>
            </div>
            <div class="product-card-action">
              ${isOutOfStock 
                ? `<button class="btn btn-disabled" disabled>สินค้าหมด (Out of Stock)</button>`
                : `<button class="btn btn-primary btn-sm">ดูรายละเอียด</button>`
              }
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderPagination() {
    const container = document.getElementById('pagination-controls');
    const totalPages = Math.ceil(this.totalProducts / this.limit);
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const currentPage = Math.floor(this.offset / this.limit) + 1;
    let btns = '';

    for (let i = 1; i <= totalPages; i++) {
      btns += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="app.goToPage(${i})">
          ${i}
        </button>
      `;
    }

    container.innerHTML = btns;
  }

  goToPage(pageNum) {
    this.offset = (pageNum - 1) * this.limit;
    this.loadProducts();
  }

  // --- PRODUCT DETAIL MODULE ---
  async showProductDetail(slug) {
    try {
      const res = await this.apiRequest(`/api/v1/products/${slug}`);
      this.selectedProduct = res.data;
      
      // select first variant by default (or the first in stock)
      this.selectedVariant = this.selectedProduct.variants.find(v => v.stock_quantity > 0) || this.selectedProduct.variants[0];
      
      this.renderProductDetailModal();
      document.getElementById('product-detail-modal').classList.add('active');
    } catch (err) {
      console.error(err);
      this.showToast('ไม่สามารถเปิดหน้ารายละเอียดสินค้าได้', 'error');
    }
  }

  closeProductDetail() {
    document.getElementById('product-detail-modal').classList.remove('active');
    this.selectedProduct = null;
    this.selectedVariant = null;
  }

  renderProductDetailModal() {
    const content = document.getElementById('product-detail-content');
    const p = this.selectedProduct;
    
    // Check if variants are present
    const variantOptionsHtml = p.variants.map((v, i) => {
      const isOutOfStock = v.stock_quantity <= 0;
      const isSelected = this.selectedVariant && this.selectedVariant.id === v.id;
      
      return `
        <label class="variant-option-label ${isOutOfStock ? 'out-of-stock' : ''} ${isSelected ? 'selected' : ''}" id="lbl-variant-${v.id}">
          <input type="radio" name="product-variant" value="${v.id}" 
                 ${isOutOfStock ? 'disabled' : ''} 
                 ${isSelected ? 'checked' : ''} 
                 onchange="app.handleVariantSelect(${v.id})">
          <div>${v.variant_name}</div>
          <div style="font-size:0.75rem; margin-top:2px; font-weight:bold;">${parseFloat(v.price).toFixed(2)} ฿</div>
        </label>
      `;
    }).join('');

    const currentPriceStr = this.selectedVariant ? parseFloat(this.selectedVariant.price).toFixed(2) : '0.00';
    const isVarOutOfStock = !this.selectedVariant || this.selectedVariant.stock_quantity <= 0;

    content.innerHTML = `
      <div class="product-detail-img-box">
        <div class="product-image-placeholder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:100px; height:100px;">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
      </div>
      
      <div class="product-detail-info">
        <span class="stock-status-badge ${isVarOutOfStock ? 'stock-out' : 'stock-in'}" id="detail-stock-badge">
          ${isVarOutOfStock ? 'สินค้าหมด (Out of Stock)' : `มีในสต็อก (${this.selectedVariant.stock_quantity} ชิ้น)`}
        </span>
        <h2>${p.name}</h2>
        <div class="product-detail-price" id="detail-price-text">${currentPriceStr} ฿</div>
        
        <div class="variants-container">
          <div class="spec-title">ตัวเลือกสินค้า (Variants):</div>
          <div class="variant-options-grid">
            ${variantOptionsHtml}
          </div>
        </div>

        <div class="product-desc-box">
          <div class="spec-title">รายละเอียดสเปกสินค้า:</div>
          <div class="product-desc-text">${p.description || 'ไม่มีข้อมูลรายละเอียดเพิ่มเติม'}</div>
        </div>

        <div class="product-actions-row">
          <button class="btn btn-secondary" ${isVarOutOfStock ? 'disabled' : ''} onclick="app.addToCartClick(false)">
            เพิ่มลงตะกร้า
          </button>
          <button class="btn btn-primary" ${isVarOutOfStock ? 'disabled' : ''} onclick="app.addToCartClick(true)">
            ซื้อเลย (Buy Now)
          </button>
        </div>
      </div>

      <!-- Related Products Cross-selling -->
      <div class="related-products-section" style="grid-column: 1/-1;">
        <h3>สินค้าแนะนำที่คุณอาจสนใจ</h3>
        <div class="related-products-grid">
          ${p.related_products.length === 0 ? '<p style="color:var(--text-muted); font-size:0.85rem;">ไม่มีสินค้าแนะนำในกลุ่มนี้</p>' : p.related_products.map(rp => `
            <div class="related-card" onclick="app.showProductDetail('${rp.slug}')">
              <div style="background-color:rgba(0,0,0,0.15); border-radius:6px; aspect-ratio:4/3; display:flex; justify-content:center; align-items:center; margin-bottom:10px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:24px; height:24px; opacity:0.3;">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                </svg>
              </div>
              <div class="related-title">${rp.name}</div>
              <div class="related-price">${parseFloat(rp.price).toFixed(2)} ฿</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  handleVariantSelect(variantId) {
    this.selectedVariant = this.selectedProduct.variants.find(v => v.id === variantId);
    
    // Update active classes on labels
    document.querySelectorAll('.variant-option-label').forEach(el => el.classList.remove('selected'));
    document.getElementById(`lbl-variant-${variantId}`).classList.add('selected');
    
    // Update price and stock indicator
    document.getElementById('detail-price-text').innerText = `${parseFloat(this.selectedVariant.price).toFixed(2)} ฿`;
    
    const badge = document.getElementById('detail-stock-badge');
    const isOutOfStock = this.selectedVariant.stock_quantity <= 0;
    
    if (isOutOfStock) {
      badge.className = 'stock-status-badge stock-out';
      badge.innerText = 'สินค้าหมด (Out of Stock)';
      // Disable buttons
      document.querySelectorAll('.product-actions-row button').forEach(btn => btn.disabled = true);
    } else {
      badge.className = 'stock-status-badge stock-in';
      badge.innerText = `มีในสต็อก (${this.selectedVariant.stock_quantity} ชิ้น)`;
      // Enable buttons
      document.querySelectorAll('.product-actions-row button').forEach(btn => btn.disabled = false);
    }
  }

  // --- CART MODULE ---
  async loadCart() {
    if (!this.token) return;
    try {
      const res = await this.apiRequest('/api/v1/cart');
      this.cartItems = res.data;
      this.updateCartBadge();
    } catch (err) {
      console.error(err);
    }
  }

  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    const totalQty = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    badge.innerText = totalQty;
    
    // Bounce effect
    badge.classList.add('bounce');
    setTimeout(() => badge.classList.remove('bounce'), 250);
  }

  async addToCartClick(goToCheckout = false) {
    if (!this.token) {
      this.showToast('กรุณาเข้าสู่ระบบก่อนหยิบสินค้าลงตะกร้า', 'error');
      this.closeProductDetail();
      this.switchTab('profile');
      return;
    }

    if (!this.selectedVariant) return;

    try {
      await this.apiRequest('/api/v1/cart/add', 'POST', {
        variant_id: this.selectedVariant.id,
        quantity: 1
      });

      this.showToast('เพิ่มสินค้าลงในตะกร้าสำเร็จ!', 'success');
      await this.loadCart();
      this.closeProductDetail();

      if (goToCheckout) {
        this.switchTab('checkout');
      }
    } catch (err) {
      this.showToast(err.message || 'ไม่สามารถหยิบสินค้าลงตะกร้าได้', 'error');
    }
  }

  async updateQty(cartItemId, newQty) {
    if (newQty <= 0) {
      this.deleteCartItem(cartItemId);
      return;
    }

    try {
      await this.apiRequest(`/api/v1/cart/items/${cartItemId}`, 'PUT', { quantity: newQty });
      await this.loadCart();
      this.renderCart();
    } catch (err) {
      this.showToast(err.message || 'ไม่สามารถอัปเดตจำนวนสินค้าได้', 'error');
    }
  }

  async deleteCartItem(cartItemId) {
    try {
      await this.apiRequest(`/api/v1/cart/items/${cartItemId}`, 'DELETE');
      this.showToast('ลบสินค้าออกจากตะกร้าแล้ว');
      await this.loadCart();
      this.renderCart();
    } catch (err) {
      this.showToast('ลบไม่สำเร็จ', 'error');
    }
  }

  renderCart() {
    const wrapper = document.getElementById('cart-content-wrapper');
    if (this.cartItems.length === 0) {
      wrapper.innerHTML = `
        <div class="cart-items-panel" style="grid-column: 1/-1;">
          <div class="empty-cart-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p>ไม่มีสินค้าในตะกร้าของคุณ</p>
            <button class="btn btn-primary" style="width:auto; margin-top:15px;" onclick="app.switchTab('catalog')">ไปหน้าสินค้า</button>
          </div>
        </div>
      `;
      return;
    }

    let subtotal = 0;
    const itemsHtml = this.cartItems.map(item => {
      const itemSub = parseFloat(item.price) * item.quantity;
      subtotal += itemSub;
      
      return `
        <div class="cart-item-row">
          <div class="cart-item-img">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>
          <div class="cart-item-details">
            <h4>${item.name}</h4>
            <p>ตัวเลือก: ${item.variant_name}</p>
          </div>
          <div class="cart-item-quantity">
            <button class="qty-btn" onclick="app.updateQty(${item.cart_item_id}, ${item.quantity - 1})">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" onclick="app.updateQty(${item.cart_item_id}, ${item.quantity + 1})">+</button>
          </div>
          <div class="cart-item-price">
            ${itemSub.toFixed(2)} ฿
          </div>
          <div>
            <button class="remove-cart-item-btn" onclick="app.deleteCartItem(${item.cart_item_id})">&times;</button>
          </div>
        </div>
      `;
    }).join('');

    const taxAmount = subtotal * 0.07;
    const totalAmount = subtotal + taxAmount;

    wrapper.innerHTML = `
      <div class="cart-items-panel">
        ${itemsHtml}
      </div>
      
      <div class="cart-summary-panel">
        <h3>สรุปการสั่งซื้อ</h3>
        <div class="price-breakdown">
          <div class="price-row">
            <span>ราคารวมสินค้า</span>
            <span>${subtotal.toFixed(2)} ฿</span>
          </div>
          <div class="price-row">
            <span>ภาษีมูลค่าเพิ่ม (7%)</span>
            <span>${taxAmount.toFixed(2)} ฿</span>
          </div>
          <div class="price-row total-row">
            <span>ยอดชำระทั้งสิ้น</span>
            <span>${totalAmount.toFixed(2)} ฿</span>
          </div>
        </div>
        <button class="btn btn-primary checkout-btn" onclick="app.switchTab('checkout')">
          ไปหน้าชำระเงิน
        </button>
      </div>
    `;
  }

  // --- CHECKOUT & ADDRESS MODULE ---
  async loadAddresses() {
    if (!this.token) return;
    try {
      const res = await this.apiRequest('/api/v1/addresses');
      this.addresses = res.data;
      
      // Select default address if available
      const def = this.addresses.find(a => a.is_default);
      if (def) this.selectedAddressId = def.id;
      else if (this.addresses.length > 0) this.selectedAddressId = this.addresses[0].id;
    } catch (err) {
      console.error(err);
    }
  }

  renderCheckout() {
    const list = document.getElementById('checkout-address-list');
    
    if (this.addresses.length === 0) {
      list.innerHTML = `
        <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.9rem;">
          คุณยังไม่มีที่อยู่จัดส่ง กรุณาเพิ่มที่อยู่ใหม่ด้านล่าง
        </div>
      `;
      this.selectedAddressId = null;
    } else {
      list.innerHTML = this.addresses.map(a => {
        const isSelected = this.selectedAddressId === a.id;
        
        return `
          <div class="address-option ${isSelected ? 'selected' : ''}" onclick="app.selectAddress(${a.id})">
            <input type="radio" name="checkout-addr" value="${a.id}" ${isSelected ? 'checked' : ''}>
            <div class="addr-header">
              <span>${a.receiver_name}</span>
              ${a.is_default ? '<span class="default-badge">เริ่มต้น</span>' : ''}
            </div>
            <div class="addr-body">
              โทร: ${a.phone}<br>
              ${a.address_detail} ต.${a.sub_district} อ.${a.district} จ.${a.province} ${a.postal_code}
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Order Summary Breakdown
    let subtotal = 0;
    const summaryItems = document.getElementById('checkout-summary-items');
    
    summaryItems.innerHTML = this.cartItems.map(item => {
      const itemSub = parseFloat(item.price) * item.quantity;
      subtotal += itemSub;
      
      return `
        <div class="summary-item-row">
          <span class="summary-item-name">${item.name} (${item.variant_name}) x ${item.quantity}</span>
          <span class="summary-item-price">${itemSub.toFixed(2)} ฿</span>
        </div>
      `;
    }).join('');

    const taxAmount = subtotal * 0.07;
    const totalAmount = subtotal + taxAmount;

    document.getElementById('checkout-subtotal').innerText = `${subtotal.toFixed(2)} ฿`;
    document.getElementById('checkout-tax').innerText = `${taxAmount.toFixed(2)} ฿`;
    document.getElementById('checkout-total').innerText = `${totalAmount.toFixed(2)} ฿`;
  }

  selectAddress(addressId) {
    this.selectedAddressId = addressId;
    this.renderCheckout();
  }

  showAddAddressForm() {
    document.getElementById('add-address-form-wrapper').classList.remove('hidden');
  }

  hideAddAddressForm() {
    document.getElementById('add-address-form-wrapper').classList.add('hidden');
    this.clearAddressForm();
  }

  clearAddressForm() {
    document.getElementById('address-receiver').value = '';
    document.getElementById('address-phone').value = '';
    document.getElementById('address-detail').value = '';
    document.getElementById('address-subdistrict').value = '';
    document.getElementById('address-district').value = '';
    document.getElementById('address-province').value = '';
    document.getElementById('address-postal').value = '';
  }

  async submitNewAddress() {
    const receiver_name = document.getElementById('address-receiver').value;
    const phone = document.getElementById('address-phone').value;
    const address_detail = document.getElementById('address-detail').value;
    const sub_district = document.getElementById('address-subdistrict').value;
    const district = document.getElementById('address-district').value;
    const province = document.getElementById('address-province').value;
    const postal_code = document.getElementById('address-postal').value;
    const is_default = document.getElementById('address-default').checked;

    if (!receiver_name || !phone || !address_detail || !sub_district || !district || !province || !postal_code) {
      this.showToast('กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน', 'error');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      this.showToast('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น', 'error');
      return;
    }

    try {
      const res = await this.apiRequest('/api/v1/addresses', 'POST', {
        receiver_name, phone, address_detail, sub_district, district, province, postal_code, is_default
      });

      this.showToast('บันทึกที่อยู่จัดส่งสำเร็จ');
      this.selectedAddressId = res.data.id;
      this.hideAddAddressForm();
      await this.loadAddresses();
      this.renderCheckout();
    } catch (err) {
      this.showToast(err.message || 'บันทึกที่อยู่ไม่สำเร็จ', 'error');
    }
  }

  switchPaymentTab(method) {
    this.selectedPaymentMethod = method;
    
    // update tab class
    document.querySelectorAll('.pay-tab').forEach(el => el.classList.remove('active'));
    document.getElementById(`pay-tab-${method}`).classList.add('active');
    
    // update content
    document.querySelectorAll('.pay-panel').forEach(el => el.classList.remove('active'));
    document.getElementById(`pay-content-${method}`).classList.add('active');
  }

  // --- SUBMIT ORDER & PAYMENT PROCESS ---
  async submitOrder() {
    if (!this.selectedAddressId) {
      this.showToast('กรุณาเลือกที่อยู่จัดส่งของคุณก่อนยืนยันสั่งซื้อ', 'error');
      return;
    }

    try {
      const res = await this.apiRequest('/api/v1/orders', 'POST', {
        address_id: this.selectedAddressId
      });
      
      this.currentOrder = res.data; // { id, total_price, ... }
      this.showToast('สร้างคำสั่งซื้อเรียบร้อย! กรุณาดำเนินการชำระเงิน', 'success');
      
      // Refresh user cart
      await this.loadCart();
      
      // Proceed to Payment gateway tab
      this.activeTab = 'payment';
      document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
      document.getElementById('tab-payment').classList.add('active');

      document.getElementById('payment-order-id').innerText = this.currentOrder.id;

      // Handle payment views
      if (this.selectedPaymentMethod === 'qr') {
        document.getElementById('payment-qr-side').style.display = 'flex';
        document.getElementById('payment-standard-side').style.display = 'none';
        
        // Toggle Panels
        document.getElementById('panel-manual-upload').classList.add('hidden');
        const qrPanel = document.getElementById('panel-qr-automation');
        qrPanel.classList.remove('hidden');
        
        // Reset QR panel status states
        document.getElementById('qr-status-spinner').style.display = 'block';
        const statusTitle = document.getElementById('qr-status-title');
        statusTitle.innerText = 'กำลังรอสแกนชำระเงิน...';
        statusTitle.style.color = 'var(--primary-color)';
        document.getElementById('qr-verified-success-box').classList.add('hidden');

        this.generatePromptPayQR();
        this.startPaymentPolling(this.currentOrder.id);
      } else {
        document.getElementById('payment-qr-side').style.display = 'none';
        document.getElementById('payment-standard-side').style.display = 'flex';
        
        // Toggle Panels
        document.getElementById('panel-manual-upload').classList.remove('hidden');
        document.getElementById('panel-qr-automation').classList.add('hidden');
        
        let title = 'ธนาคารกสิกรไทย';
        let accNo = '012-3-45678-9';
        let accName = 'บจก. เทอรา สมาร์ท อีคอมเมิร์ซ';
        if (this.selectedPaymentMethod === 'wallet') {
          title = 'ทรูมันนี่ วอเล็ต (TrueMoney Wallet)';
          accNo = '089-999-9999';
          accName = 'TeraSmart Merchant Service';
        }
        document.getElementById('payment-standard-title').innerText = title;
        document.getElementById('payment-standard-no').innerText = accNo;
        document.getElementById('payment-standard-name').innerText = accName;
        document.getElementById('payment-standard-amount').innerText = parseFloat(this.currentOrder.total_price).toFixed(2);
        
        // Disable countdown for standard bankโอน
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        document.getElementById('payment-timer').innerText = '--:--';
      }

      this.clearSlipSelection(null);
      // Reset OCR status
      document.getElementById('ai-verified-box').classList.add('hidden');

    } catch (err) {
      this.showToast(err.message || 'ไม่สามารถสั่งซื้อได้', 'error');
    }
  }

  // Generate dynamic PromptPay QR payload and start countdown
  async generatePromptPayQR() {
    try {
      const res = await this.apiRequest(`/api/v1/payments/${this.currentOrder.id}/qr`, 'POST');
      const payload = res.data;
      
      // Display total
      document.getElementById('qr-total-amount').innerText = parseFloat(payload.amount).toFixed(2);
      
      // Generate QR Code simulation (simple canvas image)
      const qrCanvas = document.getElementById('qr-code-canvas');
      // Set to a standard simulated visual PromptPay QR Code
      qrCanvas.innerHTML = `
        <div style="width: 150px; height: 150px; background-color: #0b0c10; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 4px solid #007bc3; padding: 5px;">
          <div style="background-color: #fff; width: 100%; height: 100%; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; padding: 2px;">
            <!-- Dummy grid simulating QR blocks -->
            <div style="background-color:#000; grid-column:span 2; grid-row:span 2;"></div>
            <div style="background-color:#fff;"></div>
            <div style="background-color:#000;"></div>
            <div style="background-color:#fff;"></div>
            <div style="background-color:#000;"></div>
            <div style="background-color:#fff;"></div>
            <div style="background-color:#000; grid-column:span 2; grid-row:span 2;"></div>
            <div style="background-color:#000;"></div>
            <div style="background-color:#fff;"></div>
            <div style="background-color:#000;"></div>
            <div style="background-color:#fff;"></div>
            <div style="background-color:#000;"></div>
            <div style="background-color:#fff;"></div>
            <div style="background-color:#000;"></div>
            <div style="background-color:#fff;"></div>
            <div style="background-color:#000;"></div>
          </div>
        </div>
      `;

      // Start countdown of 5 minutes (300 seconds)
      const expiryTime = new Date(payload.expires_at).getTime();
      this.startQRCountdown(expiryTime);
    } catch (err) {
      console.error(err);
      this.showToast('ไม่สามารถสร้าง QR Code ได้', 'error');
    }
  }

  startQRCountdown(expiryTime) {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    
    const display = document.getElementById('payment-timer');
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = expiryTime - now;
      
      if (distance <= 0) {
        clearInterval(this.countdownTimer);
        display.innerText = 'EXPIRED';
        display.style.color = 'var(--error-color)';
        this.showToast('QR Code หมดอายุแล้ว กรุณายกเลิกและสั่งซื้อใหม่', 'error');
        document.getElementById('submit-slip-btn').disabled = true;
        return;
      }
      
      display.style.color = 'var(--primary-color)';
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      display.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    updateTimer();
    this.countdownTimer = setInterval(updateTimer, 1000);
  }

  handleSlipFileSelect(e) {
    const files = e.target.files;
    if (files.length === 0) return;

    this.slipFile = files[0];
    
    // Update preview UI
    const previewContainer = document.getElementById('slip-preview-container');
    const previewImg = document.getElementById('slip-preview-img');
    const filenameLabel = document.getElementById('slip-filename');
    
    filenameLabel.innerText = this.slipFile.name;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      previewImg.src = event.target.result;
      previewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(this.slipFile);
    
    document.getElementById('submit-slip-btn').disabled = false;
    document.getElementById('upload-status-text').innerText = 'เลือกไฟล์สลิปแล้ว';
  }

  clearSlipSelection(e) {
    if (e) e.stopPropagation();
    
    this.slipFile = null;
    document.getElementById('slip-file-input').value = '';
    document.getElementById('slip-preview-container').classList.add('hidden');
    document.getElementById('submit-slip-btn').disabled = true;
    document.getElementById('upload-status-text').innerText = 'คลิก หรือ ลากสลิปมาวางที่นี่';
  }

  async uploadSlip() {
    if (!this.slipFile || !this.currentOrder) return;

    const btn = document.getElementById('submit-slip-btn');
    const loader = document.getElementById('payment-loading');
    const aiBox = document.getElementById('ai-verified-box');
    
    btn.disabled = true;
    loader.classList.remove('hidden');
    aiBox.classList.add('hidden');

    try {
      const formData = new FormData();
      formData.append('slip', this.slipFile);

      // Simulate a small delay (1.5 seconds) to make the AI OCR processing look realistic
      await new Promise(resolve => setTimeout(resolve, 1500));

      const res = await this.apiRequest(
        `/api/v1/payments/${this.currentOrder.id}/upload`, 
        'POST', 
        formData, 
        true
      );

      loader.classList.add('hidden');
      
      // Stop countdown timer
      if (this.countdownTimer) clearInterval(this.countdownTimer);

      // Show AI Verified confirmation card (green box)
      document.getElementById('ai-verified-amount').innerText = `${parseFloat(res.data.ai_verified_amount).toFixed(2)} ฿`;
      
      const verifiedTime = new Date(res.data.ai_verified_datetime);
      document.getElementById('ai-verified-time').innerText = verifiedTime.toLocaleString('th-TH');
      
      aiBox.classList.remove('hidden');
      this.showToast('ชำระเงินสำเร็จแล้ว! ระบบ AI ตรวจสลิปถูกต้อง');

      // Auto-redirect to order history profile page in 4 seconds
      setTimeout(() => {
        this.switchTab('profile');
      }, 4000);

    } catch (err) {
      loader.classList.add('hidden');
      btn.disabled = false;
      this.showToast(err.message || 'ตรวจสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', 'error');
    }
  }

  // --- ORDER HISTORY TRACKING ---
  async loadMyOrders() {
    const list = document.getElementById('profile-orders-list');
    try {
      const res = await this.apiRequest('/api/v1/orders');
      const orders = res.data;
      
      if (orders.length === 0) {
        list.innerHTML = `
          <div style="text-align:center; padding:20px; color:var(--text-muted); font-size:0.9rem;">
            คุณยังไม่มีประวัติการสั่งซื้อสินค้า
          </div>
        `;
        return;
      }

      list.innerHTML = orders.map(o => {
        const orderDate = new Date(o.created_at).toLocaleString('th-TH');
        
        // Status mapping to Stepper Steps:
        // pending: Step 1 (Pending) active
        // paid: Step 2 (Paid) completed
        // shipping: Step 3 (Shipping) completed (if shipped)
        // delivered: Step 4 (Delivered) completed
        let step1Class = '';
        let step2Class = '';
        let step3Class = '';
        let step4Class = '';

        if (o.status === 'pending') {
          step1Class = 'active';
        } else if (o.status === 'paid') {
          step1Class = 'completed';
          step2Class = 'completed';
          step3Class = 'active';
        } else if (o.status === 'shipping') {
          step1Class = 'completed';
          step2Class = 'completed';
          step3Class = 'completed';
          step4Class = 'active';
        } else if (o.status === 'delivered') {
          step1Class = 'completed';
          step2Class = 'completed';
          step3Class = 'completed';
          step4Class = 'completed';
        }

        // Custom display states
        const isPending = o.status === 'pending';
        const isShipping = o.status === 'shipping';
        const isDelivered = o.status === 'delivered';

        return `
          <div class="order-history-card">
            <div class="order-card-header">
              <span class="order-id-label">คำสั่งซื้อ: ${o.id.substring(0, 8)}...</span>
              <span class="order-date-label">${orderDate}</span>
            </div>
            <div class="order-card-body">
              <div class="order-item-summary">
                <span>ยอดเงินสั่งซื้อ:</span>
                <strong>${parseFloat(o.total_price).toFixed(2)} ฿</strong>
              </div>
              <div class="order-item-summary">
                <span>ช่องทางจ่ายเงิน:</span>
                <span>${o.payment_method === 'promptpay' ? 'พร้อมเพย์ QR Code' : (o.payment_method === 'wallet' ? 'TrueMoney Wallet' : 'โอนบัญชีธนาคาร')}</span>
              </div>
            </div>

            <!-- Stepper timeline component -->
            <div class="timeline-wrapper">
              <div class="stepper">
                <div class="stepper-step ${step1Class}">
                  <div class="step-circle">1</div>
                  <span class="step-label">รอชำระเงิน</span>
                </div>
                <div class="stepper-step ${step2Class}">
                  <div class="step-circle">2</div>
                  <span class="step-label">ชำระเงินแล้ว</span>
                </div>
                <div class="stepper-step ${step3Class}">
                  <div class="step-circle">3</div>
                  <span class="step-label">กำลังจัดส่ง</span>
                </div>
                <div class="stepper-step ${step4Class}">
                  <div class="step-circle">4</div>
                  <span class="step-label">จัดส่งสำเร็จ</span>
                </div>
              </div>
            </div>

            <!-- Shipping information panel (Visible when shipping/delivered) -->
            ${(isShipping || isDelivered) && o.tracking_number ? `
              <div class="shipping-info-box">
                <div>
                  <span style="color:var(--text-muted); display:block; font-size:0.75rem;">ผู้บริการจัดส่ง</span>
                  <strong>${o.courier_name}</strong>
                </div>
                <div class="tracking-number-wrapper">
                  <div>
                    <span style="color:var(--text-muted); display:block; font-size:0.75rem; text-align:right;">เลขพัสดุ</span>
                    <strong style="color:var(--primary-color);">${o.tracking_number}</strong>
                  </div>
                  <button class="copy-btn" onclick="app.copyToClipboard('${o.tracking_number}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    คัดลอก
                  </button>
                </div>
              </div>

              <!-- Live Courier Checkpoints simulation log -->
              <div class="live-tracking-panel" style="margin-top: 15px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px;">
                <h4 style="margin-top: 0; margin-bottom: 12px; font-size: 0.85rem; color: var(--text-main); display: flex; align-items: center; gap: 6px;">
                  <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background-color:${isDelivered ? 'var(--success-color)' : 'var(--primary-color)'};"></span>
                  สถานะการจัดส่งเรียลไทม์ (${o.courier_name})
                </h4>

                <div class="tracking-timeline-vertical" style="display:flex; flex-direction:column; gap:15px; position:relative; padding-left:20px; border-left:1px dashed var(--border-color); margin-left:10px;">
                  ${isDelivered ? `
                    <div class="tracking-node" style="position:relative;">
                      <span style="position:absolute; left:-25px; top:4px; width:9px; height:9px; border-radius:50%; background-color:var(--success-color);"></span>
                      <strong style="font-size:0.8rem; color:var(--success-color);">จัดส่งพัสดุสำเร็จ (Delivered)</strong>
                      <p style="margin:2px 0 0 0; font-size:0.75rem; color:var(--text-muted);">พัสดุถูกเซ็นรับโดยคุณสมชาย (เจ้าบ้าน) เรียบร้อยแล้ว</p>
                      <span style="font-size:0.65rem; color:var(--text-muted); display:block; margin-top:2px;">13:10 น.</span>
                    </div>
                  ` : ''}

                  <div class="tracking-node" style="position:relative;">
                    <span style="position:absolute; left:-25px; top:4px; width:9px; height:9px; border-radius:50%; background-color:${isShipping ? 'var(--primary-color)' : 'var(--success-color)'};"></span>
                    <strong style="font-size:0.8rem; color:${isShipping ? 'var(--primary-color)' : 'var(--text-main)'};">พนักงานกำลังนำจ่ายพัสดุ (Out for Delivery)</strong>
                    <p style="margin:2px 0 0 0; font-size:0.75rem; color:var(--text-muted);">พนักงานขนส่งกำลังเดินทางไปส่งพัสดุให้คุณ</p>
                    
                    <!-- Courier Driver Card -->
                    <div class="courier-driver-card" style="margin-top:8px; display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.15); padding:8px; border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
                      <div style="width:30px; height:30px; border-radius:50%; background:var(--primary-color); color:#fff; display:flex; justify-content:center; align-items:center; font-size:0.8rem; font-weight:700;">🛵</div>
                      <div style="flex-grow:1;">
                        <span style="display:block; font-size:0.7rem; color:var(--text-muted); line-height:1.2;">พนักงานนำจ่าย</span>
                        <strong style="font-size:0.75rem; color:var(--text-main); line-height:1.2; display:block;">คุณสมศักดิ์ รักดี (Somsak)</strong>
                        <span style="display:block; font-size:0.65rem; color:var(--text-muted); line-height:1.2;">ทะเบียน: กข-1234 กทม.</span>
                      </div>
                      <a href="tel:0891234567" class="btn btn-primary btn-sm btn-auto" style="padding:4px 8px; font-size:0.65rem; text-decoration:none; display:inline-flex; align-items:center; gap:3px; width:auto; border-radius:4px; box-shadow:none;">
                        📞 โทรหา
                      </a>
                    </div>
                    <span style="font-size:0.65rem; color:var(--text-muted); display:block; margin-top:2px;">11:45 น.</span>
                  </div>

                  <div class="tracking-node" style="position:relative;">
                    <span style="position:absolute; left:-25px; top:4px; width:9px; height:9px; border-radius:50%; background-color:var(--success-color);"></span>
                    <strong style="font-size:0.8rem; color:var(--text-main);">พัสดุถึงศูนย์กระจายสินค้าปลายทาง (In Sorting Hub)</strong>
                    <p style="margin:2px 0 0 0; font-size:0.75rem; color:var(--text-muted);">พัสดุถึงคลังศูนย์แยกสินค้าบางนา-ตราด รอคัดแยกจ่ายรถมอเตอร์ไซค์</p>
                    <span style="font-size:0.65rem; color:var(--text-muted); display:block; margin-top:2px;">08:30 น.</span>
                  </div>

                  <div class="tracking-node" style="position:relative;">
                    <span style="position:absolute; left:-25px; top:4px; width:9px; height:9px; border-radius:50%; background-color:var(--success-color);"></span>
                    <strong style="font-size:0.8rem; color:var(--text-main);">ผู้จัดส่งต้นทางเข้ารับพัสดุสำเร็จ (Picked Up)</strong>
                    <p style="margin:2px 0 0 0; font-size:0.75rem; color:var(--text-muted);">คลังสินค้า TeraSmart สมุทรปราการ ส่งมอบพัสดุให้ขนส่งต้นทางเรียบร้อย</p>
                    <span style="font-size:0.65rem; color:var(--text-muted); display:block; margin-top:2px;">เมื่อวานนี้ 15:40 น.</span>
                  </div>
                </div>
              </div>
            ` : ''}

            ${isPending ? `
              <div class="pay-pending-alert">
                <span>คุณยังไม่ได้แนบสลิปชำระเงินของรายการนี้</span>
                <button class="btn btn-primary btn-sm" onclick="app.payPendingOrder('${o.id}', '${o.total_price}', '${o.payment_method || 'bank'}')">
                  ชำระเงินตอนนี้
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

    } catch (err) {
      list.innerHTML = `<div style="text-align:center; padding:20px; color:var(--error-color);">ไม่สามารถโหลดข้อมูลได้</div>`;
    }
  }

  payPendingOrder(orderId, totalVal, paymentMethod) {
    this.currentOrder = { id: orderId, total_price: totalVal };
    this.selectedPaymentMethod = paymentMethod === 'pending' || !paymentMethod ? 'bank' : paymentMethod;
    
    // Switch to payment tab
    this.activeTab = 'payment';
    document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-payment').classList.add('active');

    document.getElementById('payment-order-id').innerText = orderId;

    if (this.selectedPaymentMethod === 'qr') {
      document.getElementById('payment-qr-side').style.display = 'flex';
      document.getElementById('payment-standard-side').style.display = 'none';
      
      // Toggle Panels
      document.getElementById('panel-manual-upload').classList.add('hidden');
      const qrPanel = document.getElementById('panel-qr-automation');
      qrPanel.classList.remove('hidden');
      
      // Reset QR panel status states
      document.getElementById('qr-status-spinner').style.display = 'block';
      const statusTitle = document.getElementById('qr-status-title');
      statusTitle.innerText = 'กำลังรอสแกนชำระเงิน...';
      statusTitle.style.color = 'var(--primary-color)';
      document.getElementById('qr-verified-success-box').classList.add('hidden');

      this.generatePromptPayQR();
      this.startPaymentPolling(orderId);
    } else {
      document.getElementById('payment-qr-side').style.display = 'none';
      document.getElementById('payment-standard-side').style.display = 'flex';
      
      // Toggle Panels
      document.getElementById('panel-manual-upload').classList.remove('hidden');
      document.getElementById('panel-qr-automation').classList.add('hidden');
      
      let title = 'ธนาคารกสิกรไทย';
      let accNo = '012-3-45678-9';
      let accName = 'บจก. เทอรา สมาร์ท อีคอมเมิร์ซ';
      if (this.selectedPaymentMethod === 'wallet') {
        title = 'ทรูมันนี่ วอเล็ต (TrueMoney Wallet)';
        accNo = '089-999-9999';
        accName = 'TeraSmart Merchant Service';
      }
      document.getElementById('payment-standard-title').innerText = title;
      document.getElementById('payment-standard-no').innerText = accNo;
      document.getElementById('payment-standard-name').innerText = accName;
      document.getElementById('payment-standard-amount').innerText = parseFloat(totalVal).toFixed(2);
      
      if (this.countdownTimer) clearInterval(this.countdownTimer);
      document.getElementById('payment-timer').innerText = '--:--';
    }

    this.clearSlipSelection(null);
    document.getElementById('ai-verified-box').classList.add('hidden');
  }

  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('คัดลอกหมายเลขพัสดุลงคลิปบอร์ดแล้ว');
    }).catch(err => {
      this.showToast('ไม่สามารถคัดลอกได้', 'error');
    });
  }

  // เริ่มระบบ Polling ตรวจสอบสถานะการโอนเงินอัตโนมัติ
  startPaymentPolling(orderId) {
    if (this.paymentPollingInterval) clearInterval(this.paymentPollingInterval);
    
    this.paymentPollingInterval = setInterval(async () => {
      try {
        const res = await this.apiRequest(`/api/v1/orders/${orderId}`);
        const order = res.data;
        
        if (order.status === 'paid') {
          // เคลียร์ Interval และ Timer นับถอยหลัง
          clearInterval(this.paymentPollingInterval);
          this.paymentPollingInterval = null;
          if (this.countdownTimer) clearInterval(this.countdownTimer);
          
          // ปรับปรุงผลลัพธ์หน้าจอชำระเงินอัตโนมัติ
          document.getElementById('qr-status-spinner').style.display = 'none';
          const statusTitle = document.getElementById('qr-status-title');
          statusTitle.innerText = 'ชำระเงินสำเร็จแล้ว (Payment Success!)';
          statusTitle.style.color = 'var(--success-color)';
          
          // แสดงการ์ดสีเขียว ยืนยันธนาคาร
          document.getElementById('qr-verified-amount').innerText = `${parseFloat(order.total_price).toFixed(2)} ฿`;
          document.getElementById('qr-verified-time').innerText = new Date().toLocaleString('th-TH');
          document.getElementById('qr-verified-success-box').classList.remove('hidden');
          
          this.showToast('ชำระเงินสำเร็จผ่านพร้อมเพย์! ระบบอนุมัติคำสั่งซื้อเรียบร้อย', 'success');
          
          // เปลี่ยนหน้าไปที่แท็บประวัติใน 3 วินาที
          setTimeout(() => {
            this.switchTab('profile');
          }, 3000);
        }
      } catch (err) {
        // เงียบไว้เมื่อเกิดข้อผิดพลาดในการเชื่อมต่อเครือข่ายระหว่างรอ
        console.error('Polling error:', err);
      }
    }, 2000);
  }

  // ฟังก์ชันช่วยแอดมินหรือผู้ทดสอบในการกดจำลองจ่ายเงิน (Simulation Callback Webhook)
  async simulateIncomingPayment() {
    if (!this.currentOrder) return;
    try {
      await this.apiRequest(`/api/v1/payments/${this.currentOrder.id}/simulate-webhook`, 'POST');
      this.showToast('จำลองส่งยอดเงินโอนเข้าพร้อมเพย์สำเร็จ...');
    } catch (err) {
      this.showToast(err.message || 'ไม่สามารถจำลองการโอนได้', 'error');
    }
  }

  // --- PASSWORD RECOVERY FLOWS ---
  showForgotPassword(e) {
    if (e) e.preventDefault();
    this.switchAuthForm('forgot');
    const devBox = document.getElementById('auth-dev-notification');
    if (devBox) devBox.classList.add('hidden');
    setTimeout(() => {
      this.setRecoveryType('email');
    }, 100);
  }

  setRecoveryType(type) {
    this.recoveryType = type;
    const emailGroup = document.getElementById('recovery-email-group');
    const phoneGroup = document.getElementById('recovery-phone-group');
    const emailInput = document.getElementById('forgot-email');
    const phoneInput = document.getElementById('forgot-phone');
    const emailBtn = document.getElementById('recovery-type-email-btn');
    const phoneBtn = document.getElementById('recovery-type-phone-btn');

    if (type === 'email') {
      if (emailGroup) emailGroup.classList.remove('hidden');
      if (phoneGroup) phoneGroup.classList.add('hidden');
      if (emailInput) emailInput.required = true;
      if (phoneInput) phoneInput.required = false;
      if (emailInput) emailInput.value = '';
      
      if (emailBtn) {
        emailBtn.style.backgroundColor = 'var(--primary-color)';
        emailBtn.style.color = '#fff';
      }
      if (phoneBtn) {
        phoneBtn.style.backgroundColor = 'rgba(255,255,255,0.05)';
        phoneBtn.style.color = 'var(--text-muted)';
      }
    } else {
      if (emailGroup) emailGroup.classList.add('hidden');
      if (phoneGroup) phoneGroup.classList.remove('hidden');
      if (emailInput) emailInput.required = false;
      if (phoneInput) phoneInput.required = true;
      if (phoneInput) phoneInput.value = '';

      if (phoneBtn) {
        phoneBtn.style.backgroundColor = 'var(--primary-color)';
        phoneBtn.style.color = '#fff';
      }
      if (emailBtn) {
        emailBtn.style.backgroundColor = 'rgba(255,255,255,0.05)';
        emailBtn.style.color = 'var(--text-muted)';
      }
    }
  }

  async handleForgotPassword(e) {
    if (e) e.preventDefault();
    const type = this.recoveryType || 'email';
    const value = type === 'email' 
      ? document.getElementById('forgot-email').value 
      : document.getElementById('forgot-phone').value;

    try {
      const res = await this.apiRequest('/api/v1/auth/forgot-password', 'POST', { type, value });
      
      // Save matched email for reset password query
      this.resetEmail = res.data.email;
      
      // Render beautiful inline Dev Notification box
      const devBox = document.getElementById('auth-dev-notification');
      if (devBox) {
        devBox.innerHTML = `
          <div style="font-weight:700; color:var(--success-color); margin-bottom:4px; display:flex; align-items:center; gap:5px;">
            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background-color:var(--success-color);"></span>
            [ระบบจัดส่งรหัสยืนยันสำเร็จ]
          </div>
          <div>เราได้ส่งรหัสกู้คืน PIN 6 หลักไปยังช่องทางที่คุณเลือกแล้ว</div>
          <div style="font-size:0.72rem; color:var(--text-muted); margin-top:5px; line-height:1.4;">
            กรุณาเปิดตรวจสอบในกล่องข้อความอีเมล หรือข้อความ SMS ในโทรศัพท์มือถือของคุณ เพื่อนำรหัสมากรอกด้านล่างนี้
          </div>
        `;
        devBox.classList.remove('hidden');
      }
      
      this.switchAuthForm('reset');
    } catch (err) {
      this.showToast(err.message || 'ขอรับรหัสกู้คืนไม่สำเร็จ', 'error');
    }
  }

  async handleResetPassword(e) {
    if (e) e.preventDefault();
    const token = document.getElementById('reset-token').value;
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;

    if (newPassword !== confirmPassword) {
      this.showToast('ยืนยันรหัสผ่านใหม่ไม่ตรงกัน', 'error');
      return;
    }

    try {
      const res = await this.apiRequest('/api/v1/auth/reset-password', 'POST', {
        email: this.resetEmail,
        token: token,
        new_password: newPassword
      });
      this.showToast(res.message || 'กู้คืนและเปลี่ยนรหัสผ่านสำเร็จ!', 'success');
      this.switchAuthForm('login');
    } catch (err) {
      this.showToast(err.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ', 'error');
    }
  }

  // --- PROFILE EDITING FORM TENSION MODAL ---
  showEditProfileModal() {
    if (!this.user) return;
    
    // ตั้งค่าค่าเริ่มต้นในฟิลด์ข้อมูล
    document.getElementById('edit-username').value = this.user.username;
    document.getElementById('edit-phone').value = this.user.phone || '';
    
    // ตั้งค่ารูปโปรไฟล์เริ่มต้น
    const previewDiv = document.getElementById('edit-avatar-preview');
    if (this.user.profile_image) {
      previewDiv.innerHTML = `<img src="${this.user.profile_image}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
      previewDiv.innerHTML = this.user.username.charAt(0).toUpperCase();
    }
    document.getElementById('edit-avatar-filename').innerText = 'ยังไม่ได้เลือกรูปภาพ';
    document.getElementById('edit-avatar-file').value = '';

    // รีเซ็ตการแจ้งเตือน Validation สีแดง
    document.getElementById('group-edit-username').classList.remove('invalid');
    document.getElementById('group-edit-phone').classList.remove('invalid');
    document.getElementById('edit-profile-submit-btn').disabled = false;
    
    // เคลียร์ฟิลด์รหัสผ่าน
    document.getElementById('change-old-password').value = '';
    document.getElementById('change-new-password').value = '';
    document.getElementById('change-confirm-password').value = '';

    // แสดง Modal
    document.getElementById('edit-profile-modal').classList.add('active');
  }

  closeEditProfileModal() {
    document.getElementById('edit-profile-modal').classList.remove('active');
  }

  previewEditAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;

    // ตรวจสอบขนาดไฟล์ (2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.showToast('ขนาดไฟล์รูปภาพห้ามเกิน 2MB', 'error');
      e.target.value = '';
      return;
    }

    document.getElementById('edit-avatar-filename').innerText = file.name;

    // เปิด Crop Modal แทน preview ตรงๆ
    const reader = new FileReader();
    reader.onload = (evt) => {
      this._openCropModal(evt.target.result, file.name);
    };
    reader.readAsDataURL(file);
  }

  _openCropModal(imageSrc, fileName) {
    this._cropFileName = fileName;
    const cropModal = document.getElementById('crop-modal');
    const cropImg = document.getElementById('crop-image-el');
    cropImg.src = imageSrc;
    cropModal.style.display = 'flex';

    // Load Cropper.js dynamically if not yet loaded
    if (!window.Cropper) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js';
      script.onload = () => this._initCropper(cropImg);
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css';
      document.head.appendChild(link);
    } else {
      this._initCropper(cropImg);
    }
  }

  _initCropper(imgEl) {
    if (this._cropper) { this._cropper.destroy(); this._cropper = null; }
    this._cropper = new Cropper(imgEl, {
      aspectRatio: 1,        // บังคับให้เป็นสี่เหลี่ยม 1:1 (พอดีกับกรอบวงกลม)
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.85,
      cropBoxResizable: true,
      background: false
    });
  }

  confirmCrop() {
    if (!this._cropper) return;
    this._cropper.getCroppedCanvas({ width: 300, height: 300 }).toBlob((blob) => {
      this._croppedBlob = blob;
      const url = URL.createObjectURL(blob);
      const previewDiv = document.getElementById('edit-avatar-preview');
      if (previewDiv) previewDiv.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
      this.cancelCrop();
      this.showToast('ปรับแต่งรูปเรียบร้อย! กดบันทึกรูปเพื่ออัปโหลด', 'success');
    }, 'image/jpeg', 0.9);
  }

  cancelCrop() {
    const cropModal = document.getElementById('crop-modal');
    if (cropModal) cropModal.style.display = 'none';
    if (this._cropper) { this._cropper.destroy(); this._cropper = null; }
  }

  async handleUpdateAvatar(e) {
    if (e) e.preventDefault();
    const fileInput = document.getElementById('edit-avatar-file');

    // ใช้ blob ที่ crop แล้ว หรือไฟล์ต้นฉบับ
    const fileToUpload = this._croppedBlob 
      ? new File([this._croppedBlob], this._cropFileName || 'avatar.jpg', { type: 'image/jpeg' })
      : (fileInput.files && fileInput.files[0]);

    if (!fileToUpload) {
      this.showToast('กรุณาเลือกไฟล์รูปภาพก่อนบันทึก', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', fileToUpload);

    try {
      const res = await this.apiRequest('/api/v1/auth/avatar', 'PUT', formData, true);
      this.showToast('อัปโหลดรูปภาพโปรไฟล์สำเร็จ!', 'success');
      this.user.profile_image = res.data.profile_image;
      localStorage.setItem('user', JSON.stringify(this.user));
      this._croppedBlob = null;
      this.renderProfile();
      this.updateAuthHeader();
      this.closeEditProfileModal();
    } catch (err) {
      this.showToast(err.message || 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้', 'error');
    }
  }

  validateEditUsername(e) {
    const input = e.target;
    const group = document.getElementById('group-edit-username');
    const regex = /^[a-zA-Z\u0e00-\u0e7f\s]*$/;
    
    if (/\d/.test(input.value) || !regex.test(input.value)) {
      group.classList.add('invalid');
      document.getElementById('edit-profile-submit-btn').disabled = true;
    } else {
      group.classList.remove('invalid');
      this.checkEditProfileFormValidity();
    }
  }

  validateEditPhone(e) {
    const input = e.target;
    const group = document.getElementById('group-edit-phone');
    
    if (!/^\d{10}$/.test(input.value)) {
      group.classList.add('invalid');
      document.getElementById('edit-profile-submit-btn').disabled = true;
    } else {
      group.classList.remove('invalid');
      this.checkEditProfileFormValidity();
    }
  }

  checkEditProfileFormValidity() {
    const userInvalid = document.getElementById('group-edit-username').classList.contains('invalid');
    const phoneInvalid = document.getElementById('group-edit-phone').classList.contains('invalid');
    document.getElementById('edit-profile-submit-btn').disabled = userInvalid || phoneInvalid;
  }

  async handleUpdateProfile(e) {
    if (e) e.preventDefault();
    const username = document.getElementById('edit-username').value;
    const phone = document.getElementById('edit-phone').value;

    try {
      const res = await this.apiRequest('/api/v1/auth/profile', 'PUT', { username, phone });
      this.showToast('อัปเดตข้อมูลทั่วไปสำเร็จ!', 'success');
      
      // อัปเดตข้อมูลผู้ใช้งานใน session
      this.user.username = res.data.username;
      this.user.phone = res.data.phone;
      
      // อัปเดตใน LocalStorage
      localStorage.setItem('user', JSON.stringify(this.user));
      
      // โหลดการแสดงผลใหม่
      this.renderProfile();
      this.updateAuthHeader();
      this.closeEditProfileModal();
    } catch (err) {
      this.showToast(err.message || 'ไม่สามารถอัปเดตข้อมูลได้', 'error');
    }
  }

  async handleChangePassword(e) {
    if (e) e.preventDefault();
    const oldPassword = document.getElementById('change-old-password').value;
    const newPassword = document.getElementById('change-new-password').value;
    const confirmPassword = document.getElementById('change-confirm-password').value;

    if (newPassword !== confirmPassword) {
      this.showToast('รหัสผ่านใหม่ไม่ตรงกัน', 'error');
      return;
    }

    try {
      const res = await this.apiRequest('/api/v1/auth/change-password', 'PUT', {
        old_password: oldPassword,
        new_password: newPassword
      });
      this.showToast(res.message || 'เปลี่ยนรหัสผ่านของคุณเรียบร้อยแล้ว!', 'success');
      
      // เคลียร์ข้อมูลรหัสผ่าน
      document.getElementById('change-old-password').value = '';
      document.getElementById('change-new-password').value = '';
      document.getElementById('change-confirm-password').value = '';
      this.closeEditProfileModal();
    } catch (err) {
      this.showToast(err.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้', 'error');
    }
  }

  // --- PROFILE SUB-TAB SWITCHING ---
  switchProfileTab(tabName) {
    document.querySelectorAll('.profile-subtab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.profile-subpanel').forEach(el => el.style.display = 'none');
    const tabBtn = document.getElementById(`ptab-${tabName}`);
    const panel = document.getElementById(`ppanel-${tabName}`);
    if (tabBtn) tabBtn.classList.add('active');
    if (panel) panel.style.display = 'block';
  }

  // --- PROFILE ADDRESS MANAGEMENT ---
  async loadProfileAddresses() {
    if (!this.token) return;
    try {
      const res = await this.apiRequest('/api/v1/addresses');
      this.addresses = res.data;
      this.renderProfileAddresses();
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  }

  renderProfileAddresses() {
    const list = document.getElementById('profile-address-list');
    if (!list) return;
    if (!this.addresses || this.addresses.length === 0) {
      list.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted); font-size:0.9rem;">ยังไม่มีที่อยู่จัดส่ง กด "+ เพิ่มที่อยู่ใหม่" เพื่อเพิ่มครับ</div>`;
      return;
    }
    list.innerHTML = this.addresses.map(a => `
      <div style="border:1px solid var(--border-color); border-radius:10px; padding:14px 16px; margin-bottom:10px; background:var(--bg-card);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-weight:600; font-size:0.95rem;">${a.receiver_name} <span style="font-weight:400; color:var(--text-muted); font-size:0.85rem;">| โทร: ${a.phone}</span>
              ${a.is_default ? '<span style="margin-left:8px; background:var(--primary-color); color:#fff; font-size:0.7rem; padding:2px 8px; border-radius:20px;">เริ่มต้น</span>' : ''}
            </div>
            <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px;">${a.address_detail} ต.${a.sub_district} อ.${a.district} จ.${a.province} ${a.postal_code}</div>
          </div>
          <div style="display:flex; gap:8px; flex-shrink:0; margin-left:10px;">
            ${!a.is_default ? `<button class="btn btn-secondary btn-sm" onclick="app.setDefaultProfileAddress(${a.id})">ตั้งเป็นหลัก</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="app.openAddressModal(${a.id})">แก้ไข</button>
            <button class="btn btn-sm" style="background:rgba(239,68,68,0.12); color:#ef4444; border:1px solid rgba(239,68,68,0.3);" onclick="app.deleteProfileAddress(${a.id})">ลบ</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  openAddressModal(addressId) {
    // สร้าง Modal แบบ Dynamic
    const existing = document.getElementById('address-edit-modal');
    if (existing) existing.remove();

    const addr = addressId ? this.addresses.find(a => a.id === addressId) : null;
    const modal = document.createElement('div');
    modal.id = 'address-edit-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
      <div style="background:var(--bg-card);border-radius:16px;padding:24px;width:min(480px,95vw);max-height:90vh;overflow-y:auto;">
        <h3 style="margin:0 0 16px; font-size:1rem;">${addr ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่'}</h3>
        <div class="form-group" style="margin-bottom:12px;"><label>ชื่อผู้รับ</label><input id="am-name" type="text" value="${addr ? addr.receiver_name : ''}" placeholder="ชื่อ-นามสกุลผู้รับ" style="margin-top:6px;"></div>
        <div class="form-group" style="margin-bottom:12px;"><label>เบอร์โทรศัพท์</label><input id="am-phone" type="text" maxlength="10" value="${addr ? addr.phone : ''}" placeholder="เช่น 0891234567" style="margin-top:6px;"></div>
        <div class="form-group" style="margin-bottom:12px;"><label>บ้านเลขที่ / ถนน / ซอย</label><textarea id="am-detail" rows="2" placeholder="เช่น 123/45 ถ.สุขุมวิท" style="margin-top:6px; padding:10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-input); color:var(--text-main); width:100%; resize:none;">${addr ? addr.address_detail : ''}</textarea></div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
          <div class="form-group"><label>ตำบล/แขวง</label><input id="am-sub" type="text" value="${addr ? addr.sub_district : ''}" placeholder="ตำบล/แขวง" style="margin-top:6px;"></div>
          <div class="form-group"><label>อำเภอ/เขต</label><input id="am-district" type="text" value="${addr ? addr.district : ''}" placeholder="อำเภอ/เขต" style="margin-top:6px;"></div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
          <div class="form-group"><label>จังหวัด</label><input id="am-province" type="text" value="${addr ? addr.province : ''}" placeholder="จังหวัด" style="margin-top:6px;"></div>
          <div class="form-group"><label>รหัสไปรษณีย์</label><input id="am-postal" type="text" maxlength="5" value="${addr ? addr.postal_code : ''}" placeholder="เช่น 10110" style="margin-top:6px;"></div>
        </div>
        <label style="display:flex; align-items:center; gap:8px; margin-bottom:16px; cursor:pointer; font-size:0.9rem;">
          <input type="checkbox" id="am-default" ${addr && addr.is_default ? 'checked' : ''}> ตั้งเป็นที่อยู่เริ่มต้น
        </label>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary" style="flex:1;" onclick="app.submitAddressModal(${addressId || 'null'})">บันทึก</button>
          <button class="btn btn-secondary" onclick="document.getElementById('address-edit-modal').remove()">ยกเลิก</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async submitAddressModal(addressId) {
    const receiver_name = document.getElementById('am-name').value.trim();
    const phone = document.getElementById('am-phone').value.trim();
    const address_detail = document.getElementById('am-detail').value.trim();
    const sub_district = document.getElementById('am-sub').value.trim();
    const district = document.getElementById('am-district').value.trim();
    const province = document.getElementById('am-province').value.trim();
    const postal_code = document.getElementById('am-postal').value.trim();
    const is_default = document.getElementById('am-default').checked;

    if (!receiver_name || !phone || !address_detail || !sub_district || !district || !province || !postal_code) {
      this.showToast('กรุณากรอกข้อมูลให้ครบทุกช่อง', 'error');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      this.showToast('เบอร์โทรศัพท์ต้องมี 10 หลักเท่านั้น', 'error');
      return;
    }

    const body = { receiver_name, phone, address_detail, sub_district, district, province, postal_code, is_default };
    try {
      if (addressId) {
        await this.apiRequest(`/api/v1/addresses/${addressId}`, 'PUT', body);
        this.showToast('แก้ไขที่อยู่สำเร็จ', 'success');
      } else {
        await this.apiRequest('/api/v1/addresses', 'POST', body);
        this.showToast('เพิ่มที่อยู่ใหม่สำเร็จ', 'success');
      }
      document.getElementById('address-edit-modal').remove();
      await this.loadProfileAddresses();
      await this.loadAddresses(); // sync checkout addresses too
    } catch (err) {
      this.showToast(err.message || 'บันทึกที่อยู่ไม่สำเร็จ', 'error');
    }
  }

  async deleteProfileAddress(addressId) {
    if (!confirm('ต้องการลบที่อยู่นี้ใช่หรือไม่?')) return;
    try {
      await this.apiRequest(`/api/v1/addresses/${addressId}`, 'DELETE');
      this.showToast('ลบที่อยู่สำเร็จ', 'success');
      await this.loadProfileAddresses();
    } catch (err) {
      this.showToast(err.message || 'ลบที่อยู่ไม่สำเร็จ', 'error');
    }
  }

  async setDefaultProfileAddress(addressId) {
    try {
      await this.apiRequest(`/api/v1/addresses/${addressId}/set-default`, 'PATCH');
      this.showToast('ตั้งที่อยู่เริ่มต้นสำเร็จ', 'success');
      await this.loadProfileAddresses();
    } catch (err) {
      this.showToast(err.message || 'ไม่สำเร็จ', 'error');
    }
  }

  // --- PROMPTPAY QR GENERATOR ---
  async generatePromptPayQR() {
    const amountInput = document.getElementById('qr-amount-input');
    const amount = parseFloat(amountInput ? amountInput.value : '');
    if (!amount || amount <= 0) {
      this.showToast('กรุณาระบุจำนวนเงินที่ถูกต้อง (มากกว่า 0)', 'error');
      return;
    }

    try {
      const res = await this.apiRequest(`/api/v1/payment-methods/promptpay-qr?amount=${amount}`);
      const { qr_image, promptpay_id, amount: amt } = res.data;

      const qrPanel = document.getElementById('qr-result-panel');
      document.getElementById('qr-result-img').src = qr_image;
      document.getElementById('qr-result-amount').innerText = `฿${parseFloat(amt).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
      document.getElementById('qr-result-id').innerText = `PromptPay: ${promptpay_id}`;
      qrPanel.style.display = 'block';
    } catch (err) {
      this.showToast(err.message || 'ไม่สามารถสร้าง QR ได้ กรุณาตรวจสอบการตั้งค่า PROMPTPAY_ID ใน .env', 'error');
    }
  }

  downloadQR() {
    const img = document.getElementById('qr-result-img');
    if (!img || !img.src) return;
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `terasmart-promptpay-qr-${Date.now()}.png`;
    a.click();
  }
}

// Instantiate App
const app = new TeraSmartApp();
window.onload = () => app.init();

