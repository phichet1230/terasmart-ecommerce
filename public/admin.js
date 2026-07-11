// TeraSmart Admin Dashboard Controller
class TeraSmartAdmin {
  constructor() {
    this.user = JSON.parse(localStorage.getItem('tera_user')) || null;
    this.token = localStorage.getItem('tera_token') || null;
    this.activeTab = 'dashboard';
    
    // Admin state
    this.orders = [];
    this.products = [];
    this.categories = [];
    this.customers = [];
    this.selectedOrderId = null; // For shipment modal
    this.selectedVariantId = null; // For variant stock edit modal
    this.activeFilters = {
      orderStatus: ''
    };
    
    // Chart instances
    this.dailyChartInstance = null;
    this.monthlyChartInstance = null;
  }

  init() {
    // 1. RBAC (Role-Based Access Control) Security Check
    if (!this.token || !this.user || this.user.role !== 'admin') {
      alert('เข้าถึงไม่ได้: พื้นที่นี้สงวนสิทธิ์สำหรับผู้ดูแลระบบ (Admin) เท่านั้น');
      window.location.href = '/';
      return;
    }

    this.updateAuthHeader();
    this.loadCategories();
    this.switchTab('dashboard');
  }

  // API Request Helper with authentication headers
  async apiRequest(url, method = 'GET', body = null) {
    const headers = {
      'Authorization': `Bearer ${this.token}`
    };
    
    let options = { method, headers };
    
    if (body) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert(data.message || 'ไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้');
        window.location.href = '/';
        throw new Error('Forbidden');
      }
      throw data;
    }
    return data;
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <span class="toast-close" onclick="this.parentNode.remove()">&times;</span>
    `;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
  }

  updateAuthHeader() {
    const area = document.getElementById('admin-header-status');
    area.innerHTML = `
      <span style="color:var(--text-muted)">แอดมิน:</span> 
      <strong style="color:var(--primary-color)">${this.user.username}</strong>
    `;
  }

  // --- NAVIGATION TAB SWITCHING ---
  switchTab(tabName) {
    this.activeTab = tabName;
    
    // Hide all tabs
    document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    // Show active tab
    const tabEl = document.getElementById(`admin-tab-${tabName}`);
    if (tabEl) tabEl.classList.add('active');
    
    const navEl = document.getElementById(`admin-nav-${tabName}`);
    if (navEl) navEl.classList.add('active');
    
    // Load data for specific tab
    if (tabName === 'dashboard') {
      this.loadDashboardMetrics();
    } else if (tabName === 'orders') {
      this.loadOrders();
    } else if (tabName === 'inventory') {
      this.loadInventory();
    } else if (tabName === 'customers') {
      this.loadCustomers();
    }
  }

  // --- DASHBOARD METRICS ---
  async loadDashboardMetrics() {
    try {
      const res = await this.apiRequest('/api/v1/admin/dashboard');
      const data = res.data;

      // Update stat cards
      document.getElementById('metric-total-sales').innerText = parseFloat(data.total_sales).toFixed(2);
      document.getElementById('metric-total-orders').innerText = data.total_orders;
      document.getElementById('metric-active-products').innerText = data.active_products;

      // Populate low stock warnings
      const warningsBody = document.getElementById('low-stock-warnings-table');
      if (data.low_stock_warnings.length === 0) {
        warningsBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center; color:var(--text-muted);">
              ไม่มีสินค้าในสต็อกที่ต่ำกว่าเกณฑ์แจ้งเตือน (ไม่มีสินค้าวิกฤต)
            </td>
          </tr>
        `;
      } else {
        warningsBody.innerHTML = data.low_stock_warnings.map(w => `
          <tr>
            <td><strong>${w.name}</strong></td>
            <td>${w.variant_name}</td>
            <td><code>${w.sku}</code></td>
            <td>${parseFloat(w.price).toFixed(2)} ฿</td>
            <td style="color:var(--error-color); font-weight:bold;">${w.stock_quantity} ชิ้น</td>
            <td>
              <span class="badge badge-suspended">ใกล้หมด</span>
            </td>
          </tr>
        `).join('');
      }

      // Render Charts
      this.renderCharts(data.daily_sales, data.monthly_sales);

    } catch (err) {
      console.error(err);
      this.showToast('ไม่สามารถโหลดข้อมูลแดชบอร์ดได้', 'error');
    }
  }

  renderCharts(dailySales, monthlySales) {
    // 1. Daily Sales Chart
    const dailyCtx = document.getElementById('sales-daily-chart').getContext('2d');
    const dailyLabels = dailySales.map(d => d.date);
    const dailyData = dailySales.map(d => parseFloat(d.total_sales));

    if (this.dailyChartInstance) {
      this.dailyChartInstance.destroy();
    }

    if (window.Chart) {
      this.dailyChartInstance = new Chart(dailyCtx, {
        type: 'line',
        data: {
          labels: dailyLabels.length > 0 ? dailyLabels : ['ไม่มีข้อมูล'],
          datasets: [{
            label: 'ยอดขายรายวัน (฿)',
            data: dailyData.length > 0 ? dailyData : [0],
            borderColor: '#ff3201',
            backgroundColor: 'rgba(255, 50, 1, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#fff' } } },
          scales: {
            x: { grid: { color: '#2d3748' }, ticks: { color: '#a0aec0' } },
            y: { grid: { color: '#2d3748' }, ticks: { color: '#a0aec0' } }
          }
        }
      });
    }

    // 2. Monthly Sales Chart
    const monthlyCtx = document.getElementById('sales-monthly-chart').getContext('2d');
    const monthlyLabels = monthlySales.map(m => m.month);
    const monthlyData = monthlySales.map(m => parseFloat(m.total_sales));

    if (this.monthlyChartInstance) {
      this.monthlyChartInstance.destroy();
    }

    if (window.Chart) {
      this.monthlyChartInstance = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
          labels: monthlyLabels.length > 0 ? monthlyLabels : ['ไม่มีข้อมูล'],
          datasets: [{
            label: 'ยอดขายรายเดือน (฿)',
            data: monthlyData.length > 0 ? monthlyData : [0],
            backgroundColor: '#4299e1',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#fff' } } },
          scales: {
            x: { grid: { color: '#2d3748' }, ticks: { color: '#a0aec0' } },
            y: { grid: { color: '#2d3748' }, ticks: { color: '#a0aec0' } }
          }
        }
      });
    }
  }

  // --- ORDERS MANAGEMENT ---
  async loadOrders() {
    try {
      const statusFilter = this.activeFilters.orderStatus;
      const url = statusFilter ? `/api/v1/admin/orders?status=${statusFilter}` : '/api/v1/admin/orders';
      const res = await this.apiRequest(url);
      this.orders = res.data;
      this.renderOrdersTable();
    } catch (err) {
      console.error(err);
      this.showToast('ไม่สามารถดึงข้อมูลออเดอร์ได้', 'error');
    }
  }

  handleOrderFilter() {
    this.activeFilters.orderStatus = document.getElementById('order-status-filter').value;
    this.loadOrders();
  }

  renderOrdersTable() {
    const tbody = document.getElementById('admin-orders-table');
    if (this.orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color:var(--text-muted);">
            ไม่พบรายการสั่งซื้อในสถานะนี้
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.orders.map(o => {
      const dateStr = new Date(o.created_at).toLocaleString('th-TH');
      const isPaid = o.status === 'paid';
      const isPending = o.status === 'pending';
      const isShipping = o.status === 'shipping';
      const isDelivered = o.status === 'delivered';
      
      let actionButtons = '';
      if (isPending) {
        actionButtons = `<button class="btn btn-primary btn-sm btn-auto" onclick="admin.updateStatus('${o.id}', 'paid')">กดยืนยันการรับเงิน</button>`;
      } else if (isPaid) {
        actionButtons = `<button class="btn btn-secondary btn-sm btn-auto" onclick="admin.openShipmentModal('${o.id}')">ดำเนินการส่งของ</button>`;
      } else if (isShipping) {
        actionButtons = `<button class="btn btn-primary btn-sm btn-auto" style="background-color:var(--success-color);" onclick="admin.updateStatus('${o.id}', 'delivered')">ส่งสำเร็จแล้ว</button>`;
      } else {
        actionButtons = `<span style="color:var(--text-muted)">สิ้นสุดรายการ</span>`;
      }

      // Check slip upload
      const slipCell = o.slip_url 
        ? `<span class="slip-link" onclick="admin.viewSlip('${o.slip_url}')">ดูรูปสลิป</span>`
        : `<span style="color:var(--text-muted); font-size:0.75rem;">ไม่มีสลิป</span>`;

      return `
        <tr>
          <td><strong>${o.id.substring(0, 8)}...</strong></td>
          <td>
            <div>${o.username}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${o.email}</div>
          </td>
          <td>${dateStr}</td>
          <td style="font-weight:700;">${parseFloat(o.total_price).toFixed(2)} ฿</td>
          <td>
            ${slipCell}<br>
            <span style="font-size:0.75rem; color:var(--text-muted);">${o.payment_method === 'promptpay' ? 'พร้อมเพย์ QR' : (o.payment_method === 'wallet' ? 'วอเล็ต' : 'โอนบัญชี')}</span>
          </td>
          <td>
            <span class="badge badge-${o.status}">${o.status}</span>
          </td>
          <td>
            <div class="action-btn-cell">
              ${actionButtons}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async updateStatus(orderId, nextStatus) {
    try {
      await this.apiRequest(`/api/v1/admin/orders/${orderId}/status`, 'PUT', { status: nextStatus });
      this.showToast('อัปเดตสถานะออเดอร์สำเร็จ');
      this.loadOrders();
    } catch (err) {
      this.showToast(err.message || 'ไม่สามารถอัปเดตสถานะได้', 'error');
    }
  }

  openShipmentModal(orderId) {
    this.selectedOrderId = orderId;
    document.getElementById('ship-tracking').value = '';
    document.getElementById('shipment-modal').classList.add('active');
  }

  closeShipmentModal() {
    document.getElementById('shipment-modal').classList.remove('active');
    this.selectedOrderId = null;
  }

  async submitShipment(e) {
    e.preventDefault();
    if (!this.selectedOrderId) return;
    
    const courier = document.getElementById('ship-courier').value;
    const tracking = document.getElementById('ship-tracking').value;

    try {
      await this.apiRequest(`/api/v1/admin/orders/${this.selectedOrderId}/status`, 'PUT', {
        status: 'shipping',
        courier_name: courier,
        tracking_number: tracking
      });

      this.showToast('อัปเดตการส่งพัสดุและแจ้งลูกค้าเรียบร้อย!');
      this.closeShipmentModal();
      this.loadOrders();
    } catch (err) {
      this.showToast(err.message || 'การบันทึกจัดส่งผิดพลาด', 'error');
    }
  }

  viewSlip(url) {
    document.getElementById('slip-preview-modal-img').src = url;
    document.getElementById('slip-preview-modal').classList.add('active');
  }

  closeSlipPreviewModal() {
    document.getElementById('slip-preview-modal').classList.remove('active');
  }

  // --- INVENTORY MANAGEMENT (CRUD) ---
  async loadInventory() {
    try {
      const res = await this.apiRequest('/api/v1/admin/products');
      this.products = res.data;
      this.renderInventoryTable();
    } catch (err) {
      console.error(err);
      this.showToast('ไม่สามารถโหลดข้อมูลคลังสินค้าได้', 'error');
    }
  }

  async loadCategories() {
    try {
      const res = await this.apiRequest('/api/v1/categories');
      this.categories = res.data;
      
      // Update categories in add product form
      const select = document.getElementById('prod-category');
      select.innerHTML = this.categories.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  }

  renderInventoryTable() {
    const tbody = document.getElementById('admin-products-table');
    if (this.products.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color:var(--text-muted);">
            ไม่มีรายการสินค้าในระบบ
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.products.map(p => {
      // List variants stock display
      const variantsListHtml = p.variants.map(v => {
        const isLow = v.stock_quantity <= 5;
        return `
          <div class="variant-stock-badge ${isLow ? 'low-stock' : ''}">
            <span>${v.variant_name} - SKU: <code>${v.sku}</code></span>
            <br>
            <span>ราคา: <strong>${parseFloat(v.price).toFixed(2)}</strong> | สต็อก: <strong style="text-decoration:underline; cursor:pointer; color:var(--primary-color)" onclick="admin.openEditVariantModal(${v.id}, '${v.variant_name}', '${v.sku}', ${v.price}, ${v.stock_quantity})">${v.stock_quantity} ชิ้น</strong></span>
          </div>
        `;
      }).join('');

      return `
        <tr>
          <td><strong>${p.id}</strong></td>
          <td>
            <div style="font-weight:700;">${p.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${p.short_description || ''}</div>
          </td>
          <td><code>${p.slug}</code></td>
          <td>${p.category_name || 'ทั่วไป'}</td>
          <td>
            ${variantsListHtml}
          </td>
          <td>
            <span class="badge badge-${p.is_active ? 'active' : 'suspended'}">${p.is_active ? 'เปิดขาย' : 'ปิดการขาย'}</span>
          </td>
          <td>
            <div class="action-btn-cell">
              <button class="btn btn-secondary btn-sm btn-auto" onclick="admin.toggleProductActive(${p.id}, ${p.is_active})">
                ${p.is_active ? 'ปิดขาย' : 'เปิดขาย'}
              </button>
              <button class="btn btn-primary btn-sm btn-auto" style="background-color:var(--error-color)" onclick="admin.deleteProduct(${p.id})">
                ลบสินค้า
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async toggleProductActive(productId, currentActive) {
    try {
      await this.apiRequest(`/api/v1/admin/products/${productId}`, 'PUT', {
        is_active: !currentActive
      });
      this.showToast('เปลี่ยนสถานะการจำหน่ายเรียบร้อย');
      this.loadInventory();
    } catch (err) {
      this.showToast('การทำงานล้มเหลว', 'error');
    }
  }

  async deleteProduct(productId) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้ออกจากคลัง? (ระบบจะลบแบบ Soft Delete เพื่อรักษาประวัติการสั่งซื้อย้อนหลัง)')) return;

    try {
      await this.apiRequest(`/api/v1/admin/products/${productId}`, 'DELETE');
      this.showToast('ลบสินค้าออกจากหน้าเว็บบอร์ดสำเร็จ (Soft Deleted)');
      this.loadInventory();
    } catch (err) {
      this.showToast(err.message || 'ลบสินค้าไม่สำเร็จ', 'error');
    }
  }

  showAddProductModal() {
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-slug').value = '';
    document.getElementById('prod-short-desc').value = '';
    document.getElementById('prod-desc').value = '';
    
    // Clear and add first variant row
    const container = document.getElementById('variants-form-rows');
    container.innerHTML = '';
    this.addVariantRow();
    
    document.getElementById('add-product-modal').classList.add('active');
  }

  closeAddProductModal() {
    document.getElementById('add-product-modal').classList.remove('active');
  }

  addVariantRow() {
    const container = document.getElementById('variants-form-rows');
    const index = container.children.length;
    
    const row = document.createElement('div');
    row.className = 'variant-form-row';
    row.id = `variant-row-${index}`;
    
    row.innerHTML = `
      <input type="text" class="var-name" placeholder="ชื่อตัวเลือก เช่น สีดำ 128GB" required>
      <input type="text" class="var-sku" placeholder="รหัส SKU เช่น TERA-BLK-128" required>
      <input type="number" class="var-price" placeholder="ราคา" step="0.01" min="0" required>
      <input type="number" class="var-stock" placeholder="สต็อก" min="0" required>
      <button type="button" class="remove-row-btn" onclick="admin.removeVariantRow(${index})">&times;</button>
    `;
    
    container.appendChild(row);
  }

  removeVariantRow(index) {
    const container = document.getElementById('variants-form-rows');
    if (container.children.length <= 1) {
      this.showToast('ต้องมีตัวเลือกสินค้า (Variant) อย่างน้อย 1 รายการ', 'error');
      return;
    }
    const row = document.getElementById(`variant-row-${index}`);
    if (row) row.remove();
  }

  async submitNewProduct(e) {
    e.preventDefault();

    const name = document.getElementById('prod-name').value;
    const slug = document.getElementById('prod-slug').value;
    const category_id = parseInt(document.getElementById('prod-category').value);
    const short_description = document.getElementById('prod-short-desc').value;
    const description = document.getElementById('prod-desc').value;

    // Collect variants
    const variantRows = document.querySelectorAll('.variant-form-row');
    const variants = [];
    
    variantRows.forEach(row => {
      variants.push({
        variant_name: row.querySelector('.var-name').value,
        sku: row.querySelector('.var-sku').value,
        price: parseFloat(row.querySelector('.var-price').value),
        stock_quantity: parseInt(row.querySelector('.var-stock').value)
      });
    });

    try {
      await this.apiRequest('/api/v1/admin/products', 'POST', {
        category_id, name, slug, short_description, description, variants
      });

      this.showToast('เพิ่มสินค้าใหม่ลงคลังสำเร็จ!');
      this.closeAddProductModal();
      this.loadInventory();
    } catch (err) {
      this.showToast(err.message || 'บันทึกสินค้าใหม่ไม่สำเร็จ', 'error');
    }
  }

  // Edit Variant Modal functions
  openEditVariantModal(variantId, name, sku, price, stock) {
    this.selectedVariantId = variantId;
    document.getElementById('edit-var-name').value = name;
    document.getElementById('edit-var-sku').value = sku;
    document.getElementById('edit-var-price').value = price;
    document.getElementById('edit-var-stock').value = stock;
    
    document.getElementById('edit-variant-modal').classList.add('active');
  }

  closeEditVariantModal() {
    document.getElementById('edit-variant-modal').classList.remove('active');
    this.selectedVariantId = null;
  }

  async submitEditVariant(e) {
    e.preventDefault();
    if (!this.selectedVariantId) return;

    const variant_name = document.getElementById('edit-var-name').value;
    const sku = document.getElementById('edit-var-sku').value;
    const price = parseFloat(document.getElementById('edit-var-price').value);
    const stock_quantity = parseInt(document.getElementById('edit-var-stock').value);

    try {
      await this.apiRequest(`/api/v1/admin/products/variants/${this.selectedVariantId}`, 'PUT', {
        variant_name, sku, price, stock_quantity
      });

      this.showToast('แก้ไขตัวเลือกสินค้าสำเร็จ');
      this.closeEditVariantModal();
      this.loadInventory();
    } catch (err) {
      this.showToast(err.message || 'แก้ไขล้มเหลว', 'error');
    }
  }

  // --- CUSTOMER MANAGEMENT ---
  async loadCustomers() {
    try {
      const res = await this.apiRequest('/api/v1/admin/customers');
      this.customers = res.data;
      this.renderCustomersTable();
    } catch (err) {
      console.error(err);
      this.showToast('ไม่สามารถดึงข้อมูลสมาชิกได้', 'error');
    }
  }

  renderCustomersTable() {
    const tbody = document.getElementById('admin-customers-table');
    if (this.customers.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center; color:var(--text-muted);">
            ไม่พบรายชื่อลูกค้าสมาชิกในฐานข้อมูล
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.customers.map(c => {
      const dateStr = new Date(c.created_at).toLocaleDateString('th-TH');
      const isActive = c.account_status === 'active';
      
      return `
        <tr>
          <td><code>${c.id.substring(0, 8)}...</code></td>
          <td><strong>${c.username}</strong></td>
          <td>${c.email}</td>
          <td>${c.phone || 'ไม่ระบุ'}</td>
          <td style="text-align:center;">
            <span class="slip-link" onclick="admin.viewCustomerOrders('${c.id}', '${c.username}')">${c.order_count} ครั้ง</span>
          </td>
          <td style="font-weight:700;">${parseFloat(c.total_spent).toFixed(2)} ฿</td>
          <td>${dateStr}</td>
          <td>
            <span class="badge badge-${isActive ? 'active' : 'suspended'}">
              ${isActive ? 'ใช้งานปกติ' : 'ระงับบัญชี'}
            </span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm btn-auto" onclick="admin.toggleBlockStatus('${c.id}', '${c.account_status}')">
              ${isActive ? 'ระงับการใช้งาน' : 'ยกเลิกระงับ'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async toggleBlockStatus(customerId, currentStatus) {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = nextStatus === 'suspended' 
      ? 'คุณต้องการระงับสิทธิ์การสั่งซื้อและการล็อกอินของลูกค้ารายนี้หรือไม่?' 
      : 'คุณต้องการเปิดให้ลูกค้ารายนี้กลับมาใช้งานปกติใช่ไหม?';
      
    if (!confirm(confirmMsg)) return;

    try {
      await this.apiRequest(`/api/v1/admin/customers/${customerId}/status`, 'PUT', {
        status: nextStatus
      });
      this.showToast('อัปเดตสิทธิ์การใช้งานบัญชีสำเร็จ');
      this.loadCustomers();
    } catch (err) {
      this.showToast(err.message || 'การดำเนินการล้มเหลว', 'error');
    }
  }

  async viewCustomerOrders(customerId, username) {
    document.getElementById('cust-orders-username').innerText = username;
    const body = document.getElementById('cust-orders-modal-body');
    body.innerHTML = '<div class="payment-loading"><div class="spinner"></div><span>กำลังโหลดประวัติออเดอร์...</span></div>';
    
    document.getElementById('customer-orders-modal').classList.add('active');

    try {
      const res = await this.apiRequest(`/api/v1/admin/customers/${customerId}/orders`);
      const orders = res.data;

      if (orders.length === 0) {
        body.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-muted);">ลูกค้าคนนี้ยังไม่เคยสั่งซื้อสินค้า</p>`;
        return;
      }

      body.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>รหัสออเดอร์</th>
              <th>วันที่สั่งซื้อ</th>
              <th>ยอดซื้อรวม</th>
              <th>สถานะจัดส่ง</th>
              <th>สถานะการเงิน</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td><strong>${o.id.substring(0, 8)}...</strong></td>
                <td>${new Date(o.created_at).toLocaleString('th-TH')}</td>
                <td>${parseFloat(o.total_price).toFixed(2)} ฿</td>
                <td><span class="badge badge-${o.status}">${o.status}</span></td>
                <td><strong>${o.tracking_number || 'ยังไม่มีพัสดุ'}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      body.innerHTML = `<p style="text-align:center; color:var(--error-color); padding:20px;">ไม่สามารถโหลดประวัติได้</p>`;
    }
  }

  closeCustomerOrdersModal() {
    document.getElementById('customer-orders-modal').classList.remove('active');
  }
}

// Instantiate Admin App
const admin = new TeraSmartAdmin();
window.onload = () => admin.init();
