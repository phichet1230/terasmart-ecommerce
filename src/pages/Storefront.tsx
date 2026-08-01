import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddressForm } from '../components/AddressForm';
import { 
  ShoppingBag, User, LogOut, CheckCircle, Clock, Trash2, 
  MapPin, CreditCard, X, Sparkles, ShieldCheck, Users, Headphones,
  Eye, EyeOff, Upload, Truck, Phone, Unlock, BarChart2, Key, RefreshCw, ShoppingCart, Search, ExternalLink,
  ChevronLeft, ChevronRight, Zap, Lock, Mail
} from 'lucide-react';

interface Variant {
  id: number;
  variant_name: string;
  sku: string;
  price: string;
  stock_quantity: number;
}

interface SpecItem {
  label: string;
  value: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  slug: string;
  image_url?: string;
  images?: string[];
  detail_image_1?: string;
  detail_image_2?: string;
  spec_headers?: string[];
  spec_table?: any[];
  advice_list?: string[];
  accessories_list?: any[];
  category_name: string;
  price: string;
  min_price?: string;
  max_price?: string;
  variants?: Variant[];
}

interface Category {
  id: number;
  name: string;
}

interface CartItem {
  cart_item_id: number;
  variant_id: number;
  product_id: number;
  name: string;
  slug: string;
  variant_name: string;
  price: string;
  quantity: number;
  stock_quantity: number;
  selected?: boolean;
  image_url?: string;
}

interface Address {
  id: number;
  province: string;
  district: string;
  subdistrict: string;
  postal_code: string;
  detail: string;
  phone: string;
  is_default: boolean;
  receiver_name?: string;
  address_detail?: string;
  sub_district?: string;
}

interface Order {
  id: string;
  username?: string;
  email?: string;
  total_price: string;
  status: string;
  created_at: string;
  coupon_code?: string | null;
  discount_amount?: string | null;
  payment_status?: string | null;
  slip_url?: string | null;
  transaction_ref?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  shipping_status?: string | null;
  shipping_updated_at?: string | null;
  items?: any[];
  shipping?: {
    courier_name: string;
    tracking_number: string;
    shipping_status: string;
    updated_at: string;
  };
}

export default function Storefront() {
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'cart' | 'checkout' | 'payment' | 'profile' | 'orders' | 'brands' | 'about'>('home');
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [profileSubTab, setProfileSubTab] = useState<'orders' | 'addresses'>('orders');

  // Authentication & Profile States loaded from LocalStorage
  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('tera_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  
  // Profile settings modal
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // SMS OTP Phone Binding States
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpAction, setOtpAction] = useState<'bind' | 'change' | 'unbind'>('bind');
  const [otpPhoneInput, setOtpPhoneInput] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpRefCode, setOtpRefCode] = useState('');
  const [otpDevCode, setOtpDevCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  // Forgot Password States
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Catalog States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [searchText, setSearchText] = useState('');
  const [isSearchCommitted, setIsSearchCommitted] = useState(false);
  const [priceRange, setPriceRange] = useState<number>(50000); 
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Figma Product Page Specs States
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedVoltage, setSelectedVoltage] = useState<string[]>([]);
  const [selectedPower, setSelectedPower] = useState<string[]>([]);
  const [selectedIpRating, setSelectedIpRating] = useState<string[]>([]);
  const [showFigmaSvgBlueprint, setShowFigmaSvgBlueprint] = useState(false);
  const [showMoreBrands, setShowMoreBrands] = useState(false);

  // Promotional Poster Carousel State (Connected dynamically to Admin Dashboard Banners)
  const [promoSlideIndex, setPromoSlideIndex] = useState(0);
  const [isPromoHovered, setIsPromoHovered] = useState(false);

  const defaultBannersList = [
    { id: 1, src: '/our_brands_all.png', title: 'Our Brand of product - Tera Group' },
    { id: 2, src: '/hero_banner_full.png', title: 'Industrial Automation & Inverter Solutions' },
    { id: 3, src: '/hero_machinery_showcase.png', title: 'VEICHI AC Drives & High Precision Servo Motors' },
    { id: 4, src: '/hero_machinery_showcase_alt.png', title: 'Solar Agricultural Inverters & Pumping Systems' }
  ];

  const [promoPosters, setPromoPosters] = useState<any[]>(() => {
    const saved = localStorage.getItem('tera_storefront_banners');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const activeOnly = parsed.filter((b: any) => b.active !== false);
        if (activeOnly.length > 0) return activeOnly;
      } catch (err) {
        console.error('Error parsing banners:', err);
      }
    }
    return defaultBannersList;
  });

  useEffect(() => {
    const handleBannerUpdate = () => {
      const saved = localStorage.getItem('tera_storefront_banners');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const activeOnly = parsed.filter((b: any) => b.active !== false);
          if (activeOnly.length > 0) {
            setPromoPosters(activeOnly);
            setPromoSlideIndex(0);
          }
        } catch (err) {
          console.error('Error parsing updated banners:', err);
        }
      }
    };

    const handleProductUpdate = () => {
      const saved = localStorage.getItem('tera_storefront_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
            setSelectedProduct((prev) => {
              if (!prev) return null;
              const found = parsed.find((p: any) => p.id === prev.id);
              return found || prev;
            });
          }
        } catch (err) {
          console.error('Error parsing updated products:', err);
        }
      }
    };

    handleProductUpdate();

    window.addEventListener('storage', handleBannerUpdate);
    window.addEventListener('tera_banners_updated', handleBannerUpdate);
    window.addEventListener('storage', handleProductUpdate);
    window.addEventListener('tera_products_updated', handleProductUpdate);
    return () => {
      window.removeEventListener('storage', handleBannerUpdate);
      window.removeEventListener('tera_banners_updated', handleBannerUpdate);
      window.removeEventListener('storage', handleProductUpdate);
      window.removeEventListener('tera_products_updated', handleProductUpdate);
    };
  }, []);

  useEffect(() => {
    if (isPromoHovered || promoPosters.length === 0) return;
    const timer = setInterval(() => {
      setPromoSlideIndex((prev) => (prev + 1) % promoPosters.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPromoHovered, promoPosters.length]);

  // Cart States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<any>(null);

  // Address States
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [isAddressDefault, setIsAddressDefault] = useState(false);
  const [newAddress, setNewAddress] = useState<any>({
    province: '', district: '', subdistrict: '', postalCode: '', detail: '', phone: ''
  });

  // Thai Address Cascading DB State
  const [thaiAddressDb, setThaiAddressDb] = useState<any[]>([]);

  useEffect(() => {
    fetch('/thailand_addresses.json')
      .then((res) => res.json())
      .then((data) => setThaiAddressDb(data))
      .catch((err) => console.error('Failed to load thailand addresses DB:', err));
  }, []);

  // Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // Cart Coupon States
  const [cartCouponInput, setCartCouponInput] = useState('');
  const [appliedCartDiscount, setAppliedCartDiscount] = useState<number>(0);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

  // Guest Order Tracking Search States
  const [searchOrderIdInput, setSearchOrderIdInput] = useState('');
  const [searchOrderResult, setSearchOrderResult] = useState<Order | null>(null);

  // Checkout States
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'bank' | 'wallet' | 'card'>('qr');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrExpireTimer, setQrExpireTimer] = useState<number | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [createdOrderTotal, setCreatedOrderTotal] = useState<number>(0);
  const [checkoutDirectItem, setCheckoutDirectItem] = useState<{variant: Variant, product: Product, qty: number} | null>(null);

  // Payments / Slips States
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [paymentStatusText, setPaymentStatusText] = useState('');
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [verifiedPaymentInfo, setVerifiedPaymentInfo] = useState<any>(null);

  // Orders History
  const [orders, setOrders] = useState<Order[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Order Cancellation States
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('ต้องการเปลี่ยนรายการสินค้า');
  const [cancelNote, setCancelNote] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Global Toasts
  const [toasts, setToasts] = useState<string[]>([]);

  // Init - Fetch details
  useEffect(() => {
    checkUserSession();
    fetchCategories();
    fetchProducts();
  }, []);

  // Fetch addresses & orders when user is verified
  useEffect(() => {
    if (user) {
      fetchCart();
      fetchAddresses();
      fetchOrders();
    } else {
      setCartItems([]);
      setAddresses([]);
      setOrders([]);
    }
  }, [user]);

  // QR Code Expiry Timer
  useEffect(() => {
    if (qrExpireTimer && qrExpireTimer > 0) {
      const timer = setTimeout(() => setQrExpireTimer(qrExpireTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [qrExpireTimer]);

  // Real-Time Payment Status Polling
  useEffect(() => {
    let interval: any;
    if (activeTab === 'payment' && createdOrderId && !verifiedPaymentInfo) {
      interval = setInterval(async () => {
        try {
          const res = await apiRequest(`/api/v1/payments/${createdOrderId}/check-status`);
          if (res.status === 'success' && res.paymentStatus === 'paid') {
            showToast('ได้รับการยืนยันการชำระเงินเรียบร้อยแล้ว!');
            setVerifiedPaymentInfo({
              ai_verified_amount: createdOrderTotal,
              ai_verified_datetime: new Date().toISOString()
            });
            fetchOrders(); // Refresh order history status
          }
        } catch (err) {
          console.error('Error checking payment status:', err);
        }
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, createdOrderId, verifiedPaymentInfo]);

  // Real-Time Orders Live Auto-Polling (Refreshes order status every 4 seconds)
  useEffect(() => {
    let interval: any;
    if (user) {
      interval = setInterval(() => {
        fetchOrders();
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const showToast = (msg: string) => {
    if (!msg) return;
    setToasts((prev) => {
      if (prev.includes(msg)) return prev;
      return [...prev, msg];
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((m) => m !== msg));
    }, 3000);
  };

  const apiRequest = async (url: string, method = 'GET', body?: any) => {
    const token = localStorage.getItem('tera_token');
    const options: any = { method, headers: {} };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    
    let response: Response;
    let targetUrl = url;
    try {
      response = await fetch(targetUrl, options);

      // If relative API call got 404 HTML, fallback directly to backend server on port 5000
      const ct = response.headers.get('content-type');
      if (response.status === 404 && targetUrl.startsWith('/api') && (!ct || !ct.includes('application/json'))) {
        try {
          const fallbackUrl = `http://localhost:5000${targetUrl}`;
          const fallbackRes = await fetch(fallbackUrl, options);
          if (fallbackRes.ok || fallbackRes.headers.get('content-type')?.includes('application/json')) {
            response = fallbackRes;
            targetUrl = fallbackUrl;
          }
        } catch (fbErr) {
          console.warn('Fallback fetch failed:', fbErr);
        }
      }
    } catch (err: any) {
      if (targetUrl.startsWith('/api')) {
        try {
          const fallbackUrl = `http://localhost:5000${targetUrl}`;
          response = await fetch(fallbackUrl, options);
          targetUrl = fallbackUrl;
        } catch (fbErr) {
          console.error('Fetch error for:', url, err);
          throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
        }
      } else {
        console.error('Fetch error for:', url, err);
        throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
      }
    }

    const isAuthRequest = targetUrl.includes('/api/v1/auth/login') || targetUrl.includes('/api/v1/auth/register');

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok || data.status === 'error') {
        if (response.status === 401 && !isAuthRequest) {
          localStorage.removeItem('tera_token');
          localStorage.removeItem('tera_user');
          setUser(null);
          throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
        }
        console.error('API Error Response:', targetUrl, response.status, data);
        throw new Error(data.message || `ไม่สามารถทำรายการได้ (รหัส: ${response.status})`);
      }
      return data;
    } else {
      if (response.status === 401 && !isAuthRequest) {
        localStorage.removeItem('tera_token');
        localStorage.removeItem('tera_user');
        setUser(null);
        throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
      }
      console.error('API Non-JSON Response:', targetUrl, response.status);
      if (response.status === 404) {
        throw new Error(`ไม่พบข้อมูลที่ต้องการในระบบ (${targetUrl})`);
      }
      throw new Error(`ระบบขัดข้องชั่วคราว (HTTP ${response.status})`);
    }
  };

  const checkUserSession = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get('token');
    const oauthUserStr = urlParams.get('user');

    if (oauthToken && oauthUserStr) {
      try {
        let oauthUser = null;
        try {
          oauthUser = JSON.parse(oauthUserStr);
        } catch {
          oauthUser = JSON.parse(decodeURIComponent(oauthUserStr));
        }

        if (oauthUser && oauthUser.id) {
          localStorage.setItem('tera_token', oauthToken);
          localStorage.setItem('tera_user', JSON.stringify(oauthUser));
          
          window.history.replaceState({}, document.title, window.location.pathname);
          showToast('เข้าสู่ระบบด้วยแพลตฟอร์มสำเร็จ ยินดีต้อนรับครับ!');
          
          setUser(oauthUser);
          setEditUsername(oauthUser.username);
          setEditPhone(oauthUser.phone || '');
          
          if (['admin', 'stock', 'accounting', 'shipping', 'sales', 'marketing'].includes(oauthUser.role)) {
            navigate('/admin');
          }
          return;
        }
      } catch (err) {
        console.error('Error parsing OAuth user data:', err);
      }
    }

    const token = localStorage.getItem('tera_token');
    const storedUser = localStorage.getItem('tera_user');
    if (token && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (['admin', 'stock', 'accounting', 'shipping', 'sales', 'marketing'].includes(parsed.role)) {
          navigate('/admin');
          return;
        }
        setUser(parsed);
        setEditUsername(parsed.username);
        setEditPhone(parsed.phone || '');
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiRequest('/api/v1/categories');
      setCategories(res.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const defaultStorefrontProducts: Product[] = [
    {
      id: 1,
      name: 'ปั๊มน้ำบาดาลโซล่าเซลล์บัสเลส TERA 1100W',
      description: 'ปั๊มน้ำบาดาลโซล่าเซลล์บัสเลส TERA (TERA GROUP) 1.5 แรงม้า',
      slug: 'tera-solar-pump-1100w',
      image_url: '/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_32 PM 1.svg',
      detail_image_1: '/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_32 PM 1.svg',
      detail_image_2: '/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_35 PM 1.svg',
      category_name: 'ปั๊มน้ำบาดาลโซล่าเซลล์',
      price: '18500',
      spec_headers: ['หัวข้อข้อมูล', 'รายละเอียดทางเทคนิค (Details)', 'หมายเหตุ / โมเดล'],
      spec_table: [
        { col1: 'แบรนด์', col2: 'TERA (TERA GROUP)', col3: 'TERA Official' },
        { col1: 'ชื่อรุ่น', col2: 'SI4VS5.2-101-110-1100', col3: 'SI Series' },
        { col1: 'ประเภทสินค้า', col2: 'ปั๊มน้ำบาดาลโซล่าเซลล์บัสเลส\nSolar Brushless Submersible Pump', col3: 'Submersible Pump' },
        { col1: 'กำลังไฟฟ้า', col2: '1,100 วัตต์ (1100 W) / 1.5 แรงม้า (1.5 HP)', col3: '1.5 HP' },
        { col1: 'แรงดันไฟฟ้าใช้งาน', col2: '80 - 210 VDC (Optimal input voltage: 110V)', col3: 'DC Input' },
        { col1: 'กระแสไฟฟ้าสูงสุด', col2: '< 17 A', col3: 'Max Current' },
        { col1: 'ความเร็วรอบมอเตอร์', col2: '0 - 4,000 รอบ/นาที (r/min)', col3: 'RPM Control' },
        { col1: 'ขนาดท่อส่งน้ำ', col2: '1 1/4 นิ้ว (1.25 นิ้ว)', col3: 'Outlet Size' },
        { col1: 'ระยะสูบส่งสูง', col2: '0 - 84 - 101 เมตร', col3: 'Max Head' },
        { col1: 'ปริมาณน้ำสูงสุด', col2: '5.2 - 2 - 0 ลูกบาศก์เมตร/ชั่วโมง (m³/h)', col3: 'Max Flow' },
        { col1: 'ระดับการป้องกัน', col2: 'IP68', col3: 'Waterproof' },
        { col1: 'ฉนวนกันความร้อน', col2: 'Class F', col3: 'Insulation' },
        { col1: 'มาตรฐานรับรอง', col2: 'CE Approved', col3: 'Standard' },
        { col1: 'น้ำหนักสินค้า', col2: 'น้ำหนักสุทธิ (N.W.): 11.2 KG / น้ำหนักรวมกล่อง (G.W.): 13.2 KG', col3: 'Weight' },
        { col1: 'ขนาดบรรจุภัณฑ์', col2: '979 x 145 x 240 มม', col3: 'Dimensions' },
        { col1: 'ระยะการรับประกัน', col2: '2 ปีเต็ม (2 YEARS WARRANTY)', col3: 'Guarantee' },
        { col1: 'ข้อควรระวัง', col2: 'ใช้ร่วมกับกระแสไฟจากแผงโซล่าเซลล์เท่านั้น', col3: 'Caution Note' }
      ],
      advice_list: [
        'ห้ามดัดแปลง แก้ไขสินค้า หรือนำไปใช้งานผิดประเภท',
        'ห้ามใช้สารเคมีที่มีฤทธิ์เป็นกรด และด่างทำความสะอาด',
        'จัดเก็บในที่แห้ง และพ้นมือเด็ก',
        'ห้ามจัดเก็บใกล้ความร้อน และเปลวไฟ',
        'ห้ามใช้งานร่วมกับอุปกรณ์ที่ไม่ได้มาตรฐาน',
        'หากสินค้าชำรุดเสียหาย ควรส่งให้ช่างเป็นผู้ซ่อม'
      ],
      accessories_list: [
        { item: 'แผงโซลาร์เซลล์ Mono', spec: '500W (ใช้ออกแบบเซ็ต 3-4 แผง)', cat: 'Power' },
        { item: 'สายไฟจุ่มน้ำ VCT 3 Core', spec: '3 X 2.5 mm² (ยาว 30m / 50m)', cat: 'Cable' },
        { item: 'สลิงสแตนเลส 304', spec: 'หนา 4 mm (รับน้ำหนักปั๊ม)', cat: 'Rigging' },
        { item: 'ฝาปิดปากบ่อบาดาล', spec: 'ขนาด 4 นิ้ว (ท่อออก 1 1/4")', cat: 'Hardware' },
        { item: 'ชุดตู้ควบคุม DC กันฟ้าผ่า', spec: 'DC Surge + Breaker Box', cat: 'Safety' },
        { item: 'ข้อต่อเกลียวนอก', spec: 'ทองเหลือง/สแตนเลส 1 1/4"', cat: 'Fitting' }
      ],
      variants: [
        { id: 101, variant_name: 'รุ่น 1100W (1.5 HP) 80-210V', sku: 'TERA-SI4VS-1100', price: '18500', stock_quantity: 12 },
        { id: 102, variant_name: 'รุ่น 1500W (2.0 HP) 110-250V', sku: 'TERA-SI4VS-1500', price: '24900', stock_quantity: 8 }
      ]
    }
  ];

  const fetchProducts = async () => {
    const savedStr = localStorage.getItem('tera_storefront_products');
    let localSaved: Product[] = [];
    if (savedStr) {
      try { localSaved = JSON.parse(savedStr); } catch (e) {}
    }

    try {
      const res = await apiRequest('/api/v1/products');
      const mappedProducts = (res.data || []).map((p: any) => {
        const localMatch = localSaved.find((sp: Product) => sp.id === p.id || sp.slug === p.slug);
        return {
          ...(localMatch || {}),
          ...p,
          price: p.min_price || p.price || '0',
          spec_table: p.spec_table || localMatch?.spec_table,
          spec_headers: p.spec_headers || localMatch?.spec_headers,
          detail_image_1: p.detail_image_1 || localMatch?.detail_image_1,
          detail_image_2: p.detail_image_2 || localMatch?.detail_image_2,
          advice_list: p.advice_list || localMatch?.advice_list,
          accessories_list: p.accessories_list || localMatch?.accessories_list
        };
      });
      const localOnly = localSaved.filter((sp: Product) => !mappedProducts.some((p: any) => p.id === sp.id));
      const mergedList = [...mappedProducts, ...localOnly];
      const finalList = mergedList.length > 0 ? mergedList : (localSaved.length > 0 ? localSaved : defaultStorefrontProducts);
      setProducts(finalList);
      localStorage.setItem('tera_storefront_products', JSON.stringify(finalList));
    } catch (err: any) {
      const fallbackList = localSaved.length > 0 ? localSaved : defaultStorefrontProducts;
      setProducts(fallbackList);
      localStorage.setItem('tera_storefront_products', JSON.stringify(fallbackList));
    }
  };

  const fetchCart = async () => {
    try {
      const res = await apiRequest('/api/v1/cart');
      const items = res.data.map((item: any) => ({ ...item, selected: true }));
      setCartItems(items);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await apiRequest('/api/v1/addresses');
      setAddresses(res.data);
      const defaultAddr = res.data.find((a: Address) => a.is_default) || res.data[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setReceiverName(defaultAddr.receiver_name || user?.username || '');
        setNewAddress({
          province: defaultAddr.province || '',
          district: defaultAddr.district || '',
          subdistrict: defaultAddr.sub_district || (defaultAddr as any).subdistrict || '',
          postalCode: defaultAddr.postal_code || (defaultAddr as any).postalCode || '',
          detail: defaultAddr.address_detail || (defaultAddr as any).detail || '',
          phone: defaultAddr.phone || ''
        });
      } else if (user) {
        const rName = (user.username || 'ลูกค้า').replace(/[0-9]/g, '') || 'Phichet Srikongka';
        let rPhone = (user.phone || '0812345678').replace(/[^0-9]/g, '');
        if (rPhone.length !== 10) rPhone = '0812345678';
        const rDetail = '123 ม.1 ถ.เพชรเกษม';
        const rProv = 'สตูล';
        const rDist = 'ท่าแพ';
        const rSub = 'ท่าแพ';
        const rZip = '91150';

        setReceiverName(rName);
        setNewAddress({
          province: rProv,
          district: rDist,
          subdistrict: rSub,
          postalCode: rZip,
          detail: rDetail,
          phone: rPhone
        });

        try {
          const saved = await apiRequest('/api/v1/addresses', 'POST', {
            receiver_name: rName,
            phone: rPhone,
            address_detail: rDetail,
            sub_district: rSub,
            district: rDist,
            province: rProv,
            postal_code: rZip,
            is_default: true
          });
          if (saved.data && saved.data.id) {
            setSelectedAddressId(saved.data.id);
            setAddresses([saved.data]);
          }
        } catch (e) {
          console.error('Auto create initial address error:', e);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await apiRequest('/api/v1/orders');
      setOrders(res.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleOpenTracking = async (ord: Order) => {
    setTrackingOrder(ord);
    try {
      const res = await apiRequest(`/api/v1/orders/${ord.id}`);
      setTrackingOrder(res.data);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const showConfirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        isOpen: true,
        title,
        message,
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const handleOpenForgotPassword = () => {
    setForgotEmail(loginEmail || '');
    setForgotToken('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotStep('request');
    setIsForgotPasswordModalOpen(true);
  };

  const handleRequestForgotToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      showToast('กรุณาระบุอีเมล');
      return;
    }
    setIsForgotLoading(true);
    try {
      const res = await apiRequest('/api/v1/auth/forgot-password', 'POST', { email: forgotEmail.trim() });
      showToast(res.message || 'ส่งรหัสกู้คืนไปยังอีเมลของคุณเรียบร้อยแล้ว');
      if (res.data && res.data.token) {
        setForgotToken(res.data.token);
      }
      setForgotStep('reset');
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการขอรหัสกู้คืน');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotToken || !forgotToken.trim()) {
      showToast('กรุณาระบุรหัสกู้คืน 6 หลัก');
      return;
    }
    if (!forgotNewPassword) {
      showToast('กรุณาระบุรหัสผ่านใหม่');
      return;
    }
    if (forgotNewPassword.length < 6) {
      showToast('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      showToast('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    setIsForgotLoading(true);
    try {
      const res = await apiRequest('/api/v1/auth/reset-password', 'POST', {
        email: forgotEmail.trim(),
        token: forgotToken.trim(),
        new_password: forgotNewPassword
      });
      showToast(res.message || 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
      setLoginEmail(forgotEmail.trim());
      setLoginPassword(forgotNewPassword);
      setIsForgotPasswordModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/api/v1/auth/login', 'POST', {
        email: loginEmail,
        password: loginPassword
      });
      showToast('เข้าสู่ระบบสำเร็จ!');
      const userData = res.data.user;
      const tokenData = res.data.token;
      
      localStorage.setItem('tera_user', JSON.stringify(userData));
      localStorage.setItem('tera_token', tokenData);
      
      setUser(userData);
      setEditUsername(userData.username);
      setEditPhone(userData.phone || '');
      if (['admin', 'stock', 'accounting', 'shipping', 'sales', 'marketing'].includes(userData.role)) {
        navigate('/admin');
      } else {
        setActiveTab('catalog');
      }
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/v1/auth/register', 'POST', {
        username: registerUsername,
        email: registerEmail,
        phone: registerPhone,
        password: registerPassword
      });
      showToast('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
      setAuthTab('login');
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/v1/auth/logout', 'POST');
    } catch (err: any) {
      console.error('Logout API failed:', err);
    }
    localStorage.removeItem('tera_user');
    localStorage.removeItem('tera_token');
    showToast('ออกจากระบบเรียบร้อย');
    setUser(null);
    setActiveTab('catalog');
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/api/v1/auth/profile', 'PUT', {
        username: editUsername,
        phone: editPhone
      });
      showToast('บันทึกข้อมูลส่วนตัวสำเร็จ!');
      const updatedUser = res.data;
      localStorage.setItem('tera_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);

    const token = localStorage.getItem('tera_token');
    try {
      const response = await fetch('/api/v1/auth/avatar', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.status === 'success') {
        showToast('อัปโหลดรูปภาพโปรไฟล์สำเร็จ!');
        const updatedUser = data.data;
        localStorage.setItem('tera_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        showToast(data.message || 'อัปโหลดรูปภาพล้มเหลว');
      }
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    try {
      await apiRequest('/api/v1/auth/change-password', 'PUT', {
        old_password: oldPassword,
        new_password: newPassword
      });
      showToast('เปลี่ยนรหัสผ่านสำเร็จ!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
  };

  const openProductDetail = async (prod: Product) => {
    setActiveImgIndex(0);
    setActiveTab('catalog');
    let fullProduct = prod;

    try {
      const res = await apiRequest(`/api/v1/products/${prod.slug}`);
      if (res.data) {
        fullProduct = { ...prod, ...res.data };
      }
    } catch (err: any) {
      console.log('Using local product detail:', err);
    }

    const savedStr = localStorage.getItem('tera_storefront_products');
    if (savedStr) {
      try {
        const savedList: Product[] = JSON.parse(savedStr);
        const localMatch = savedList.find((sp) => sp.id === prod.id || sp.slug === prod.slug);
        if (localMatch) {
          fullProduct = {
            ...localMatch,
            ...fullProduct,
            detail_image_1: fullProduct.detail_image_1 || localMatch.detail_image_1,
            detail_image_2: fullProduct.detail_image_2 || localMatch.detail_image_2,
            spec_table: fullProduct.spec_table || localMatch.spec_table,
            spec_headers: fullProduct.spec_headers || localMatch.spec_headers,
            advice_list: fullProduct.advice_list || localMatch.advice_list,
            accessories_list: fullProduct.accessories_list || localMatch.accessories_list
          };
        }
      } catch (e) {}
    }

    setSelectedProduct(fullProduct);
    if (fullProduct.variants && fullProduct.variants.length > 0) {
      setSelectedVariant(fullProduct.variants[0]);
    } else {
      setSelectedVariant(null);
    }
    setDetailQty(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = async () => {
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบก่อนสั่งซื้อ');
      setActiveTab('profile');
      setSelectedProduct(null);
      return;
    }
    if (!selectedVariant) return;
    try {
      await apiRequest('/api/v1/cart/add', 'POST', {
        variant_id: selectedVariant.id,
        quantity: detailQty
      });
      showToast('เพิ่มสินค้าเข้าตะกร้าแล้ว!');
      fetchCart();
      setSelectedProduct(null);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const deleteCartItem = async (cartItemId: number) => {
    const confirmed = await showConfirm('ยืนยันการลบสินค้า', 'คุณต้องการลบสินค้าชิ้นนี้ออกจากตะกร้าใช่หรือไม่?');
    if (!confirmed) {
      return;
    }
    try {
      await apiRequest(`/api/v1/cart/items/${cartItemId}`, 'DELETE');
      showToast('ลบสินค้าออกจากตะกร้าแล้ว');
      fetchCart();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const updateCartQty = async (cartItemId: number, newQty: number) => {
    if (newQty < 1) {
      deleteCartItem(cartItemId);
      return;
    }
    try {
      await apiRequest(`/api/v1/cart/items/${cartItemId}`, 'PUT', { quantity: newQty });
      fetchCart();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const applyPromoCode = async () => {
    if (promoCode.trim() === '') return;
    try {
      const res = await apiRequest('/api/v1/coupons/validate', 'POST', {
        code: promoCode,
        orderItems: cartItems.filter(i => i.selected).map(item => ({
          variant_id: item.variant_id,
          price: item.price,
          quantity: item.quantity
        }))
      });
      setActiveCoupon(res.data);
      showToast(`เปิดใช้งานส่วนลดโค้ดสำเร็จ! (-${parseFloat(res.data.discount_amount).toFixed(2)} ฿)`);
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const removePromoCode = () => {
    setActiveCoupon(null);
    setPromoCode('');
    showToast('ยกเลิกการใช้คูปองส่วนลดแล้ว');
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAddressId 
        ? `/api/v1/addresses/${editingAddressId}` 
        : '/api/v1/addresses';
      const method = editingAddressId ? 'PUT' : 'POST';

      await apiRequest(url, method, {
        receiver_name: receiverName || user?.username || 'ลูกค้า',
        phone: newAddress.phone,
        address_detail: newAddress.detail,
        sub_district: newAddress.subdistrict,
        district: newAddress.district,
        province: newAddress.province,
        postal_code: newAddress.postalCode,
        is_default: isAddressDefault
      });

      if (user && !user.phone && newAddress.phone && /^\d{10}$/.test(newAddress.phone)) {
        try {
          await apiRequest('/api/v1/auth/profile', 'PUT', {
            username: user.username,
            phone: newAddress.phone
          });
          const updatedUser = { ...user, phone: newAddress.phone };
          setUser(updatedUser);
          localStorage.setItem('tera_user', JSON.stringify(updatedUser));
        } catch (pErr) {
          console.error('Failed auto-syncing phone to profile:', pErr);
        }
      }

      showToast(editingAddressId ? 'แก้ไขข้อมูลที่อยู่สำเร็จ!' : 'เพิ่มที่อยู่จัดส่งใหม่สำเร็จ!');
      fetchAddresses();
      setIsAddressModalOpen(false);
      setEditingAddressId(null);
      setReceiverName('');
      setNewAddress({ province: '', district: '', subdistrict: '', postalCode: '', detail: '', phone: '' });
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // SMS OTP Phone Verification Handlers
  const openOtpModal = (action: 'bind' | 'change' | 'unbind') => {
    setOtpAction(action);
    setOtpPhoneInput(action === 'unbind' ? (user?.phone || '') : '');
    setOtpCodeInput('');
    setOtpRefCode('');
    setOtpDevCode('');
    setIsOtpSent(false);
    setIsOtpLoading(false);
    setIsOtpModalOpen(true);
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpAction !== 'unbind' && (!otpPhoneInput || !/^0\d{9}$/.test(otpPhoneInput))) {
      showToast('กรุณาระบุเบอร์โทรศัพท์ให้ถูกต้อง (10 หลัก เริ่มต้นด้วย 0)');
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await apiRequest('/api/v1/auth/request-phone-otp', 'POST', {
        phone: otpAction === 'unbind' ? user?.phone : otpPhoneInput,
        action: otpAction
      });

      setIsOtpLoading(false);
      if (res.status === 'success') {
        setOtpRefCode(res.data.refCode);
        if (res.data.devOtp) setOtpDevCode(res.data.devOtp);
        setIsOtpSent(true);
        showToast(res.message || 'ส่งรหัส OTP เรียบร้อยแล้ว');
      } else {
        showToast(res.message || 'เกิดข้อผิดพลาดในการขอ OTP');
      }
    } catch (err: any) {
      setIsOtpLoading(false);
      showToast(err.message || 'เกิดข้อผิดพลาดในการขอ OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCodeInput || otpCodeInput.length !== 6) {
      showToast('กรุณาระบุรหัส OTP ให้ครบถ้วน 6 หลัก');
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await apiRequest('/api/v1/auth/verify-phone-otp', 'POST', {
        phone: otpAction === 'unbind' ? user?.phone : otpPhoneInput,
        otp: otpCodeInput,
        action: otpAction
      });

      setIsOtpLoading(false);
      if (res.status === 'success') {
        const updatedUser = { ...user, ...res.data };
        setUser(updatedUser);
        localStorage.setItem('tera_user', JSON.stringify(updatedUser));
        showToast(res.message);
        setIsOtpModalOpen(false);
      } else {
        showToast(res.message || 'รหัส OTP ไม่ถูกต้อง');
      }
    } catch (err: any) {
      setIsOtpLoading(false);
      showToast(err.message || 'รหัส OTP ไม่ถูกต้อง');
    }
  };

  const handleEditAddress = (addr: any) => {
    setEditingAddressId(addr.id);
    setReceiverName(addr.receiver_name || '');
    setIsAddressDefault(!!addr.is_default);
    setNewAddress({
      province: addr.province || '',
      district: addr.district || '',
      subdistrict: addr.sub_district || addr.subdistrict || '',
      postalCode: addr.postal_code || '',
      detail: addr.address_detail || addr.detail || '',
      phone: addr.phone || ''
    });
    setIsAddressModalOpen(true);
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await apiRequest(`/api/v1/addresses/${id}/set-default`, 'PATCH');
      showToast('ตั้งเป็นที่อยู่จัดส่งหลักเรียบร้อยแล้ว');
      setSelectedAddressId(id);
      fetchAddresses();
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการตั้งที่อยู่หลัก');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('คุณต้องการลบที่อยู่จัดส่งนี้ใช่หรือไม่?')) return;
    try {
      await apiRequest(`/api/v1/addresses/${id}`, 'DELETE');
      showToast('ลบที่อยู่จัดส่งสำเร็จ!');
      fetchAddresses();
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const triggerCheckout = (directItem?: {variant: Variant, product: Product, qty: number}) => {
    if (!user) {
      showToast('กรุณาเข้าสู่ระบบก่อนชำระเงิน');
      setActiveTab('profile');
      return;
    }
    if (directItem) {
      setCheckoutDirectItem(directItem);
    } else {
      setCheckoutDirectItem(null);
      if (cartItems.filter(i => i.selected).length === 0) {
        showToast('กรุณาเลือกสินค้าอย่างน้อย 1 ชิ้นในตะกร้า');
        return;
      }
    }
    setCreatedOrderId(null);
    setQrCodeData(null);
    setSlipFile(null);
    setSlipPreview(null);
    setVerifiedPaymentInfo(null);
    setActiveTab('checkout');
  };

  const calculateSubtotal = () => {
    if (checkoutDirectItem) {
      return parseFloat(checkoutDirectItem.variant.price) * checkoutDirectItem.qty;
    }
    return cartItems.filter(i => i.selected).reduce((acc, item) => acc + parseFloat(item.price) * item.quantity, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.07;
  };

  const calculateDiscount = () => {
    if (!activeCoupon) return 0;
    return parseFloat(activeCoupon.discount_amount);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    const tax = calculateTax();
    const disc = calculateDiscount();
    return Math.max(sub + tax - disc, 0);
  };

  const submitOrder = async () => {
    const addressIdToUse = selectedAddressId || (addresses.find(a => a.is_default) || addresses[0])?.id || null;

    try {
      const payload: any = {};
      if (addressIdToUse) {
        payload.address_id = addressIdToUse;
      }


      if (checkoutDirectItem) {
        payload.buy_now_item = {
          variant_id: checkoutDirectItem.variant.id,
          quantity: checkoutDirectItem.qty
        };
      } else {
        payload.selected_cart_item_ids = cartItems
          .filter(i => i.selected !== false)
          .map(item => (item as any).id || item.cart_item_id);
      }

      if (activeCoupon) {
        payload.coupon_id = activeCoupon.id;
      }

      const res = await apiRequest('/api/v1/orders', 'POST', payload);
      const orderData = res.data?.id ? res.data : (res.data?.data || res.data || {});
      const realOrderId = orderData.id || res.data?.id || res.data?.data?.id;

      if (!realOrderId) {
        throw new Error('ไม่สามารถดึงรหัสคำสั่งซื้อได้');
      }

      setCreatedOrderId(realOrderId);
      setCreatedOrderTotal(parseFloat(orderData.total_price || res.data?.total_price || 0));
      showToast('สร้างคำสั่งซื้อสำเร็จ! กรุณาชำระเงิน');
      
      fetchOrders();
      fetchCart(); 
      fetchProducts();

      if (paymentMethod === 'qr') {
        try {
          const qrRes = await apiRequest(`/api/v1/payments/${realOrderId}/qr`, 'POST');
          const qrImage = qrRes.data?.qr_image || qrRes.qr_image || qrRes.data;
          setQrCodeData(qrImage);
          setQrExpireTimer(300); 
        } catch (qrErr: any) {
          console.warn('QR generation notice:', qrErr.message);
        }
      }

      setActiveTab('payment');
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const resumeOrderPayment = async (ord: Order) => {
    setCreatedOrderId(ord.id);
    setCreatedOrderTotal(parseFloat(ord.total_price));
    setSlipFile(null);
    setSlipPreview(null);
    setVerifiedPaymentInfo(null);
    
    // Calculate real remaining seconds based on when order was created! (5 mins = 300s)
    const createdAtMs = ord.created_at ? new Date(ord.created_at).getTime() : Date.now();
    const elapsedSec = Math.floor((Date.now() - createdAtMs) / 1000);
    const remainingSec = Math.max(300 - elapsedSec, 0);

    setQrExpireTimer(remainingSec);
    
    try {
      const qrRes = await apiRequest(`/api/v1/payments/${ord.id}/qr`, 'POST');
      setQrCodeData(qrRes.data.qr_image);
    } catch (err: any) {
      console.error('Failed generating QR code for order:', err);
    }
    setActiveTab('payment');
  };

  const handleCancelOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetOrder) return;
    setIsCancelling(true);
    try {
      const res = await apiRequest(`/api/v1/orders/${cancelTargetOrder.id}/cancel`, 'PUT', {
        reason: cancelReason,
        note: cancelNote
      });
      showToast(res.message || 'ยกเลิกคำสั่งซื้อสำเร็จ!');
      setIsCancelModalOpen(false);
      setCancelTargetOrder(null);
      setCancelNote('');
      fetchOrders();
      if (createdOrderId === cancelTargetOrder.id) {
        setActiveTab('catalog');
      }
    } catch (err: any) {
      showToast(err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorder = async (ord: Order) => {
    if (!ord.items || ord.items.length === 0) {
      setActiveTab('catalog');
      return;
    }
    try {
      for (const item of ord.items) {
        await apiRequest('/api/v1/cart', 'POST', {
          variant_id: item.variant_id,
          quantity: item.quantity
        });
      }
      showToast('เพิ่มสินค้าออเดอร์นี้กลับเข้าตะกร้าเรียบร้อยแล้ว!');
      fetchCart();
      setActiveTab('cart');
    } catch (err: any) {
      showToast(err.message || 'เกิดข้อผิดพลาดในการใส่สินค้าลงตะกร้า');
      setActiveTab('catalog');
    }
  };

  const handleSlipFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSlipFile(file);
      setSlipPreview(URL.createObjectURL(file));
      setVerifiedPaymentInfo(null);

      // Auto trigger instant scan as soon as file is attached!
      uploadSlip(file);
    }
  };

  const uploadSlip = async (fileToUpload?: File) => {
    const file = fileToUpload || slipFile;
    if (!file || !createdOrderId) return;
    const formData = new FormData();
    formData.append('slip', file);

    setIsPaymentLoading(true);
    setPaymentStatusText('กำลังทำการสแกนและตรวจสอบสลิปอัตโนมัติ (OCR Analysis)...');

    try {
      const token = localStorage.getItem('tera_token');
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let targetUrl = `/api/v1/payments/${createdOrderId}/upload`;
      let response: Response;

      try {
        response = await fetch(targetUrl, { method: 'POST', headers, body: formData });
        const ct = response.headers.get('content-type');
        if (response.status === 404 && targetUrl.startsWith('/api') && (!ct || !ct.includes('application/json'))) {
          const fallbackUrl = `http://localhost:5000${targetUrl}`;
          const fallbackRes = await fetch(fallbackUrl, { method: 'POST', headers, body: formData });
          if (fallbackRes.ok || fallbackRes.headers.get('content-type')?.includes('application/json')) {
            response = fallbackRes;
            targetUrl = fallbackUrl;
          }
        }
      } catch (fetchErr) {
        const fallbackUrl = `http://localhost:5000${targetUrl}`;
        response = await fetch(fallbackUrl, { method: 'POST', headers, body: formData });
        targetUrl = fallbackUrl;
      }

      const res = await response.json();
      setIsPaymentLoading(false);

      if (!response.ok || res.status === 'error') {
        showToast(res.message || `อัปโหลดสลิปไม่สำเร็จ (รหัส: ${response.status})`);
        return;
      }

      setVerifiedPaymentInfo(res.data);
      setQrExpireTimer(null);
      showToast('ตรวจสอบสลิปการโอนเงินและอนุมัติชำระเงินสำเร็จ!');
      fetchOrders();
    } catch (err: any) {
      setIsPaymentLoading(false);
      showToast(err.message || 'ระบบเครือข่ายผิดพลาด กรุณาลองใหม่อีกครั้ง');
    }
  };

  const clearSlipSelection = () => {
    setSlipFile(null);
    setSlipPreview(null);
    setVerifiedPaymentInfo(null);
  };

  const filterProducts = () => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'ทั้งหมด' || p.category_name === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchText.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchText.toLowerCase());
      const matchesPrice = parseFloat(p.price) <= priceRange;

      const matchesBrand = selectedBrands.length === 0 || selectedBrands.some(b => 
        p.name.toLowerCase().includes(b.toLowerCase()) || p.description.toLowerCase().includes(b.toLowerCase())
      );

      const matchesVoltage = selectedVoltage.length === 0 || selectedVoltage.some(v => 
        p.description.includes(v) || (p.spec_table && p.spec_table.some(s => s.value.includes(v)))
      );

      const matchesPower = selectedPower.length === 0 || selectedPower.some(pow => 
        p.description.includes(pow) || (p.spec_table && p.spec_table.some(s => s.value.includes(pow)))
      );

      const matchesIp = selectedIpRating.length === 0 || selectedIpRating.some(ip => 
        p.description.includes(ip) || (p.spec_table && p.spec_table.some(s => s.value.includes(ip)))
      );

      return matchesCategory && matchesSearch && matchesPrice && matchesBrand && matchesVoltage && matchesPower && matchesIp;
    });
  };

  // Cursor Parallax mouse move tilt triggers
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; 
    const y = e.clientY - rect.top;  
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((centerY - y) / centerY) * 12; 
    const rotateY = ((x - centerX) / centerX) * 12;
    
    card.style.setProperty('--rotate-x', `${rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    card.style.setProperty('--rotate-x', '0deg');
    card.style.setProperty('--rotate-y', '0deg');
  };

  const ProductImage = ({ name, imageUrl }: { name: string; imageUrl?: string }) => {
    const [error, setError] = useState(false);

    if (imageUrl && !error) {
      return (
        <img 
          src={imageUrl} 
          alt={name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={() => setError(true)} 
        />
      );
    }
    return renderProductSvg(name);
  };

  // Dynamic vector SVG illustration generator
  const renderProductSvg = (productName: string) => {
    const name = (productName || '').toLowerCase();
    if (name.includes('phone')) {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '55%', height: '55%', color: '#3182ce', filter: 'drop-shadow(0 6px 14px rgba(49, 130, 206, 0.35))' }}>
          <rect x="26" y="8" width="48" height="84" rx="9" fill="#1a202c" stroke="#4a5568" strokeWidth="2.5" />
          <rect x="29" y="11" width="42" height="78" rx="7" fill="url(#phone-screen-grad)" />
          <rect x="41" y="14" width="18" height="4.5" rx="2.5" fill="#0c0d12" />
          <circle cx="50" cy="83" r="2.5" fill="#2d3748" />
          <defs>
            <linearGradient id="phone-screen-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3182ce" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#805ad5" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    if (name.includes('watch')) {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '55%', height: '55%', color: '#e53e3e', filter: 'drop-shadow(0 6px 14px rgba(229, 62, 62, 0.35))' }}>
          <rect x="42" y="4" width="16" height="26" rx="3" fill="#2d3748" />
          <rect x="42" y="70" width="16" height="26" rx="3" fill="#2d3748" />
          <rect x="28" y="28" width="44" height="44" rx="12" fill="#1a202c" stroke="#4a5568" strokeWidth="2.5" />
          <rect x="31" y="31" width="38" height="38" rx="9" fill="url(#watch-screen-grad)" />
          <circle cx="50" cy="50" r="12" fill="none" stroke="#ffffff" strokeDasharray="2,2" strokeWidth="1.2" />
          <line x1="50" y1="50" x2="50" y2="40" stroke="#ff3201" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="50" y1="50" x2="59" y2="50" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
          <defs>
            <linearGradient id="watch-screen-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2d3748" />
              <stop offset="100%" stopColor="#141622" />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    if (name.includes('buds')) {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '55%', height: '55%', color: '#38a169', filter: 'drop-shadow(0 6px 14px rgba(56, 161, 105, 0.35))' }}>
          <rect x="24" y="32" width="52" height="42" rx="14" fill="#1a202c" stroke="#4a5568" strokeWidth="2.5" />
          <line x1="24" y1="45" x2="76" y2="45" stroke="#4a5568" strokeWidth="1.8" />
          <circle cx="50" cy="58" r="2.5" fill="#38a169" />
          <circle cx="37" cy="20" r="8" fill="url(#buds-grad)" />
          <path d="M37,20 L37,29" stroke="#cbd5e0" strokeWidth="3" strokeLinecap="round" />
          <circle cx="63" cy="20" r="8" fill="url(#buds-grad)" />
          <path d="M63,20 L63,29" stroke="#cbd5e0" strokeWidth="3" strokeLinecap="round" />
          <defs>
            <linearGradient id="buds-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#718096" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
        </svg>
      );
    }
    if (name.includes('powerbank') || name.includes('battery') || name.includes('pb')) {
      return (
        <svg viewBox="0 0 100 100" style={{ width: '55%', height: '55%', color: '#dd6b20', filter: 'drop-shadow(0 6px 14px rgba(221, 107, 32, 0.35))' }}>
          <rect x="28" y="12" width="44" height="76" rx="7" fill="#1a202c" stroke="#4a5568" strokeWidth="2.5" />
          <rect x="31" y="15" width="38" height="2" fill="#ff3201" />
          <circle cx="38" cy="24" r="2" fill="#38a169" />
          <circle cx="46" cy="24" r="2" fill="#38a169" />
          <circle cx="54" cy="24" r="2" fill="#38a169" />
          <circle cx="62" cy="24" r="2" fill="#4a5568" />
          <rect x="40" y="80" width="7" height="3" fill="#a0aec0" rx="1" />
          <rect x="53" y="80" width="7" height="3" fill="#a0aec0" rx="1" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 100 100" style={{ width: '50%', height: '50%', color: 'var(--text-muted)', opacity: 0.4 }}>
        <rect x="25" y="25" width="50" height="50" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M25,25 L75,75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M75,25 L25,75" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  };

  return (
    <div className="storefront-page" style={{ backgroundColor: activeTab === 'cart' ? '#F3F3F3' : undefined }}>
      {/* Toast Alert Notifications */}
      <div id="toast-container" className="toast-container">
        {toasts.map((toast, index) => (
          <div key={index} className="toast show">{toast}</div>
        ))}
      </div>

      {/* Main Header navigation (Matched 100% with Figma Target Screenshot) */}
      <header className="main-header">
        <div className="header-container">
          <div 
            className="logo-area" 
            onClick={() => { 
              setActiveTab('home'); 
              setSelectedProduct(null); 
              setSelectedCategory('ทั้งหมด'); 
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }} 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <img src="/tera_footer_logo.png" alt="TERA Text" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
          </div>

          <nav className="main-nav">
            <button 
              className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} 
              onClick={() => { 
                setActiveTab('home'); 
                setSelectedProduct(null);
                setSelectedCategory('ทั้งหมด'); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }}
            >
              หน้าแรก
            </button>
            <button 
              className={`nav-btn ${activeTab === 'catalog' ? 'active' : ''}`} 
              onClick={() => { 
                setSelectedProduct(null);
                setActiveTab('catalog'); 
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }}
            >
              สินค้า
            </button>
            <a 
              href="https://www.teragroup.co.th/contact-us-th/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="nav-btn" 
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              ติดต่อเรา
            </a>
            <a 
              href="https://www.teragroup.co.th/about-us/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="nav-btn" 
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              เกี่ยวกับเรา
            </a>
            <button 
              className={`nav-btn ${activeTab === 'orders' || (activeTab === 'profile' && profileSubTab === 'orders') ? 'active' : ''}`} 
              onClick={() => { 
                if (user) {
                  setActiveTab('profile'); 
                  setProfileSubTab('orders');
                  fetchOrders(); 
                } else {
                  setActiveTab('orders');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }}
            >
              ติดตามคำสั่งซื้อ
              {user && orders.filter(o => o.status === 'pending').length > 0 && (
                <span className="nav-badge">{orders.filter(o => o.status === 'pending').length}</span>
              )}
            </button>
          </nav>
          
          <div className="header-right-group">
            <div className="header-search-bar">
              <Search 
                className="header-search-icon" 
                size={16} 
                style={{ color: isSearchCommitted ? '#64748B' : 'inherit', cursor: 'pointer' }}
                onClick={() => {
                  if (searchText.trim()) {
                    setIsSearchCommitted(true);
                    setSelectedProduct(null);
                    setActiveTab('catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              />
              <input 
                type="text" 
                placeholder="ค้นหาสินค้า เช่น อินเวอร์เตอร์...." 
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  if (isSearchCommitted) setIsSearchCommitted(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                    if (searchText.trim()) {
                      setIsSearchCommitted(true);
                      setSelectedProduct(null);
                      setActiveTab('catalog');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }
                }}
                style={{
                  color: isSearchCommitted ? '#64748B' : '#000000',
                  fontWeight: isSearchCommitted ? 600 : 400
                }}
              />
            </div>

            <div className="header-cart-icon-btn" onClick={() => setActiveTab('cart')} title="ดูตะกร้าสินค้า">
              <ShoppingCart size={24} color="#ffffff" />
              {cartItems.length > 0 && <span className="cart-badge-dot">{cartItems.length}</span>}
            </div>

            {user ? (
              <div className="user-avatar-btn" onClick={() => setActiveTab('profile')} title="โปรไฟล์ของคุณ">
                <div className="user-avatar-circle">
                  {user.profile_image ? (
                    <img src={user.profile_image} alt={user.username} />
                  ) : (
                    user.username.charAt(0).toUpperCase()
                  )}
                </div>
              </div>
            ) : (
              <button className="nav-btn" style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem' }} onClick={() => { setActiveTab('profile'); setAuthTab('login'); }}>
                เข้าสู่ระบบ
              </button>
            )}

            {user && ['admin', 'stock', 'accounting', 'shipping', 'sales', 'marketing'].includes(user.role) && (
              <button className="nav-btn" style={{ background: '#0F172A', color: '#fff', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '4px' }} onClick={() => navigate('/admin')}>
                ระบบหลังบ้าน
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="main-content" style={{ backgroundColor: activeTab === 'cart' ? '#F3F3F3' : undefined }}>
        
        {/* HOME TAB (Matched 100% with media__1784706024300.png) */}
        {activeTab === 'home' && (
          <section id="tab-home" className="tab-section active" style={{ padding: 0, margin: 0 }}>
            
            {/* INDUSTRIAL HERO BANNER SECTION (100% Full Width Edge-to-Edge, Flush to Top Header) */}
            <div className="industrial-hero-wrapper">
              <div className="industrial-hero-container">
                <div>
                  <div className="hero-subtitle">ผู้นำด้านเครื่องจักรอุตสาหกรรม และระบบอัตโนมัติครบวงจร</div>
                  <h1 className="hero-big-title">
                    <span className="title-dark">INDUSTRIAL</span><br />
                    <span className="title-orange">AUTOMATION</span><br />
                    <span className="title-dark">SOLUTIONS</span>
                  </h1>
                  <p className="hero-description" style={{ maxWidth: '440px', lineHeight: '1.7', color: '#475569', fontSize: '0.98rem', margin: '20px 0 28px' }}>
                    เราคัดสรรสินค้าอุตสาหกรรมคุณภาพสูง<br />
                    พร้อมโซลูชันที่ตอบโจทย์ทุกความต้องการ<br />
                    ของโรงงานยุคใหม่
                  </p>
                  <div className="hero-cta-buttons">
                    <button className="btn-cta-primary" onClick={() => {
                      setActiveTab('catalog');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>
                      เลือกซื้อสินค้า &gt;
                    </button>
                    <button className="btn-cta-secondary" onClick={() => showToast('ดูโซลูชันและบริการของ Tera Group')}>
                      ดูโซลูชันของเรา &gt;
                    </button>
                  </div>
                </div>

                <div className="hero-machinery-graphic" style={{ minHeight: '380px' }}>
                </div>
              </div>

              {/* Trust Badges Row (Inside Hero Cover at Bottom, Matched 100% with media__1784706024300.png) */}
              <div className="trust-badges-row">
                <div className="trust-badge-item">
                  <div className="trust-icon-box"><ShieldCheck size={20} strokeWidth={1.8} /></div>
                  <div>
                    <div className="trust-badge-title">สินค้าของแท้ 100%</div>
                    <div className="trust-badge-sub">รับประกันคุณภาพ</div>
                  </div>
                </div>
                <div className="trust-badge-item">
                  <div className="trust-icon-box"><Users size={20} strokeWidth={1.8} /></div>
                  <div>
                    <div className="trust-badge-title">ทีมวิศวกรพร้อมให้คำปรึกษา</div>
                    <div className="trust-badge-sub">ก่อนและหลังการขาย</div>
                  </div>
                </div>
                <div className="trust-badge-item">
                  <div className="trust-icon-box"><Truck size={20} strokeWidth={1.8} /></div>
                  <div>
                    <div className="trust-badge-title">จัดส่งรวดเร็ว</div>
                    <div className="trust-badge-sub">ทั่วประเทศไทย</div>
                  </div>
                </div>
                <div className="trust-badge-item">
                  <div className="trust-icon-box"><Headphones size={20} strokeWidth={1.8} /></div>
                  <div>
                    <div className="trust-badge-title">บริการหลังการขาย</div>
                    <div className="trust-badge-sub">มาตรฐานระดับสากล</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Home Container */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '36px 24px 40px' }}>
              
              {/* Category Grid 8 Cards Bar */}
              <div className="category-card-bar">
                <div className="category-grid-8">
                  <div className="category-card-item" onClick={() => { handleCategorySelect('ระบบอัตโนมัติและโรบอท'); setActiveTab('catalog'); }}>
                    <div className="category-icon-wrapper"><img src="/cat_card_2.svg" alt="Robot" /></div>
                    <div className="category-card-title">ระบบอัตโนมัติและโรบอท</div>
                    <div className="category-card-sub">Automation &amp; Robot &gt;</div>
                  </div>

                  <div className="category-card-item" onClick={() => { handleCategorySelect('อินเวอร์เตอร์และเซอร์โว'); setActiveTab('catalog'); }}>
                    <div className="category-icon-wrapper"><img src="/cat_card_1.svg" alt="Inverter" /></div>
                    <div className="category-card-title">อินเวอร์เตอร์และเซอร์โว</div>
                    <div className="category-card-sub">Inverter &amp; Servo &gt;</div>
                  </div>

                  <div className="category-card-item" onClick={() => { handleCategorySelect('PLC, HMI และคอนโทรล'); setActiveTab('catalog'); }}>
                    <div className="category-icon-wrapper"><img src="/cat_plc.svg" alt="PLC" /></div>
                    <div className="category-card-title">PLC, HMI และคอนโทรล</div>
                    <div className="category-card-sub">PLC, HMI &amp; Control &gt;</div>
                  </div>

                  <div className="category-card-item" onClick={() => { handleCategorySelect('ระบบ IoT และเครื่องจักร'); setActiveTab('catalog'); }}>
                    <div className="category-icon-wrapper"><img src="/cat_card_5.svg" alt="IoT" /></div>
                    <div className="category-card-title">ระบบ IoT และเครื่องจักร</div>
                    <div className="category-card-sub">IoT &amp; Machines &gt;</div>
                  </div>

                  <div className="category-card-item" onClick={() => { handleCategorySelect('การเกษตรและเทคโนโลยี'); setActiveTab('catalog'); }}>
                    <div className="category-icon-wrapper"><img src="/cat_card_6.svg" alt="Agri" /></div>
                    <div className="category-card-title">การเกษตรและเทคโนโลยี</div>
                    <div className="category-card-sub">Agriculture &gt;</div>
                  </div>

                  <div className="category-card-item" onClick={() => { handleCategorySelect('ตู้ควบคุม & ตู้ MDB'); setActiveTab('catalog'); }}>
                    <div className="category-icon-wrapper"><img src="/cat_card_4.svg" alt="Cabinet" /></div>
                    <div className="category-card-title">ตู้ควบคุม &amp; ตู้ MDB</div>
                    <div className="category-card-sub">Cabinet &gt;</div>
                  </div>

                  <div className="category-card-item" onClick={() => { handleCategorySelect('พลังงานแสงอาทิตย์'); setActiveTab('catalog'); }}>
                    <div className="category-icon-wrapper"><img src="/cat_solar.svg" alt="Solar" /></div>
                    <div className="category-card-title">พลังงานแสงอาทิตย์</div>
                    <div className="category-card-sub">Solar &amp; Energy &gt;</div>
                  </div>

                  <div className="category-card-item" onClick={() => { handleCategorySelect('อะไหล่และอุปกรณ์เสริม'); setActiveTab('catalog'); }}>
                    <div className="category-icon-wrapper"><img src="/cat_parts.svg" alt="Parts" /></div>
                    <div className="category-card-title">อะไหล่และอุปกรณ์เสริม</div>
                    <div className="category-card-sub">Parts &amp; Accessories &gt;</div>
                  </div>
                </div>
              </div>

              {/* Brands Section */}
              <div className="brand-partners-section" style={{ margin: '36px 0 28px', padding: '24px 0', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div className="brand-section-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>แบรนด์ชั้นนำที่เราเป็นตัวแทนจำหน่าย</div>
                  <span 
                    className="brand-logo-text" 
                    onClick={() => { 
                      setActiveTab('brands'); 
                      window.scrollTo({ top: 0, behavior: 'smooth' }); 
                    }}
                    style={{ fontSize: '0.88rem', color: '#FF3201', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ดูทั้งหมด &gt;
                  </span>
                </div>
                <div className="brand-logos-row" style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'nowrap', overflowX: 'auto', padding: '24px 28px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
                  {[
                    { name: 'VEICHI', logo: '/brand_veichi.svg' },
                    { name: 'POWTRAN', logo: '/brand_powran.svg' },
                    { name: 'MITSUBISHI', logo: '/brand_mitsubishi.svg' },
                    { name: 'HITACHI', logo: '/brand_hitachi.svg' },
                    { name: 'Fuji Electric', logo: '/brand_fuji.svg' },
                    { name: 'sunways', logo: '/brand_sunways.svg' },
                    { name: 'risen', logo: '/brand_risen.svg' },
                    { name: 'HUAWEI', logo: '/brand_huawei.svg' },
                    { name: 'ABB', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/ABB_logo.svg/960px-ABB_logo.svg.png' },
                    { name: 'Schneider', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Schneider_Electric_2007.svg/1280px-Schneider_Electric_2007.svg.png' },
                    { name: 'DELTA', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDQ616VVCuM4YQeEuDvz9IxzpeOal9PfRT0IpfeHD-GQ&s=10', scale: 1.25 },
                    { name: 'TOSHIBA', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/df/TOSHIBA_Logo.png' },
                    { name: 'HASCON', logo: 'https://www.euroventblower.com/sites/default/files/hascon.png', scale: 2.2 },
                    { name: 'Danfoss', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Danfoss-Logo.svg/3840px-Danfoss-Logo.svg.png' },
                    { name: 'SIEMENS', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmOhQMf2Kf7OkPu3nYLPaPM0SUKHfLoS_XrrrIY9nGxorYkioYroVuvso&s=10', scale: 1.3 },
                    { name: 'YASKAWA', logo: 'https://www.evolectriconline.com/images/content/original-1645536471827.png' },
                    { name: 'Caprari', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv8FlPZE_x8TtAOTAi7zRKDi1IlvjmyCpcdf_rLXQZAMMn1I7KYvDPCbNT&s=10', scale: 2.1 },
                    { name: 'BCC Cable', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpasZXF-HGcJb6Uqh0yuVyhDoXkKck82R4x8QTKHGtcA&s=10', scale: 1.2 },
                    { name: 'OMRON', logo: 'https://logos-world.net/wp-content/uploads/2023/01/Omron-Logo.png' },
                    { name: 'YAZAKI', logo: 'https://seekvectorlogo.com/wp-content/uploads/2019/05/yazaki-vector-logo.png', scale: 1.2 }
                  ].map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedBrands([item.name]);
                        setSelectedCategory('ทั้งหมด');
                        setSearchText('');
                        setActiveTab('catalog');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', padding: '0 8px', overflow: 'hidden' }}
                    >
                      <img src={item.logo} alt={item.name} style={{ maxHeight: '34px', maxWidth: '120px', objectFit: 'contain', transform: item.scale ? `scale(${item.scale})` : 'none' }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* COMPANY LOCATION & CONTACT SECTION */}
              <div className="company-location-section" style={{
                maxWidth: '1400px',
                margin: '48px auto 0',
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '36px 40px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FF3201', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(255,50,1,0.3)' }}>
                    <MapPin size={20} />
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
                    Company <span style={{ color: '#FF3201' }}>Location & Contact</span>
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '36px', alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <img src="/tera_logo_red_badge.png" alt="Tera Group Banner" style={{ maxWidth: '200px', height: 'auto', borderRadius: '8px' }} />

                    <div style={{ fontSize: '0.92rem', lineHeight: '1.7', color: '#334155' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>Tera Group Co., Ltd</strong>
                      39 Chalermprakiat Rama 9 Soi 28<br />
                      Dokmai, Prawet, Bangkok(Thailand) 10250<br />
                      Tel: +66-2328-0801-3<br />
                      Fax: +66-2328-0804<br />
                      E-mail: info@teragroup.co.th
                    </div>

                    <div style={{ fontSize: '0.92rem', lineHeight: '1.7', color: '#334155', borderTop: '1px dashed #CBD5E1', paddingTop: '16px' }}>
                      <strong style={{ fontSize: '1.1rem', color: '#0F172A', display: 'block', marginBottom: '4px' }}>บริษัท เทอรา กรุ้ป จำกัด</strong>
                      39 เฉลิมพระเกียรติ ร.9 ซอย 28<br />
                      แขวงดอกไม้ เขตประเวศ กรุงเทพมหานคร 10250<br />
                      www.teragroup.co.th<br />
                      Line OA : @teragroup<br />
                      www.facebook.com/teragroup0818198637
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '20px' }}>
                    <img src="/company_map.svg" alt="Map Location" style={{ width: '100%', maxWidth: '480px', borderRadius: '16px', border: '1px solid #CBD5E1', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginRight: '40px', marginTop: '4px' }}>
                      <img src="/company_qr.svg" alt="Tera Group Website QR" style={{ height: '175px', width: 'auto', objectFit: 'contain' }} />
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginTop: '8px', letterSpacing: '0.5px' }}>www.teragroup.co.th</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* PRODUCT CATALOG TAB (Matched 100% with สินค้า.svg) */}
        {activeTab === 'catalog' && (
          <section id="tab-catalog" className="tab-section active">
            <div className="storefront-catalog-body" style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 40px' }}>


              {/* FIGMA INTERACTIVE CATALOG LAYOUT */}
              <div className="catalog-layout" style={{ display: 'grid', gridTemplateColumns: selectedProduct ? '1fr' : '296px 1fr', gap: '32px', alignItems: 'start' }}>
                
                {/* SIDEBAR FILTERS (Only visible when no product is selected) */}
                {!selectedProduct && (
                  <aside style={{ background: '#FFFAFA', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                    
                    {/* SECTION 1: หมวดหมู่หลัก ( Categories ) */}
                    <div style={{ background: '#FF3201', padding: '14px 20px', color: '#FFFFFF', fontSize: '20px', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 600 }}>
                      หมวดหมู่หลัก ( Categories )
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', borderBottom: '1px solid #E2E8F0' }}>
                      {[
                        'ทั้งหมด',
                        'ระบบอัตโนมัติ & เซอร์โว',
                        'อินเวอร์เตอร์',
                        'ปั้มน้ำบาดาล',
                        'แผงโซล่าเซลล์ & ระบบพลังงาน',
                        'อะไหล่ & อุปกรณ์เสริม'
                      ].map((catName) => (
                        <label 
                          key={catName} 
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontFamily: "'IBM Plex Sans Thai', sans-serif", color: '#000000', cursor: 'pointer' }}
                          onClick={() => handleCategorySelect(catName === 'ระบบอัตโนมัติ & เซอร์โว' ? 'ระบบอัตโนมัติและโรบอท' : catName === 'อินเวอร์เตอร์' ? 'อินเวอร์เตอร์และเซอร์โว' : catName)}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedCategory === catName || (catName === 'ทั้งหมด' && selectedCategory === 'ทั้งหมด')} 
                            onChange={() => {}} 
                            style={{ width: '20px', height: '20px', accentColor: '#FF3201', borderRadius: '3px', cursor: 'pointer' }} 
                          />
                          <span>{catName}</span>
                        </label>
                      ))}
                    </div>

                    {/* SECTION 2: แบรนด์สินค้า ( Brands ) */}
                    <div style={{ background: '#FF3201', padding: '14px 20px', color: '#FFFFFF', fontSize: '20px', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 600 }}>
                      แบรนด์สินค้า ( Brands )
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', borderBottom: '1px solid #E2E8F0' }}>
                      {[
                        'VEICHI',
                        'POWTRAN',
                        'MITSUBISHI ELECTRIC',
                        'HITACHI',
                        'Fuji Electric',
                        'sunways',
                        'risen',
                        'HUAWEI',
                        'ABB',
                        'Schneider Electric',
                        'DELTA',
                        'TOSHIBA',
                        'HASCON',
                        'Danfoss',
                        'SIEMENS',
                        'YASKAWA',
                        'Caprari',
                        'BCC Cable',
                        'OMRON',
                        'YAZAKI'
                      ].slice(0, showMoreBrands ? 20 : 6).map((brandName) => {
                        const isChecked = selectedBrands.includes(brandName);
                        return (
                          <label 
                            key={brandName} 
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontFamily: "'IBM Plex Sans Thai', sans-serif", color: '#000000', cursor: 'pointer' }}
                            onClick={() => {
                              if (isChecked) setSelectedBrands(selectedBrands.filter(b => b !== brandName));
                              else setSelectedBrands([...selectedBrands, brandName]);
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={isChecked} 
                              onChange={() => {}} 
                              style={{ width: '20px', height: '20px', accentColor: '#FF3201', borderRadius: '3px', cursor: 'pointer' }} 
                            />
                            <span>{brandName}</span>
                          </label>
                        );
                      })}
                      <div 
                        onClick={() => setShowMoreBrands(!showMoreBrands)} 
                        style={{ color: '#4A6EA1', fontSize: '15px', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 500, cursor: 'pointer', marginTop: '4px' }}
                      >
                        {showMoreBrands ? 'ย่อซ่อนแบรนด์' : 'ดูเพิ่มเติม'}
                      </div>
                    </div>

                    {/* SECTION 3: ข้อมูลเทคนิค ( Tech Specs ) */}
                    <div style={{ background: '#FF3201', padding: '14px 20px', color: '#FFFFFF', fontSize: '20px', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 600 }}>
                      ข้อมูลเทคนิค ( Tech Specs )
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      
                      {/* Voltage Group */}
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 500, fontFamily: "'IBM Plex Sans Thai', sans-serif", color: '#000000', marginBottom: '10px' }}>แรงดันไฟฟ้า</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {['1 เฟส (220V)', '3 เฟส (380V)', 'ระบบไฟ DC (สำหรับโซล่าเซลล์)'].map(v => {
                            const isChecked = selectedVoltage.includes(v);
                            return (
                              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontFamily: "'IBM Plex Sans Thai', sans-serif", color: '#000000', cursor: 'pointer' }}
                                onClick={() => {
                                  if (isChecked) setSelectedVoltage(selectedVoltage.filter(item => item !== v));
                                  else setSelectedVoltage([...selectedVoltage, v]);
                                }}
                              >
                                <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ width: '20px', height: '20px', accentColor: '#FF3201', borderRadius: '3px', cursor: 'pointer' }} />
                                <span>{v}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Power Group */}
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 500, fontFamily: "'IBM Plex Sans Thai', sans-serif", color: '#000000', marginBottom: '10px' }}>กำลังไฟฟ้า</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {['0.75 kW (1 HP)', '1.5 kW (2 HP)', '2.2 kW (3 HP)', '5.5 kW ขึ้นไป (7.5 HP+)'].map(pow => {
                            const isChecked = selectedPower.includes(pow);
                            return (
                              <label key={pow} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontFamily: "'IBM Plex Sans Thai', sans-serif", color: '#000000', cursor: 'pointer' }}
                                onClick={() => {
                                  if (isChecked) setSelectedPower(selectedPower.filter(item => item !== pow));
                                  else setSelectedPower([...selectedPower, pow]);
                                }}
                              >
                                <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ width: '20px', height: '20px', accentColor: '#FF3201', borderRadius: '3px', cursor: 'pointer' }} />
                                <span>{pow}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* IP Rating Group */}
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 500, fontFamily: "'IBM Plex Sans Thai', sans-serif", color: '#000000', marginBottom: '10px' }}>
                          ระดับการป้องกัน (<span style={{ fontFamily: "'Rubik', sans-serif" }}>IP Rating</span>)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {[
                            { ip: 'IP20', desc: '(สำหรับติดตั้งในตู้)' },
                            { ip: 'IP54 / IP65', desc: '(กันฝุ่น กันน้ำละออง)' },
                            { ip: 'IP68', desc: '(กันน้ำลึก สำหรับปั๊มบาดาล)' }
                          ].map(item => {
                            const isChecked = selectedIpRating.includes(item.ip);
                            return (
                              <label key={item.ip} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', color: '#000000', cursor: 'pointer' }}
                                onClick={() => {
                                  if (isChecked) setSelectedIpRating(selectedIpRating.filter(i => i !== item.ip));
                                  else setSelectedIpRating([...selectedIpRating, item.ip]);
                                }}
                              >
                                <input type="checkbox" checked={isChecked} onChange={() => {}} style={{ width: '20px', height: '20px', accentColor: '#FF3201', borderRadius: '3px', cursor: 'pointer' }} />
                                <span>
                                  <strong style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 400 }}>{item.ip}</strong>{' '}
                                  <span style={{ fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 400 }}>{item.desc}</span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Reset All Filters Button */}
                      <button 
                        type="button" 
                        onClick={() => {
                          setSearchText('');
                          setIsSearchCommitted(false);
                          setSelectedCategory('ทั้งหมด');
                          setPriceRange(50000);
                          setSelectedBrands([]);
                          setSelectedVoltage([]);
                          setSelectedPower([]);
                          setSelectedIpRating([]);
                        }}
                        style={{
                          width: '100%',
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          color: '#64748B',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginTop: '10px'
                        }}
                      >
                        ล้างตัวกรองทั้งหมด
                      </button>

                    </div>
                  </aside>
                )}

                {/* RIGHT MAIN CATALOG CONTENT AREA (Directly in black circled area) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {selectedProduct ? (
                    /* INLINE PRODUCT DETAILS & PURCHASING VIEW (หน้า สั่งซื้อ.svg Design) */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* MAIN SHOWCASE CARD */}
                      <div style={{ background: '#FCFCFC', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', padding: '28px', display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '32px' }}>
                        
                        {/* LEFT: IMAGE GALLERY & THUMBNAILS CAROUSEL */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          <div style={{ width: '100%', height: '360px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            {(() => {
                              const imgList = (selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0)
                                ? selectedProduct.images 
                                : [selectedProduct.image_url || '/checkout_images/image 205.svg'];
                              const currentImg = imgList[activeImgIndex] || imgList[0];
                              return (
                                <ProductImage name={selectedProduct.name} imageUrl={currentImg} />
                              );
                            })()}
                          </div>

                          {/* Thumbnails Row */}
                          {(() => {
                            const imgList = (selectedProduct.images && Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0)
                              ? selectedProduct.images 
                              : [selectedProduct.image_url || '/checkout_images/image 205.svg'];
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', padding: '4px 2px' }}>
                                {imgList.map((imgUrl, idx) => (
                                  <div 
                                    key={idx}
                                    onClick={() => setActiveImgIndex(idx)}
                                    style={{
                                      width: '70px',
                                      height: '70px',
                                      borderRadius: '12px',
                                      overflow: 'hidden',
                                      cursor: 'pointer',
                                      flexShrink: 0,
                                      border: activeImgIndex === idx ? '2px solid #FF3201' : '1px solid #CBD5E1',
                                      boxShadow: activeImgIndex === idx ? '0 0 10px rgba(255,50,1,0.3)' : 'none',
                                      opacity: activeImgIndex === idx ? 1 : 0.65,
                                      transition: 'all 0.2s ease',
                                      backgroundColor: '#FFFFFF'
                                    }}
                                  >
                                    <ProductImage name={`${selectedProduct.name} ${idx+1}`} imageUrl={imgUrl} />
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        {/* RIGHT: PRODUCT INFO & PURCHASING OPTIONS */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', justifyContent: 'space-between' }}>
                          <div>
                            {/* Title */}
                            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.35, marginBottom: '14px' }}>
                              {selectedProduct.name}
                            </h1>

                            {/* Badges Bar (รับประกัน 2 ปี | ส่งฟรี | มีสินค้าพร้อมส่ง) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                              <div style={{ background: '#EAE9E9', borderRadius: '8px', border: '1px solid #A6A6A6', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(0,0,0,0.75)' }}>
                                <ShieldCheck size={16} style={{ color: '#059669' }} />
                                <span>รับประกัน 2 ปี</span>
                              </div>
                              <div style={{ background: '#EAE9E9', borderRadius: '8px', border: '1px solid #A6A6A6', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(0,0,0,0.75)' }}>
                                <Truck size={16} style={{ color: '#2563EB' }} />
                                <span>ส่งฟรี</span>
                              </div>
                              <div style={{ background: '#EAE9E9', borderRadius: '8px', border: '1px solid #A6A6A6', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(0,0,0,0.75)' }}>
                                <CheckCircle size={16} style={{ color: '#FF3201' }} />
                                <span>มีสินค้าพร้อมส่ง</span>
                              </div>
                            </div>

                            {/* Price Display */}
                            {selectedVariant && (
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
                                <span style={{ color: '#FF3201', fontSize: '2.2rem', fontWeight: 700 }}>฿ </span>
                                <span style={{ color: '#FF3201', fontSize: '2.2rem', fontWeight: 700, fontFamily: 'Rubik, sans-serif' }}>
                                  {parseFloat(selectedVariant.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            )}

                            {/* Variants selector (if available) */}
                            {selectedProduct.variants && selectedProduct.variants.length > 1 && (
                              <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>ตัวเลือกรุ่นสินค้า:</div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                  {selectedProduct.variants.map((v) => (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => setSelectedVariant(v)}
                                      style={{
                                        padding: '6px 14px',
                                        borderRadius: '8px',
                                        border: selectedVariant?.id === v.id ? '2px solid #FF3201' : '1px solid #CBD5E1',
                                        background: selectedVariant?.id === v.id ? '#FFF5F3' : '#FFFFFF',
                                        color: selectedVariant?.id === v.id ? '#FF3201' : '#334155',
                                        fontWeight: 700,
                                        fontSize: '0.85rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      {v.variant_name} ({parseFloat(v.price).toFixed(2)} ฿)
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Shipping Address Option (ตัวเลือกจัดส่ง) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', background: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                                <MapPin size={18} style={{ color: '#FF3201', flexShrink: 0 }} />
                                <span style={{ fontWeight: 700, color: '#0F172A', flexShrink: 0 }}>ตัวเลือกจัดส่ง:</span>
                                <span style={{ color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {addresses.length > 0 ? (
                                    `${addresses.find(a => a.is_default)?.district || addresses[0].district} in ${addresses.find(a => a.is_default)?.province || addresses[0].province}, ${addresses.find(a => a.is_default)?.postal_code || addresses[0].postal_code}`
                                  ) : (
                                    'ปทุมวัน / Pathum Wan in กรุงเทพมหานคร / Bangkok, 10110'
                                  )}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#059669', fontWeight: 600 }}>
                                <Clock size={16} />
                                <span>รับประกันสินค้าจัดส่งถึงภายใน 2-3 วันทำการ</span>
                              </div>
                            </div>

                            {/* Quantity Stepper (จำนวน) */}
                            {selectedVariant && selectedVariant.stock_quantity > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>จำนวน :</span>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(0,0,0,0.34)', borderRadius: '10px', overflow: 'hidden', background: '#FFFFFF' }}>
                                  <button 
                                    type="button" 
                                    onClick={() => setDetailQty(Math.max(1, detailQty - 1))}
                                    style={{ width: '36px', height: '36px', border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                                  >-</button>
                                  <span style={{ width: '48px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#FF3201', fontFamily: 'Rubik, sans-serif' }}>{detailQty}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => setDetailQty(Math.min(selectedVariant.stock_quantity, detailQty + 1))}
                                    style={{ width: '36px', height: '36px', border: 'none', background: 'transparent', fontSize: '1.2rem', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
                                  >+</button>
                                </div>
                                <span style={{ fontSize: '0.88rem', color: '#64748B' }}>
                                  มีสินค้าทั้งหมด {selectedVariant.stock_quantity} ชิ้น
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons Row */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <button 
                              type="button"
                              onClick={addToCart}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '8px', 
                                padding: '14px 20px', 
                                borderRadius: '10px', 
                                border: '1.5px solid #FF6300', 
                                backgroundColor: '#FEE9E9', 
                                color: '#FF6300', 
                                fontWeight: 700, 
                                fontSize: '1.05rem', 
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <img 
                                src="/checkout_images/output-onlinepngtools 1.svg" 
                                alt="Add to Cart" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/cart_add_icon.svg';
                                }}
                                style={{ width: '22px', height: '22px', objectFit: 'contain' }} 
                              />
                              <span>เพิ่มลงตะกร้า</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                if (selectedVariant) {
                                  const varToUse = selectedVariant;
                                  setSelectedProduct(null);
                                  triggerCheckout({ variant: varToUse, product: selectedProduct, qty: detailQty });
                                }
                              }}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '8px', 
                                padding: '14px 20px', 
                                borderRadius: '10px', 
                                border: 'none', 
                                backgroundColor: '#FF3201', 
                                color: '#FFFFFF', 
                                fontWeight: 700, 
                                fontSize: '1.05rem', 
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(255, 50, 1, 0.35)',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <span>สั่งซื้อสินค้า</span>
                            </button>
                          </div>

                        </div>
                      </div>

                      {/* PRODUCT DETAILS & SPECIFICATION CARD */}
                      <div style={{ background: '#FFFFFF', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', padding: '36px' }}>
                        <h3 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                          รายละเอียดสินค้า
                        </h3>
                        
                        <div style={{ fontSize: '1rem', color: '#0F172A', fontWeight: 600, marginBottom: '16px' }}>
                          {selectedProduct.name}
                        </div>

                        {/* SECTION 1: SPEC TABLE (LEFT) & VERTICAL PUMP STANDING IMAGE (RIGHT) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '36px', alignItems: 'start', marginBottom: '40px' }}>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', border: '1px solid #555555' }}>
                              <thead>
                                <tr style={{ background: '#EAEAEA' }}>
                                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#0F172A', border: '1px solid #555555', width: '32%' }}>
                                    {selectedProduct.spec_headers?.[0] || 'หัวข้อข้อมูล'}
                                  </th>
                                  <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#0F172A', border: '1px solid #555555' }}>
                                    {selectedProduct.spec_headers?.[1] || 'รายละเอียดทางเทคนิค (Details)'}
                                  </th>
                                  {selectedProduct.spec_headers?.[2] && (
                                    <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: '#0F172A', border: '1px solid #555555', width: '25%' }}>
                                      {selectedProduct.spec_headers[2]}
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const tableRows = (selectedProduct.spec_table && selectedProduct.spec_table.length > 0)
                                    ? selectedProduct.spec_table
                                    : [
                                        { col1: 'แบรนด์', col2: 'TERA (TERA GROUP)' },
                                        { col1: 'ชื่อรุ่น', col2: 'SI4VS5.2-101-110-1100' },
                                        { col1: 'ประเภทสินค้า', col2: 'ปั๊มน้ำบาดาลโซล่าเซลล์บัสเลส\nSolar Brushless Submersible Pump' },
                                        { col1: 'กำลังไฟฟ้า', col2: '1,100 วัตต์ (1100 W) / 1.5 แรงม้า (1.5 HP)' },
                                        { col1: 'แรงดันไฟฟ้าใช้งาน', col2: '80 - 210 VDC (Optimal input voltage: 110V)' },
                                        { col1: 'กระแสไฟฟ้าสูงสุด', col2: '< 17 A' },
                                        { col1: 'ความเร็วรอบมอเตอร์', col2: '0 - 4,000 รอบ/นาที (r/min)' },
                                        { col1: 'ขนาดท่อส่งน้ำ', col2: '1 1/4 นิ้ว (1.25 นิ้ว)' },
                                        { col1: 'ระยะสูบส่งสูง', col2: '0 - 84 - 101 เมตร' },
                                        { col1: 'ปริมาณน้ำสูงสุด', col2: '5.2 - 2 - 0 ลูกบาศก์เมตร/ชั่วโมง (m³/h)' },
                                        { col1: 'ระดับการป้องกัน', col2: 'IP68' },
                                        { col1: 'ฉนวนกันความร้อน', col2: 'Class F' },
                                        { col1: 'มาตรฐานรับรอง', col2: 'CE Approved' },
                                        { col1: 'น้ำหนักสินค้า', col2: 'น้ำหนักสุทธิ (N.W.): 11.2 KG / น้ำหนักรวมกล่อง (G.W.): 13.2 KG' },
                                        { col1: 'ขนาดบรรจุภัณฑ์', col2: '979 x 145 x 240 มม' },
                                        { col1: 'ระยะการรับประกัน', col2: '2 ปีเต็ม (2 YEARS WARRANTY)' },
                                        { col1: 'ข้อควรระวัง', col2: 'ใช้ร่วมกับกระแสไฟจากแผงโซล่าเซลล์เท่านั้น' }
                                      ];

                                  return tableRows.map((row: any, idx: number) => {
                                    const col1 = row.col1 || row.label || '';
                                    const col2 = row.col2 || row.val || row.value || '';
                                    const col3 = row.col3 || '';

                                    return (
                                      <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                                        <td style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 600, color: '#334155', border: '1px solid #555555', whiteSpace: 'nowrap' }}>{col1}</td>
                                        <td style={{ padding: '8px 16px', textAlign: 'left', color: '#0F172A', border: '1px solid #555555', whiteSpace: 'pre-line', lineHeight: 1.4 }}>{col2}</td>
                                        {selectedProduct.spec_headers?.[2] && (
                                          <td style={{ padding: '8px 16px', textAlign: 'center', color: '#475569', border: '1px solid #555555' }}>{col3}</td>
                                        )}
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img 
                              src={selectedProduct.detail_image_1 || "/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_32 PM 1.svg"} 
                              alt="Vertical Pump Standing Body" 
                              onError={(e) => { (e.target as HTMLImageElement).src = '/checkout_images/image 205.svg'; }}
                              style={{ width: '100%', maxWidth: '260px', height: 'auto', objectFit: 'contain' }} 
                            />
                          </div>
                        </div>

                        {/* SECTION 2: ADDITIONAL ADVICE (LEFT) & PUMP TOP HEAD IMAGE (RIGHT) - ALIGNED HORIZONTALLY ON THE SAME LINE */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '36px', alignItems: 'start', marginBottom: '40px' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', textDecoration: 'underline', marginBottom: '14px' }}>
                              ข้อแนะนำเพิ่มเติม
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', fontSize: '0.88rem', color: '#334155', lineHeight: 1.85 }}>
                              {(() => {
                                const adviceList = (selectedProduct.advice_list && selectedProduct.advice_list.length > 0)
                                  ? selectedProduct.advice_list
                                  : [
                                      'ห้ามดัดแปลง แก้ไขสินค้า หรือนำไปใช้งานผิดประเภท',
                                      'ห้ามใช้สารเคมีที่มีฤทธิ์เป็นกรด และด่างทำความสะอาด',
                                      'จัดเก็บในที่แห้ง และพ้นมือเด็ก',
                                      'ห้ามจัดเก็บใกล้ความร้อน และเปลวไฟ',
                                      'ห้ามใช้งานร่วมกับอุปกรณ์ที่ไม่ได้มาตรฐาน',
                                      'หากสินค้าชำรุดเสียหาย ควรส่งให้ช่างเป็นผู้ซ่อม'
                                    ];
                                return adviceList.map((item: string, idx: number) => (
                                  <li key={idx}>• {item}</li>
                                ));
                              })()}
                            </ul>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <img 
                              src={selectedProduct.detail_image_2 || "/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_35 PM 1.svg"} 
                              alt="Pump Top Head Close-up" 
                              onError={(e) => { (e.target as HTMLImageElement).src = '/checkout_images/image 186.svg'; }}
                              style={{ width: '100%', maxWidth: '260px', height: 'auto', objectFit: 'contain' }} 
                            />
                          </div>
                        </div>

                        {/* ACCESSORIES TABLE (อุปกรณ์สินค้าที่ใช้ร่วมกับสินค้าตัวนี้ได้) */}
                        <div style={{ marginBottom: '36px' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
                            อุปกรณ์สินค้าที่ใช้ร่วมกับสินค้าตัวนี้ได้ :
                          </div>
                          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #000000' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                              <thead>
                                <tr style={{ background: '#F1F1F1', borderBottom: '1px solid #000000' }}>
                                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>ชื่อสินค้า</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>สเปกแนะนำ</th>
                                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>ประเภท</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[
                                  { item: 'แผงโซลาร์เซลล์ Mono', spec: '500W (ใช้ออกแบบเซ็ต 3-4 แผง)', cat: 'Power' },
                                  { item: 'สายไฟจุ่มน้ำ VCT 3 Core', spec: '3 X 2.5 mm² (ยาว 30m / 50m)', cat: 'Cable' },
                                  { item: 'สลิงสแตนเลส 304', spec: 'หนา 4 mm (รับน้ำหนักปั๊ม)', cat: 'Rigging' },
                                  { item: 'ฝาปิดปากบ่อบาดาล', spec: 'ขนาด 4 นิ้ว (ท่อออก 1 1/4")', cat: 'Hardware' },
                                  { item: 'ชุดตู้ควบคุม DC กันฟ้าผ่า', spec: 'DC Surge + Breaker Box', cat: 'Safety' },
                                  { item: 'ข้อต่อเกลียวนอก', spec: 'ทองเหลือง/สแตนเลส 1 1/4"', cat: 'Fitting' }
                                ].map((acc, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                                    <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0F172A' }}>{acc.item}</td>
                                    <td style={{ padding: '10px 16px', color: '#475569' }}>{acc.spec}</td>
                                    <td style={{ padding: '10px 16px', fontWeight: 700, color: '#0763B3' }}>{acc.cat}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* COMPATIBLE / RELATED PRODUCTS GRID */}
                        <div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                            สินค้าที่สามารถใช้งานร่วมกับสินค้าชิ้นนี้ได้ :
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {[
                              { name: 'แผงโซลาร์เซลล์ Mono 550W', desc: 'N-Type Tier 1', price: 3500, img: '/checkout_images/image 206.svg' },
                              { name: 'ตู้ป้องกันไฟฟ้า DC สำเร็จรูป', desc: 'Breaker + Surge Protection', price: 1450, img: '/checkout_images/image 207.svg' },
                              { name: 'สายไฟจุ่มน้ำ VCT 3-Core (50m)', desc: 'ขนาด 3x2.5 sq.mm', price: 2250, img: '/checkout_images/image 208.svg' },
                              { name: 'สลิงสแตนเลส 304 (50m)', desc: 'หนา 4 มม. + กิ๊บล็อก', price: 980, img: '/checkout_images/image 209.svg' },
                              { name: 'ชุดลูกลอย & เซนเซอร์น้ำแห้ง', desc: 'ตัดการทำงานอัตโนมัติ', price: 450, img: '/checkout_images/image 186.svg' },
                              { name: 'ฝาปิดปากบ่อบาดาล 4 นิ้ว', desc: 'รูท่อออก 1.25 นิ้ว', price: 450, img: '/checkout_images/image 156.svg' }
                            ].map((item, idx) => (
                              <div 
                                key={idx}
                                style={{
                                  background: '#FFFFFF',
                                  borderRadius: '16px',
                                  border: '1px solid rgba(0,0,0,0.12)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                  padding: '16px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                  transition: 'transform 0.2s ease, boxShadow 0.2s ease'
                                }}
                              >
                                <div style={{ width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A', marginBottom: '4px' }}>{item.name}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{item.desc}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                  <span style={{ color: '#FF3201', fontWeight: 700, fontSize: '1.05rem', fontFamily: 'Rubik, sans-serif' }}>
                                    ฿ {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                  </span>
                                  <button 
                                    type="button"
                                    onClick={() => showToast(`เพิ่ม ${item.name} ลงตะกร้าเรียบร้อย`)}
                                    style={{ background: '#FF3201', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 4px rgba(255,50,1,0.3)' }}
                                  >
                                    สั่งซื้อ
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    /* NORMAL CATALOG MAIN AREA (Banner Carousel + Price Filter + Product Grid) */
                    <>
                      {/* SHOWCASE PROMOTIONAL POSTER CAROUSEL (Hide when searching) */}
                      {!isSearchCommitted && !searchText.trim() && (
                        <div 
                          onMouseEnter={() => setIsPromoHovered(true)}
                          onMouseLeave={() => setIsPromoHovered(false)}
                          style={{
                            position: 'relative',
                            width: '100%',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0'
                          }}
                        >
                          {/* Main Poster Display Image with Smooth Transition */}
                          <div style={{ position: 'relative', width: '100%', minHeight: '340px', maxHeight: '420px', overflow: 'hidden' }}>
                            <img 
                              src={promoPosters[promoSlideIndex].src} 
                              alt={promoPosters[promoSlideIndex].title} 
                              style={{ width: '100%', height: '100%', display: 'block', maxHeight: '420px', objectFit: 'cover', transition: 'opacity 0.4s ease-in-out' }} 
                            />
                            
                            {/* Left Arrow Button */}
                            <button 
                              type="button"
                              onClick={() => setPromoSlideIndex((prev) => (prev === 0 ? promoPosters.length - 1 : prev - 1))}
                              style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(255, 255, 255, 0.85)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid #CBD5E1',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#0F172A',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 10,
                                transition: 'all 0.2s ease'
                              }}
                              title="รูปก่อนหน้า"
                            >
                              <ChevronLeft size={22} />
                            </button>

                            {/* Right Arrow Button */}
                            <button 
                              type="button"
                              onClick={() => setPromoSlideIndex((prev) => (prev + 1) % promoPosters.length)}
                              style={{
                                position: 'absolute',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(255, 255, 255, 0.85)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid #CBD5E1',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#0F172A',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 10,
                                transition: 'all 0.2s ease'
                              }}
                              title="รูปถัดไป"
                            >
                              <ChevronRight size={22} />
                            </button>
                          </div>

                          {/* Interactive Pagination Dots Bar */}
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '12px 0 16px', alignItems: 'center', background: '#FFFFFF' }}>
                            {promoPosters.map((poster, idx) => (
                              <div 
                                key={poster.id}
                                onClick={() => setPromoSlideIndex(idx)}
                                style={{
                                  width: promoSlideIndex === idx ? '24px' : '11px',
                                  height: '11px',
                                  borderRadius: '6px',
                                  background: promoSlideIndex === idx ? '#FF3201' : '#FFFFFF',
                                  border: '1px #FF3201 solid',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                                title={poster.title}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TOP FILTER BAR: Price Slider & Contact Officer Button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', background: '#FFFFFF', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(0, 0, 0, 0.15)', flexWrap: 'wrap' }}>
                        
                        {/* Price Range Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
                          <span style={{ fontSize: '15px', fontFamily: "'IBM Plex Sans Thai', sans-serif", color: '#000000', fontWeight: 500 }}>ช่วงราคา :</span>
                          <input 
                            type="range" 
                            min="0" 
                            max="50000" 
                            step="500" 
                            value={priceRange} 
                            onChange={(e) => setPriceRange(parseInt(e.target.value))}
                            style={{ flex: 1, accentColor: '#FF3201', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '15px', fontFamily: "'IBM Plex Sans Thai', sans-serif", color: '#000000', fontWeight: 500 }}>
                            ฿ <strong style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 600 }}>{priceRange.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                          </span>
                        </div>

                        {/* Contact Officer Button */}
                        <button 
                          type="button"
                          onClick={() => showToast('เจ้าหน้าที่พร้อมบริการข้อมูลเพิ่มเติมผ่าน LINE @teragroup')}
                          style={{
                            background: '#FFFFFF',
                            border: '1px #FF3201 solid',
                            borderRadius: '7px',
                            color: '#FF3201',
                            padding: '8px 18px',
                            fontSize: '15px',
                            fontFamily: "'IBM Plex Sans Thai', sans-serif",
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <Headphones size={18} style={{ color: '#FF3201' }} />
                          <span>ติดต่อสอบถามเจ้าหน้าที่</span>
                        </button>
                      </div>

                      {/* PRODUCT CARD GRID (6 Cards - 3 Columns x 2 Rows) */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                        {filterProducts().length === 0 ? (
                          <div style={{ gridColumn: '1 / -1', background: '#FFFFFF', padding: '40px', borderRadius: '16px', textAlign: 'center', color: '#64748B' }}>
                            ไม่พบสินค้าตรงกับตัวกรองที่เลือก
                          </div>
                        ) : (
                          filterProducts().map((prod) => (
                            <div 
                              key={prod.id}
                              onClick={() => openProductDetail(prod)}
                              style={{
                                background: '#FFFFFF',
                                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                                borderRadius: '11px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                cursor: 'pointer',
                                border: '1px solid #E2E8F0',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                              }}
                            >
                              {/* Product Image */}
                              <div style={{ width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', background: '#F8FAFC', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ProductImage name={prod.name} imageUrl={prod.image_url} />
                              </div>

                              {/* Product Title */}
                              <div style={{ fontSize: '14px', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 600, color: '#0F172A', marginBottom: '12px', minHeight: '40px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {prod.name}
                              </div>

                              {/* Footer: Price & Order Button */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                                <div style={{ fontSize: '18px', color: '#FF3201', fontFamily: "'Rubik', 'IBM Plex Sans Thai', sans-serif", fontWeight: 700 }}>
                                  ฿ {parseFloat(prod.price).toLocaleString()}
                                </div>
                                
                                <button 
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openProductDetail(prod); }}
                                  style={{
                                    background: '#FF3201',
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '5px',
                                    padding: '6px 16px',
                                    fontSize: '15px',
                                    fontFamily: "'IBM Plex Sans Thai', sans-serif",
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)'
                                  }}
                                >
                                  สั่งซื้อ
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* PAGINATION / VIEW ALL BUTTON */}
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', marginBottom: '24px' }}>
                        <button 
                          type="button"
                          onClick={() => {
                            setSearchText('');
                            setSelectedCategory('ทั้งหมด');
                            setPriceRange(50000);
                            setSelectedBrands([]);
                            setSelectedVoltage([]);
                            setSelectedPower([]);
                            setSelectedIpRating([]);
                            showToast('แสดงสินค้าทั้งหมดในระบบเรียบร้อย');
                          }}
                          style={{
                            background: '#FFFFFF',
                            border: '1px #FF3201 solid',
                            borderRadius: '10px',
                            color: '#E02B00',
                            padding: '8px 28px',
                            fontSize: '15px',
                            fontFamily: "'IBM Plex Sans Thai', sans-serif",
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          ดูทั้งหมด
                        </button>
                      </div>
                    </>
                  )}

                </div>
              </div>

            </div>
          </section>
        )}

        {/* CART TAB */}
        {activeTab === 'cart' && (
          <section id="tab-cart" className="tab-section active full-width-tab" style={{ background: '#F3F3F3', minHeight: '75vh', width: '100%' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 40px', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
              <div style={{ maxWidth: '1273px', margin: '0 auto' }}>
                
                {/* Breadcrumb Navigation - Matched 100% with Products page */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 500, color: '#0763B3', marginBottom: '20px' }}>
                  <span 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} 
                    onClick={() => setActiveTab('home')}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    หน้าแรก
                  </span>
                  <span style={{ color: '#0763B3' }}>&gt;</span>
                  <span style={{ fontWeight: 700, color: '#0763B3' }}>ตะกร้าสินค้า</span>
                </div>

              {/* Title Section with Orange Vertical Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '4px', height: '24px', background: '#E02B00', borderRadius: '2px', flexShrink: 0 }} />
                <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000000', margin: 0 }}>
                  ตะกร้าสินค้าของฉัน
                </h2>
              </div>

              {/* Main Container matching Figma dimensions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 346px', gap: '30px', alignItems: 'flex-start' }}>
                
                {/* Left Column: Cart Items or Empty Graphic State */}
                <div>
                  {cartItems.length === 0 ? (
                    /* STATE 1: EMPTY CART PAGE (ตะกร้าสินค้าที่ไม่มีสินค้า) */
                    <div style={{ background: '#FFFFFF', borderRadius: '13px', padding: '70px 24px', textAlign: 'center', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.1)', border: '1px rgba(0, 0, 0, 0.1) solid', minHeight: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '125px', height: '125px', margin: '0 auto 20px auto', opacity: 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src="/cart_empty_images/img_4.png" 
                          alt="Empty Cart Illustration" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/cart_empty_images/img_6.png';
                          }}
                          style={{ width: '125px', height: '125px', objectFit: 'contain', filter: 'grayscale(100%)' }} 
                        />
                      </div>

                      <div style={{ fontSize: '24px', fontWeight: 600, color: '#000000', opacity: 0.35, marginBottom: '24px' }}>
                        ไม่มีสินค้าในตะกร้า
                      </div>

                      <button 
                        className="btn btn-primary" 
                        onClick={() => { setActiveTab('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        style={{ padding: '12px 32px', fontSize: '15px', fontWeight: 600, borderRadius: '10px', background: '#FF3201', border: 'none', color: '#FFFFFF', cursor: 'pointer', boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)' }}
                      >
                        ไปเลือกซื้อสินค้า
                      </button>
                    </div>
                  ) : (
                    /* STATE 2: FILLED CART PAGE (ตะกร้าสินค้าที่มีสินค้าอยู่) */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      
                      {/* Select all header bar */}
                      <div style={{ background: '#FFFFFF', padding: '14px 20px', borderRadius: '7px', border: '1px rgba(0, 0, 0, 0.25) solid', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: 600, color: '#000000' }}>
                          <input 
                            type="checkbox" 
                            checked={cartItems.every(i => i.selected !== false)}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setCartItems(prev => prev.map(i => ({ ...i, selected: val })));
                            }}
                            style={{ width: '22px', height: '22px', accentColor: '#FF3201', cursor: 'pointer' }}
                          />
                          <span>เลือกสินค้าทั้งหมด</span>
                        </label>

                        <button 
                          onClick={() => {
                            setCartItems(prev => prev.filter(i => !i.selected));
                            showToast('ลบรายการที่เลือกเรียบร้อยแล้ว');
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={15} /> ลบที่เลือก
                        </button>
                      </div>

                      {/* Items List Cards */}
                      {cartItems.map((item) => (
                        <div 
                          key={item.cart_item_id} 
                          style={{ 
                            background: '#FFFFFF', 
                            borderRadius: '7px', 
                            padding: '16px 20px', 
                            border: '1px rgba(0, 0, 0, 0.25) solid', 
                            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.1)',
                            display: 'grid',
                            gridTemplateColumns: 'auto 70px 1fr auto auto auto',
                            gap: '16px',
                            alignItems: 'center'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={item.selected !== false}
                            onChange={() => {
                              setCartItems(prev => prev.map(i => i.cart_item_id === item.cart_item_id ? { ...i, selected: !(i.selected !== false) } : i));
                            }}
                            style={{ width: '22px', height: '22px', accentColor: '#FF3201', cursor: 'pointer' }}
                          />

                          <div style={{ width: '70px', height: '69px', background: '#FFFFFF', borderRadius: '4px', border: '1px solid #E2E8F0', overflow: 'hidden', flexShrink: 0 }}>
                            <ProductImage name={item.name} imageUrl={item.image_url || '/cart_with_items_images/img_1.png'} />
                          </div>

                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#000000', lineHeight: 1.4 }}>{item.name}</div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>รุ่น: {item.variant_name}</div>
                          </div>

                          {/* Quantity selector matching Figma lighter background */}
                          <div style={{ width: '97px', height: '23px', background: '#FFFFFF', borderRadius: '5px', border: '1px solid rgba(0, 0, 0, 0.35)', boxShadow: '0px 1px 2px rgba(0,0,0,0.08) inset', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px', boxSizing: 'border-box' }}>
                            <button 
                              onClick={() => updateCartQty(item.cart_item_id, item.quantity - 1)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', fontWeight: 600, color: '#000', opacity: 0.5, padding: 0 }}
                            >
                              -
                            </button>
                            <span style={{ fontSize: '15px', fontWeight: 600, color: '#FF3201' }}>{item.quantity}</span>
                            <button 
                              onClick={() => updateCartQty(item.cart_item_id, item.quantity + 1)}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', fontWeight: 600, color: '#000', padding: 0 }}
                            >
                              +
                            </button>
                          </div>

                          {/* Price */}
                          <div style={{ fontSize: '15px', fontWeight: 600, color: '#080808', minWidth: '90px', textAlign: 'right' }}>
                            ฿ {(parseFloat(item.price) * item.quantity).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>

                          {/* Delete item button */}
                          <button 
                            onClick={() => deleteCartItem(item.cart_item_id)}
                            style={{ border: 'none', background: 'transparent', color: 'rgba(0,0,0,0.45)', cursor: 'pointer', padding: '4px' }}
                            title="ลบ"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Order Summary Card (สรุปคำสั่งซื้อ) matching Figma code 100% */}
                <div style={{ width: '346px', background: '#FFFFFF', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.1)', borderRadius: '13px', border: '1px solid #CBD5E1', padding: '24px', boxSizing: 'border-box', position: 'sticky', top: '90px' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#000000', marginBottom: '20px', borderBottom: '1px solid #F0F0F0', paddingBottom: '12px' }}>
                    สรุปคำสั่งซื้อ
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '15px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 400, color: '#000000' }}>ยอดรวมราคาสินค้า :</span>
                      <span style={{ fontWeight: 600, color: '#000000' }}>
                        ฿ {cartItems.length > 0 ? calculateSubtotal().toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 400, color: '#000000' }}>ภาษีมูลค่าเพิ่ม ( VAT 7% ) :</span>
                      <span style={{ fontWeight: 600, color: '#000000' }}>
                        ฿ {cartItems.length > 0 ? calculateTax().toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 400, color: '#000000' }}>ค่าจัดส่ง :</span>
                      <span style={{ fontWeight: 400, color: '#059669' }}>ฟรีค่าบริการ</span>
                    </div>
                  </div>

                  {/* Coupon Code Input Box matching Figma style */}
                  <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <div style={{ display: 'flex', width: '100%', height: '35px', background: '#FFFFFF', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25) inset', borderRadius: '10px', border: '1px rgba(0, 0, 0, 0.25) solid', overflow: 'hidden' }}>
                      <input 
                        type="text" 
                        value={cartCouponInput} 
                        onChange={(e) => setCartCouponInput(e.target.value)} 
                        placeholder="ใส่โค้ดส่วนลดตรงนี่ >>" 
                        style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: '13px', fontWeight: 600, color: '#000000', opacity: cartCouponInput ? 1 : 0.6 }} 
                      />
                      <button 
                        onClick={() => {
                          if (!cartCouponInput.trim()) {
                            showToast('กรุณากรอกโค้ดส่วนลด');
                            return;
                          }
                          if (cartCouponInput.toUpperCase() === 'TERA100' || cartCouponInput.toUpperCase() === 'PROMO100') {
                            setAppliedCartDiscount(100);
                            setAppliedCouponCode(cartCouponInput.toUpperCase());
                            showToast('ใช้โค้ดส่วนลด 100 บาทสำเร็จ!');
                          } else {
                            showToast('โค้ดส่วนลดไม่ถูกต้อง');
                          }
                        }}
                        style={{ width: '53px', height: '100%', background: '#D9D9D9', border: 'none', borderLeft: '1px rgba(0, 0, 0, 0.25) solid', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <img 
                          src="/cart_empty_images/img_1.png" 
                          alt="Apply Coupon" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/cart_empty_images/right-arrow 1.svg';
                          }}
                          style={{ width: '23px', height: '23px', objectFit: 'contain', opacity: 0.6 }} 
                        />
                      </button>
                    </div>
                    {appliedCouponCode && (
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                        ✓ ส่วนลดคูปอง {appliedCouponCode} (-100 ฿)
                      </div>
                    )}
                  </div>

                  {/* Net Total Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0F0F0', paddingTop: '16px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>ยอดรวมสุทธิ :</span>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#FF3201' }}>
                      ฿ {cartItems.length > 0 ? Math.max(0, calculateSubtotal() - appliedCartDiscount + calculateTax()).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </span>
                  </div>

                  {/* Primary CTA Checkout Button - Text ONLY (No Icon) */}
                  <button 
                    className="btn btn-primary" 
                    disabled={cartItems.length === 0 || cartItems.filter(i => i.selected !== false).length === 0} 
                    onClick={() => triggerCheckout()}
                    style={{ 
                      width: '100%', 
                      height: '48px', 
                      background: cartItems.length > 0 && cartItems.some(i => i.selected !== false) ? '#FF3201' : '#989391', 
                      boxShadow: '0px 2px 4.1px rgba(0, 0, 0, 0.25)', 
                      borderRadius: '10px', 
                      border: 'none',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: cartItems.length > 0 && cartItems.some(i => i.selected !== false) ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span>ดำเนินการสั่งซื้อสินค้า</span>
                  </button>
                </div>

                </div>
              </div>
            </div>
          </section>
        )}

        {/* CHECKOUT TAB (Matched 100% with หน้ากรอกที่อยู่และชำระเงิน.svg) */}
        {activeTab === 'checkout' && (
          <section id="tab-checkout" className="tab-section active full-width-tab" style={{ background: '#F3F3F3', minHeight: '75vh', width: '100%' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 40px', fontFamily: "'IBM Plex Sans Thai', sans-serif" }}>
              <div style={{ maxWidth: '1273px', margin: '0 auto' }}>
                
                {/* Breadcrumb Navigation - Standardized */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontFamily: "'IBM Plex Sans Thai', sans-serif", fontWeight: 500, color: '#0763B3', marginBottom: '20px' }}>
                  <span 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} 
                    onClick={() => setActiveTab('home')}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    หน้าแรก
                  </span>
                  <span style={{ color: '#0763B3' }}>&gt;</span>
                  <span 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} 
                    onClick={() => setActiveTab('cart')}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    ตะกร้าสินค้า
                  </span>
                  <span style={{ color: '#0763B3' }}>&gt;</span>
                  <span style={{ fontWeight: 700, color: '#0763B3' }}>กรอกที่อยู่และชำระเงิน</span>
                </div>

                {/* Title Section with Orange Vertical Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <div style={{ width: '4px', height: '24px', background: '#E02B00', borderRadius: '2px', flexShrink: 0 }} />
                  <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#000000', margin: 0 }}>
                    กรอกที่อยู่และชำระเงิน
                  </h2>
                </div>

                {/* Main 2-Column Layout */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 346px', gap: '24px', alignItems: 'start' }}>
                  
                  {/* LEFT COLUMN: Address Form & Payment Method Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* CARD 1: ข้อมูลและที่อยู่สำหรับจัดส่ง */}
                    <div style={{ background: '#FFFFFF', borderRadius: '28px', border: '1px solid #CBD5E1', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.1)', padding: '28px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img 
                            src="/address_payment_images/maps-and-flags 1.svg" 
                            alt="Maps and Flags Icon" 
                            onError={(e) => { (e.target as HTMLImageElement).src = '/maps-and-flags_1.svg'; }}
                            style={{ width: '33px', height: '33px', objectFit: 'contain' }} 
                          />
                          <span style={{ fontSize: '16px', fontWeight: 600, color: '#000000' }}>ข้อมูลและที่อยู่สำหรับจัดส่ง</span>
                        </div>
                        <span 
                          onClick={() => {
                            const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
                            if (defaultAddr) {
                              setReceiverName(defaultAddr.receiver_name || user?.username || '');
                              setNewAddress({
                                province: defaultAddr.province || '',
                                district: defaultAddr.district || '',
                                subdistrict: defaultAddr.sub_district || defaultAddr.subdistrict || '',
                                postalCode: defaultAddr.postal_code || (defaultAddr as any).postalCode || '',
                                detail: defaultAddr.address_detail || defaultAddr.detail || '',
                                phone: defaultAddr.phone || ''
                              });
                              setSelectedAddressId(defaultAddr.id);
                              showToast('ดึงข้อมูลที่อยู่ปัจจุบันเรียบร้อยแล้ว');
                            } else if (user) {
                              const rName = user.username || 'ลูกค้า';
                              const rPhone = user.phone || '0812345678';
                              const rDetail = '123 ม.1 ถ.เพชรเกษม';
                              const rProv = 'สตูล';
                              const rDist = 'ท่าแพ';
                              const rSub = 'ท่าแพ';
                              const rZip = '91150';

                              setReceiverName(rName);
                              setNewAddress({
                                province: rProv,
                                district: rDist,
                                subdistrict: rSub,
                                postalCode: rZip,
                                detail: rDetail,
                                phone: rPhone
                              });

                              apiRequest('/api/v1/addresses', 'POST', {
                                receiver_name: rName,
                                phone: rPhone,
                                address_detail: rDetail,
                                sub_district: rSub,
                                district: rDist,
                                province: rProv,
                                postal_code: rZip,
                                is_default: true
                              }).then(saved => {
                                if (saved.data && saved.data.id) {
                                  setSelectedAddressId(saved.data.id);
                                  fetchAddresses();
                                }
                              }).catch(err => console.error('Error saving address:', err));

                              showToast('ดึงข้อมูลที่อยู่ผู้ใช้เรียบร้อยแล้ว');
                            } else {

                              showToast('ไม่พบข้อมูลที่อยู่ปัจจุบัน');
                            }
                          }}
                          style={{ fontSize: '16px', fontWeight: 600, color: '#FF3201', cursor: 'pointer', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                        >
                          ใช้ที่อยู่ปัจจุบัน
                        </span>
                      </div>

                      {/* Form Fields Grid - Re-ordered: Receiver/Phone -> Address -> Province/District -> Subdistrict/PostalCode */}
                      {(() => {
                        const checkoutActiveProvince = thaiAddressDb.find((p: any) => p.name_th === newAddress.province);
                        const checkoutActiveDistrict = checkoutActiveProvince?.districts?.find((d: any) => d.name_th === newAddress.district);
                        const checkoutDistrictsList = checkoutActiveProvince ? checkoutActiveProvince.districts : [];
                        const checkoutSubdistrictsList = checkoutActiveDistrict ? checkoutActiveDistrict.sub_districts : [];

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Row 1: Receiver Name & Phone */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                <div style={{ fontSize: '16px', fontWeight: 400, color: '#000000', marginBottom: '8px' }}>
                                  ชื่อผู้รับสินค้า <span style={{ color: '#FF3201', fontWeight: 600 }}>*</span>
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="ชื่อ - นามสกุล (ห้ามมีตัวเลข)" 
                                  value={receiverName}
                                  onChange={(e) => setReceiverName(e.target.value)}
                                  style={{ width: '100%', height: '53px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '0 16px', fontSize: '16px', color: '#000000', outline: 'none' }}
                                />
                              </div>

                              <div>
                                <div style={{ fontSize: '16px', fontWeight: 400, color: '#000000', marginBottom: '8px' }}>
                                  เบอร์โทรศัพท์มือถือ <span style={{ color: '#FF3201', fontWeight: 600 }}>*</span>
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="ตัวเลข 10 หลัก" 
                                  value={newAddress.phone || ''}
                                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                  style={{ width: '100%', height: '53px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '0 16px', fontSize: '16px', color: '#000000', outline: 'none' }}
                                />
                              </div>
                            </div>

                            {/* Row 2: Address Detail Textarea */}
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: 400, color: '#000000', marginBottom: '8px' }}>
                                ที่อยู่จัดส่ง <span style={{ color: '#FF3201', fontWeight: 600 }}>*</span>
                              </div>
                              <textarea 
                                rows={3}
                                placeholder="บ้านเลขที่ / ซอย / ถนน / รายละเอียดที่อยู่" 
                                value={newAddress.detail || ''}
                                onChange={(e) => setNewAddress({ ...newAddress, detail: e.target.value })}
                                style={{ width: '100%', minHeight: '113px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '12px 16px', fontSize: '16px', color: '#000000', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
                              />
                            </div>

                            {/* Row 3: Province & District */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                <div style={{ fontSize: '16px', fontWeight: 400, color: '#000000', marginBottom: '8px' }}>
                                  จังหวัด
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="จังหวัด" 
                                  value={newAddress.province || ''}
                                  list="checkout-provinces-list"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const matchedProv = thaiAddressDb.find((p: any) => p.name_th === val);
                                    setNewAddress({ 
                                      ...newAddress, 
                                      province: val,
                                      district: matchedProv ? '' : newAddress.district,
                                      subdistrict: matchedProv ? '' : newAddress.subdistrict,
                                      postalCode: matchedProv ? '' : newAddress.postalCode
                                    });
                                  }}
                                  style={{ width: '100%', height: '53px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '0 16px', fontSize: '16px', color: '#000000', outline: 'none' }}
                                />
                                <datalist id="checkout-provinces-list">
                                  {thaiAddressDb.map((p: any) => (
                                    <option key={p.name_th} value={p.name_th} />
                                  ))}
                                </datalist>
                              </div>

                              <div>
                                <div style={{ fontSize: '16px', fontWeight: 400, color: '#000000', marginBottom: '8px' }}>
                                  เขต / อำเภอ
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="เขต / อำเภอ" 
                                  value={newAddress.district || ''}
                                  list="checkout-districts-list"
                                  disabled={!newAddress.province}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const matchedDist = checkoutActiveProvince?.districts?.find((d: any) => d.name_th === val);
                                    setNewAddress({ 
                                      ...newAddress, 
                                      district: val,
                                      subdistrict: matchedDist ? '' : newAddress.subdistrict,
                                      postalCode: matchedDist ? '' : newAddress.postalCode
                                    });
                                  }}
                                  style={{ width: '100%', height: '53px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '0 16px', fontSize: '16px', color: '#000000', outline: 'none', opacity: !newAddress.province ? 0.6 : 1 }}
                                />
                                <datalist id="checkout-districts-list">
                                  {checkoutDistrictsList.map((d: any) => (
                                    <option key={d.name_th} value={d.name_th} />
                                  ))}
                                </datalist>
                              </div>
                            </div>

                            {/* Row 4: Subdistrict & Postal Code */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              <div>
                                <div style={{ fontSize: '16px', fontWeight: 400, color: '#000000', marginBottom: '8px' }}>
                                  แขวง / ตำบล
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="แขวง / ตำบล" 
                                  value={newAddress.subdistrict || ''}
                                  list="checkout-subdistricts-list"
                                  disabled={!newAddress.district}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const matchedSub = checkoutActiveDistrict?.sub_districts?.find((s: any) => s.name_th === val);
                                    setNewAddress({ 
                                      ...newAddress, 
                                      subdistrict: val,
                                      postalCode: matchedSub ? matchedSub.zip_code.toString() : newAddress.postalCode
                                    });
                                  }}
                                  style={{ width: '100%', height: '53px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '0 16px', fontSize: '16px', color: '#000000', outline: 'none', opacity: !newAddress.district ? 0.6 : 1 }}
                                />
                                <datalist id="checkout-subdistricts-list">
                                  {checkoutSubdistrictsList.map((s: any) => (
                                    <option key={s.name_th} value={s.name_th} />
                                  ))}
                                </datalist>
                              </div>

                              <div>
                                <div style={{ fontSize: '16px', fontWeight: 400, color: '#000000', marginBottom: '8px' }}>
                                  รหัสไปรษณีย์
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="รหัสไปรษณีย์" 
                                  value={newAddress.postalCode || ''}
                                  onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                                  style={{ width: '100%', height: '53px', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #CBD5E1', padding: '0 16px', fontSize: '16px', color: '#000000', outline: 'none' }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* CARD 2: เลือกช่องทางการชำระเงิน */}
                    <div style={{ background: '#FFFFFF', borderRadius: '28px', border: '1px solid #CBD5E1', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.1)', padding: '28px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <img 
                          src="/address_payment_images/credit-card 1.svg" 
                          alt="Payment Method Icon" 
                          onError={(e) => { (e.target as HTMLImageElement).src = '/credit-card_1.svg'; }}
                          style={{ width: '33px', height: '33px', objectFit: 'contain' }} 
                        />
                        <span style={{ fontSize: '16px', fontWeight: 600, color: '#000000' }}>เลือกช่องทางการชำระเงิน</span>
                      </div>

                      {/* Payment Options Row - Reordered: 1. PromptPay, 2. TrueMoney, 3. Bank Transfer (Removed Credit Card) */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
                        {/* Option 1: PromptPay / QR (Image 31) */}
                        <div 
                          onClick={() => setPaymentMethod('qr')}
                          style={{
                            cursor: 'pointer',
                            width: '135px',
                            height: '52px',
                            borderRadius: '10px',
                            border: paymentMethod === 'qr' ? '2px solid #044F90' : '1px solid #CBD5E1',
                            padding: '4px 8px',
                            background: paymentMethod === 'qr' ? '#F0F9FF' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                        >
                          <img src="/address_payment_images/image 31.svg" alt="PromptPay Logo Image 31" style={{ maxHeight: '38px', maxWidth: '110px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = '/image_31.svg'; }} />
                        </div>

                        {/* Option 2: TrueMoney Wallet (Image 196) */}
                        <div 
                          onClick={() => setPaymentMethod('wallet')}
                          style={{
                            cursor: 'pointer',
                            width: '135px',
                            height: '52px',
                            borderRadius: '10px',
                            border: paymentMethod === 'wallet' ? '2px solid #044F90' : '1px solid #CBD5E1',
                            padding: '4px 8px',
                            background: paymentMethod === 'wallet' ? '#F0F9FF' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                        >
                          <img src="/address_payment_images/image 196.svg" alt="TrueMoney Image 196" style={{ maxHeight: '36px', maxWidth: '110px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = '/image_196.svg'; }} />
                        </div>

                        {/* Option 3: Bank Transfer (Image 197 + Blue Border) */}
                        <div 
                          onClick={() => setPaymentMethod('bank')}
                          style={{
                            cursor: 'pointer',
                            width: '135px',
                            height: '52px',
                            borderRadius: '10px',
                            background: paymentMethod === 'bank' ? '#F0F9FF' : '#FFFFFF',
                            border: '2px solid #044F90',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                            boxSizing: 'border-box'
                          }}
                        >
                          <img src="/address_payment_images/image 197.svg" alt="Bank Image 197" style={{ width: '22px', height: '22px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = '/image_197.svg'; }} />
                          <span style={{ color: '#005C83', fontSize: '15px', fontWeight: 600 }}>ธนาคาร</span>
                        </div>
                      </div>

                      {/* Upload Slip Zone */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#000000', marginBottom: '12px' }}>
                          อัปโหลดหลักฐานการโอนเงิน (สลิป) :
                        </div>
                        <label 
                          style={{
                            width: '100%',
                            minHeight: '118px',
                            background: '#FFFFFF',
                            borderRadius: '13px',
                            border: '1.5px dashed #94A3B8',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '16px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setSlipFile(e.target.files[0]);
                                setSlipPreview(URL.createObjectURL(e.target.files[0]));
                                showToast('เลือกไฟล์สลิปเรียบร้อย');
                              }
                            }}
                          />
                          {slipPreview ? (
                            <img src={slipPreview} alt="Slip Preview" style={{ maxHeight: '90px', objectFit: 'contain', borderRadius: '6px' }} />
                          ) : (
                            <>
                              <img 
                                src="/address_payment_images/image 198.svg" 
                                alt="Upload Icon Image 198" 
                                style={{ width: '66px', height: '66px', opacity: 0.8, objectFit: 'contain' }} 
                                onError={(e) => { (e.target as HTMLImageElement).src = '/image_198.svg'; }}
                              />
                              <span style={{ opacity: 0.55, color: '#000000', fontSize: '12px', fontWeight: 600, letterSpacing: '0.48px' }}>
                                คลิกที่นี่เพื่ออัปโหลดไฟล์รูปสลิป 
                              </span>
                            </>
                          )}
                        </label>
                      </div>

                    </div>
                  </div>

                  {/* RIGHT COLUMN: Order Summary Box (รายการสั่งซื้อ) */}
                  <div>
                    <div style={{ background: '#FFFFFF', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.1)', borderRadius: '13px', border: '1px solid #CBD5E1', padding: '24px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#000000', margin: '0 0 20px 0' }}>
                        รายการสั่งซื้อ
                      </h3>

                      {/* Items List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
                        {checkoutDirectItem ? (
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#000000' }}>
                              {checkoutDirectItem.product.name} ({checkoutDirectItem.variant.variant_name})
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#000000', opacity: 0.40 }}>
                                จำนวน {checkoutDirectItem.qty} ชิ้น
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#000000', fontFamily: 'Rubik' }}>
                                ฿ {(parseFloat(checkoutDirectItem.variant.price) * checkoutDirectItem.qty).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        ) : (
                          cartItems.filter(i => i.selected !== false).map((item) => (
                            <div key={item.cart_item_id}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: '#000000' }}>
                                {item.name} ({item.variant_name})
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#000000', opacity: 0.40 }}>
                                  จำนวน {item.quantity} ชิ้น
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#000000', fontFamily: 'Rubik' }}>
                                  ฿ {(parseFloat(item.price) * item.quantity).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Coupon Code Input Row matching Cart Page design 100% */}
                      <div style={{ marginBottom: '24px', position: 'relative' }}>
                        <div style={{ display: 'flex', width: '100%', height: '35px', background: '#FFFFFF', boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.1) inset', borderRadius: '10px', border: '1px solid #CBD5E1', overflow: 'hidden' }}>
                          <input 
                            type="text" 
                            placeholder="ใส่โค้ดส่วนลดตรงนี่ >>" 
                            value={promoCode} 
                            onChange={(e) => setPromoCode(e.target.value)}
                            disabled={!!activeCoupon}
                            style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontSize: '13px', fontWeight: 600, color: '#000000', opacity: promoCode ? 1 : 0.6 }} 
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              if (activeCoupon) removePromoCode();
                              else applyPromoCode();
                            }}
                            style={{ width: '53px', height: '100%', background: '#D9D9D9', border: 'none', borderLeft: '1px solid #CBD5E1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <img 
                              src="/cart_empty_images/img_1.png" 
                              alt="Apply Coupon" 
                              onError={(e) => { (e.target as HTMLImageElement).src = '/cart_empty_images/right-arrow 1.svg'; }}
                              style={{ width: '23px', height: '23px', objectFit: 'contain', opacity: 0.6 }} 
                            />
                          </button>
                        </div>
                        {activeCoupon && (
                          <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                            ✓ ส่วนลดคูปอง {activeCoupon.code || 'PROMO100'} (-100 ฿)
                          </div>
                        )}
                      </div>

                      {/* Summary Calculation Lines */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #F0F0F0', paddingTop: '16px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: 400, color: '#000000' }}>ยอดรวมราคาสินค้า :</span>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#000000', fontFamily: 'Rubik' }}>
                            ฿ {calculateSubtotal().toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: 400, color: '#000000' }}>ภาษีมูลค่าเพิ่ม ( VAT 7% ) :</span>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#000000', fontFamily: 'Rubik' }}>
                            ฿ {calculateTax().toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F0F0F0', paddingTop: '12px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#000000' }}>ยอดรวมสุทธิ :</span>
                          <span style={{ fontSize: '15px', fontWeight: 600, color: '#FF3201', fontFamily: 'Rubik' }}>
                            ฿ {Math.max(0, calculateSubtotal() - appliedCartDiscount + calculateTax()).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Confirm & Pay CTA Button */}
                      <button 
                        type="button"
                        onClick={submitOrder}
                        style={{
                          width: '100%',
                          height: '48px',
                          background: '#FF3201',
                          boxShadow: '0px 2px 4.1px rgba(0, 0, 0, 0.25)',
                          borderRadius: '10px',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '15px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        ยืนยันรายการและโอนเงิน
                      </button>

                    </div>
                  </div>

                </div>

              </div>
            </div>
          </section>
        )}

        {/* PAYMENT GATEWAY TAB */}
        {activeTab === 'payment' && (
          <section id="tab-payment" className="tab-section active">
            <div className="payment-container">
              <div className="payment-card">
                <h2>ขั้นตอนการชำระเงิน</h2>
                <div className="order-ref-badge">เลขที่ใบสั่งซื้อ: <span>{createdOrderId}</span></div>
                
                {verifiedPaymentInfo ? (
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="confirm-dialog-icon" style={{ background: 'var(--success-bg)', borderColor: 'var(--success-border)', color: 'var(--success)' }}>
                      <CheckCircle size={28} />
                    </div>
                    <h3 style={{ color: 'var(--success)' }}>ชำระเงินเสร็จสิ้นแล้ว!</h3>
                    <p>
                      ระบบได้ทำการตรวจสอบสลิปการโอนเงินจำนวน <strong>{parseFloat(verifiedPaymentInfo.ai_verified_amount).toFixed(2)} ฿</strong> เรียบร้อยแล้ว และอนุมัติใบสั่งซื้อนี้สำเร็จ
                    </p>
                    <div className="flex gap-sm" style={{ justifyContent: 'center', marginTop: '20px' }}>
                      <button className="btn btn-primary" onClick={() => { setActiveTab('profile'); setProfileSubTab('orders'); }}>
                        ดูสถานะคำสั่งซื้อพัสดุ
                      </button>
                      <button className="btn btn-secondary" onClick={() => { setActiveTab('catalog'); }}>
                        กลับไปช็อปปิ้งต่อ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="payment-gateway-layout">
                    {/* Left Column: QR Code display */}
                    <div className="payment-qr-side">
                      {paymentMethod === 'qr' && qrCodeData ? (
                        <>
                          <h3>ชำระเงินผ่าน พร้อมเพย์ QR Code</h3>

                          {qrExpireTimer === 0 ? (
                            <div className="payment-expired-card">
                              <h3>⚠️ คำสั่งซื้อนี้หมดเวลาชำระเงินแล้ว (เกิน 5 นาที)</h3>
                              <p>
                                ระบบได้ทำการยกเลิกคำสั่งซื้อนี้และคืนสต็อกสินค้าเรียบร้อยแล้ว เพื่อป้องกันการล็อกสินค้า กรุณากดเลือกซื้อและสั่งซื้อสินค้าใหม่อีกครั้ง
                              </p>
                              <button 
                                type="button" 
                                className="btn btn-primary btn-block"
                                onClick={() => {
                                  fetchOrders();
                                  setActiveTab('catalog');
                                }}
                              >
                                <ShoppingCart size={16} /> กลับไปเลือกซื้อและสั่งซื้อใหม่
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="payment-qr-box">
                                <img src={qrCodeData} alt="PromptPay QR Code" />
                              </div>
                              <div className="timer-ring-container">
                                <Clock size={16} />
                                <span className="text-muted">QR Code หมดอายุภายใน: {qrExpireTimer ? `${Math.floor(qrExpireTimer / 60)}:${('0' + (qrExpireTimer % 60)).slice(-2)}` : '0:00'} นาที</span>
                              </div>
                            </>
                          )}

                          {/* Real-time status indicator & simulation */}
                          <div className="card" style={{ marginTop: '20px', textAlign: 'center', maxWidth: '240px' }}>
                            <div className="flex items-center gap-sm" style={{ justifyContent: 'center', fontSize: '0.8rem', color: 'var(--success)', marginBottom: '10px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block', animation: 'pulseGlowGreen 1.5s infinite' }}></span>
                              <span>กำลังรอการสแกนชำระเงิน...</span>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await apiRequest(`/api/v1/payments/${createdOrderId}/simulate-webhook`, 'POST');
                                  showToast('จำลองส่งข้อมูลสำเร็จ! ระบบรับเงินเรียลไทม์แล้ว');
                                } catch (err: any) {
                                  showToast(err.message);
                                }
                              }}
                              className="btn btn-primary btn-sm btn-block"
                            >
                              <CheckCircle size={14} /> จำลองการสแกนจ่ายสำเร็จ
                            </button>
                          </div>
                        </>
                      ) : (
                        <div>
                          <h3>ช่องทางบัญชีโอนเงินธนาคาร</h3>
                          <div className="card" style={{ textAlign: 'left', maxWidth: '350px' }}>
                            <strong style={{ display: 'block' }}>ธนาคารกสิกรไทย (K-Bank)</strong>
                            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', display: 'block', margin: '6px 0' }}>012-3-45678-9</span>
                            <span className="text-muted" style={{ display: 'block', fontSize: '0.85rem' }}>ชื่อบัญชี: บจก. เทอรา สมาร์ท อีคอมเมิร์ซ</span>
                          </div>
                          <p className="text-muted mt-md" style={{ fontSize: '0.85rem' }}>โอนเงินจำนวน <strong>{createdOrderTotal.toFixed(2)} ฿</strong> และแนบสลิปด้านขวาครับ</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Upload slip and local OCR checks */}
                    <div className="card flex flex-col gap-md">
                      <h3>แนบสลิปโอนเงิน</h3>
                      <p className="text-muted">กรุณาแนบรูปภาพสลิปการโอนเงิน (ระบบจะทำการสแกนตรวจสอบความถูกต้อง ยอดเงิน และสิทธิ์การโอนโดยอัตโนมัติทันทีที่แนบไฟล์)</p>
                      
                      <div 
                        className="slip-upload-zone" 
                        onClick={() => document.getElementById('checkout-slip-input')?.click()}
                      >
                        <input 
                          type="file" 
                          id="checkout-slip-input" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleSlipFileSelect}
                        />
                        <Upload size={32} />
                        <p>คลิกเพื่อแนบภาพสลิป (สแกนอัตโนมัติทันที)</p>
                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>ไฟล์ JPG, PNG, WEBP (สูงสุด 5MB)</span>
                      </div>

                      {slipPreview && (
                        <div style={{ position: 'relative', marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                          <img src={slipPreview} alt="Preview" style={{ width: '45px', height: '45px', borderRadius: '4px', objectFit: 'cover' }} />
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <span style={{ fontSize: '0.8rem', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{slipFile?.name}</span>
                            <button className="remove-slip-btn" onClick={clearSlipSelection} style={{ color: 'var(--danger-color)', fontSize: '0.75rem', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>เปลี่ยนรูป / ลบออก</button>
                          </div>
                        </div>
                      )}

                      {/* Instant Scanning Status Loader */}
                      {isPaymentLoading && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', color: 'var(--primary-color)', marginTop: '10px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,50,1,0.05)', border: '1px dashed var(--primary-color)' }}>
                          <div className="spinner-small"></div>
                          <span style={{ fontWeight: 500 }}>{paymentStatusText}</span>
                        </div>
                      )}

                      {/* Manual Re-scan Button (Only if attached, failed/idle, and not currently verifying) */}
                      {slipFile && !isPaymentLoading && !verifiedPaymentInfo && (
                        <button 
                          className="btn btn-secondary btn-block" 
                          style={{ marginTop: '10px', fontSize: '0.82rem' }}
                          onClick={() => uploadSlip()}
                        >
                          <RefreshCw size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> สแกนตรวจสอบสลิปอีกครั้ง
                        </button>
                      )}

                      {/* Success Verification Box */}
                      {verifiedPaymentInfo && (
                        <div className="ai-verified-box" style={{ padding: '15px', border: '1px solid var(--success-color)', borderRadius: '8px', backgroundColor: 'rgba(0,186,124,0.05)', color: 'var(--text-main)', marginTop: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--success-color)' }}>
                            <ShieldCheck size={18} />
                            <strong>ระบบตรวจสอบสลิปอัตโนมัติ (OCR Verified)</strong>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                            <span>สถานะ: <strong style={{ color: 'var(--success-color)' }}>ถูกต้อง (ชำระเงินสำเร็จ)</strong></span>
                            <span>ยอดเงินโอน: {parseFloat(verifiedPaymentInfo.ai_verified_amount).toFixed(2)} ฿</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* PROFILE / HISTORY TAB */}
        {activeTab === 'profile' && (
          <section id="tab-profile" className={`tab-section active ${!user ? 'full-width-tab' : ''}`} style={!user ? { padding: 0, margin: 0, width: '100%', maxWidth: '100%', background: '#FF3201', minHeight: 'calc(100vh - 70px)' } : undefined}>
            {user ? (
              /* User Settings Panel - Split into sidebar and sub-panels */
              <div className="profile-layout">
                  
                  {/* Left Column: User details sidebar */}
                  <div className="profile-sidebar">
                    <div className="profile-avatar-large">
                      {user.profile_image ? (
                        <img src={user.profile_image} alt={user.username} />
                      ) : (
                        user.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="profile-username">{user.username}</div>
                    <div className="profile-email">{user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ลูกค้าสมาชิก (Customer)'}</div>
                    
                    <div className="profile-info-list">
                      <div className="profile-info-item" style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                        <Mail size={16} style={{ flexShrink: 0, marginTop: '3px' }} />
                        <span style={{ wordBreak: 'break-all', overflowWrap: 'anywhere', fontSize: '0.8rem', color: '#475569', maxWidth: '100%' }}>
                          {user.email}
                        </span>
                      </div>
                      <div className="profile-detail-item" style={{ marginTop: '12px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span className="profile-detail-label">เบอร์โทรศัพท์</span>
                          {user.phone ? (
                            <span style={{ fontSize: '0.68rem', color: 'var(--success-color)', backgroundColor: 'rgba(0,186,124,0.12)', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                              <CheckCircle size={10} style={{ marginRight: '3px', verticalAlign: 'middle' }} /> ผูกเรียบร้อย
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px' }}>
                                               <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setEditingAddressId(null);
                              setReceiverName('');
                              setIsAddressDefault(addresses.length === 0);
                              setNewAddress({ province: '', district: '', subdistrict: '', postalCode: '', detail: '', phone: '' });
                              setIsAddressModalOpen(true);
                            }}
                          >
                            + เพิ่มที่อยู่ใหม่
                          </button>           </span>
                          )}
                        </div>
                        
                        <strong style={{ fontSize: '0.95rem', display: 'block', margin: '4px 0 10px 0', color: user.phone ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {user.phone ? user.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3') : 'ยังไม่ระบุ'}
                        </strong>

                        {user.phone ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ flex: 1, fontSize: '0.78rem', padding: '6px 6px', fontWeight: 600 }} 
                              onClick={() => openOtpModal('change')}
                            >
                              <Phone size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> เปลี่ยนเบอร์
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm" 
                              style={{ flex: 1, fontSize: '0.78rem', padding: '6px 6px', color: 'var(--danger-color)', borderColor: 'rgba(244,33,46,0.3)', fontWeight: 600 }} 
                              onClick={() => openOtpModal('unbind')}
                            >
                              <Unlock size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> ยกเลิกผูกเบอร์
                            </button>
                          </div>
                        ) : (
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ width: '100%', fontSize: '0.82rem', padding: '8px' }} 
                            onClick={() => openOtpModal('bind')}
                          >
                            <Phone size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} /> ขอ SMS OTP เพื่อผูกเบอร์
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="profile-actions">
                      <button className="btn btn-secondary btn-block" onClick={() => { setEditUsername(user.username); setEditPhone(user.phone || ''); setIsEditProfileModalOpen(true); }}>
                        แก้ไขข้อมูลส่วนตัว
                      </button>
                      <button className="btn btn-danger btn-block" onClick={handleLogout}>
                        <LogOut size={16} /> ออกจากระบบ
                      </button>
                    </div>
                  </div>

                  <div className="profile-content">
                    {/* Sub-tabs header */}
                    <div className="profile-sub-tabs">
                      <button className={`profile-sub-tab ${profileSubTab === 'orders' ? 'active' : ''}`} onClick={() => setProfileSubTab('orders')}>ประวัติสั่งซื้อ</button>
                      <button className={`profile-sub-tab ${profileSubTab === 'addresses' ? 'active' : ''}`} onClick={() => setProfileSubTab('addresses')}>ที่อยู่จัดส่ง</button>
                    </div>

                    {/* Sub-panel 1: Orders list */}
                    {profileSubTab === 'orders' && (
                      <div className="profile-subpanel active">
                        {orders.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>ยังไม่มีประวัติสั่งซื้อสินค้า</p>
                        ) : (
                          <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {orders.map((ord) => (
                              <div key={ord.id} className="order-history-item" style={{ padding: '15px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>เลขบิล: {ord.id.slice(0, 8)}...</span>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{parseFloat(ord.total_price).toFixed(2)} ฿</span>
                                </div>
                                {ord.items && ord.items.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                    {ord.items.map((item: any) => (
                                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)', flexShrink: 0 }}>
                                          <ProductImage name={item.product_name} imageUrl={item.product_image_url} />
                                        </div>
                                        <div style={{ flex: 1, fontSize: '0.8rem' }}>
                                          <div style={{ color: 'var(--text-main)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{item.product_name}</div>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.variant_name} x {item.quantity} ชิ้น ({(parseFloat(item.unit_price || item.price || 0)).toFixed(2)} ฿/ชิ้น)</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span className={`status-badge ${ord.status}`}>{ord.status === 'pending' ? 'รอชำระเงิน' : ord.status === 'paid' ? 'ชำระเงินแล้ว' : ord.status === 'shipping' ? 'กำลังจัดส่ง' : 'สำเร็จ'}</span>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    {ord.status === 'pending' && (
                                      <button 
                                        className="btn btn-primary btn-sm" 
                                        style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }} 
                                        onClick={() => resumeOrderPayment(ord)}
                                      >
                                        <CreditCard size={14} /> ชำระเงิน / QR Code
                                      </button>
                                    )}
                                    {['pending', 'paid'].includes(ord.status) && (
                                      <button 
                                        className="btn btn-secondary btn-sm" 
                                        style={{ width: 'auto', padding: '6px 10px', fontSize: '0.78rem', color: 'var(--danger-color)', borderColor: 'rgba(244,33,46,0.3)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }} 
                                        onClick={() => {
                                          setCancelTargetOrder(ord);
                                          setCancelReason('ต้องการเปลี่ยนรายการสินค้า');
                                          setCancelNote('');
                                          setIsCancelModalOpen(true);
                                        }}
                                      >
                                        <X size={13} style={{ marginRight: '3px' }} /> ยกเลิกคำสั่งซื้อ
                                      </button>
                                    )}
                                    <button className="btn btn-secondary btn-sm" style={{ width: 'auto' }} onClick={() => handleOpenTracking(ord)}>
                                      <Truck size={14} style={{ marginRight: '4px' }} /> ติดตามพัสดุ
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Sub-panel 2: Addresses list */}
                    {profileSubTab === 'addresses' && (
                      <div className="profile-subpanel active">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h4 style={{ margin: 0 }}>ที่อยู่จัดส่งของคุณ</h4>
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ width: 'auto' }} 
                            onClick={() => {
                              setEditingAddressId(null);
                              setReceiverName('');
                              setNewAddress({ province: '', district: '', subdistrict: '', postalCode: '', detail: '', phone: '' });
                              setIsAddressModalOpen(true);
                            }}
                          >
                            + เพิ่มที่อยู่ใหม่
                          </button>
                        </div>
                        {addresses.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>ยังไม่มีข้อมูลที่อยู่จัดส่ง</p>
                        ) : (
                          <div className="addresses-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {addresses.map((addr) => (
                              <div 
                                key={addr.id} 
                                className={`address-option-item ${selectedAddressId === addr.id ? 'active' : ''}`}
                                onClick={() => setSelectedAddressId(addr.id)}
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', backgroundColor: selectedAddressId === addr.id ? 'rgba(0,186,124,0.05)' : 'transparent', borderColor: selectedAddressId === addr.id ? 'var(--primary-color)' : 'var(--border-color)' }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                    ผู้รับ: {addr.receiver_name || user?.username} (โทร: {addr.phone})
                                  </strong>
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    {addr.is_default ? (
                                      <span className="default-badge" style={{ backgroundColor: 'var(--primary-color)', color: '#000', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>หลัก</span>
                                    ) : (
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleSetDefaultAddress(addr.id); }}
                                        style={{ border: '1px solid #00BA7C', backgroundColor: 'rgba(0,186,124,0.08)', color: '#00BA7C', fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                      >
                                        ตั้งเป็นที่อยู่หลัก
                                      </button>
                                    )}
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleEditAddress(addr); }}
                                      style={{ border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.02)', color: 'var(--primary-color)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      แก้ไข
                                    </button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}
                                      style={{ border: '1px solid rgba(255,59,48,0.2)', backgroundColor: 'rgba(255,59,48,0.05)', color: 'var(--primary-color)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      ลบ
                                    </button>
                                  </div>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                                  {addr.address_detail || addr.detail} ต. {addr.sub_district || addr.subdistrict} อ. {addr.district} จ. {addr.province} {addr.postal_code}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>
            ) : (
              /* FULL FIGMA AUTHENTICATION LAYOUT (SIGN IN / SIGN UP) */
              <div 
                style={{
                  width: '100%',
                  minHeight: 'calc(100vh - 84.19px)',
                  background: '#FF3201',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '40px 0',
                  boxSizing: 'border-box',
                  position: 'relative'
                }}
                className="figma-auth-container"
              >
                {/* LEFT COLUMN: HERO Graphic & Slogan (Spans 100% of left space to center logo in left red area) */}
                <div 
                  style={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    textAlign: 'center', 
                    color: '#FFFFFF', 
                    padding: '20px 40px', 
                    boxSizing: 'border-box' 
                  }}
                >
                  <img 
                    src={authTab === 'login' ? '/signin_images/image 57.svg' : '/signup_images/image 57.svg'} 
                    alt="TERA Logo Showcase" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/tera_logo_red_badge.png';
                    }}
                    style={{
                      maxWidth: '280px',
                      maxHeight: '280px',
                      width: '100%',
                      height: 'auto',
                      objectFit: 'contain',
                      margin: '0 auto 28px auto',
                      display: 'block',
                      filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.25))'
                    }}
                  />
                  <h2 
                    style={{
                      color: '#FFFFFF',
                      fontSize: '2rem',
                      fontFamily: "'IBM Plex Sans Thai', sans-serif",
                      fontWeight: 400,
                      lineHeight: '1.5',
                      margin: '0 auto',
                      textAlign: 'center',
                      width: '100%'
                    }}
                  >
                    <div style={{ whiteSpace: 'nowrap', marginBottom: '6px' }}>จำหน่ายอินเวอร์เตอร์อุตสาหกรรมทุกประเภท</div>
                    <div style={{ whiteSpace: 'nowrap' }}>รองรับทุกระบบไฟฟ้า</div>
                  </h2>
                </div>

                {/* RIGHT COLUMN: White Card for Sign In / Sign Up */}
                <div style={{ paddingRight: 'max(40px, calc((100vw - 1280px) / 2))', flexShrink: 0 }}>
                  <div 
                    style={{
                      width: '515px',
                      background: '#FFFEFE',
                      borderRadius: '32px',
                      boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.25)',
                      padding: '40px 48px',
                      boxSizing: 'border-box'
                    }}
                  >
                    {authTab === 'login' ? (
                      /* SIGN IN FORM */
                      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h1 
                          style={{
                            color: '#FF3201',
                            fontSize: '2.8rem',
                            fontFamily: "'Rubik', sans-serif",
                            fontWeight: 700,
                            textAlign: 'center',
                            margin: 0,
                            lineHeight: '1.1',
                            letterSpacing: '0.96px'
                          }}
                        >
                          Sign In
                        </h1>

                        <p 
                          style={{
                            textAlign: 'center',
                            color: '#000000',
                            fontSize: '0.95rem',
                            fontFamily: "'IBM Plex Sans Thai', sans-serif",
                            margin: '0 0 12px 0'
                          }}
                        >
                          Sing in to your Account
                        </p>

                        {/* Input 1: Phone number / Username / Email */}
                        <div style={{ position: 'relative', width: '100%' }}>
                          <User size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 0, 0, 0.45)' }} />
                          <input 
                            type="text" 
                            placeholder="Phone number / Username/ Email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                            style={{
                              width: '100%',
                              height: '48px',
                              padding: '0 20px 0 48px',
                              borderRadius: '20px',
                              border: '1px solid rgba(0, 0, 0, 0.50)',
                              background: '#FFFBFB',
                              color: '#000000',
                              fontSize: '0.88rem',
                              fontFamily: "'Rubik', sans-serif",
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Input 2: Password */}
                        <div style={{ position: 'relative', width: '100%' }}>
                          <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 0, 0, 0.45)' }} />
                          <input 
                            type={showPassword ? 'text' : 'password'} 
                            placeholder="Pessword"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                            style={{
                              width: '100%',
                              height: '48px',
                              padding: '0 48px 0 48px',
                              borderRadius: '20px',
                              border: '1px solid rgba(0, 0, 0, 0.50)',
                              background: '#FFFFFF',
                              color: '#000000',
                              fontSize: '0.88rem',
                              fontFamily: "'Rubik', sans-serif",
                              outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                              position: 'absolute',
                              right: '16px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'rgba(0,0,0,0.5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {/* Options Row: Remember Me & Forgot Password */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'rgba(0,0,0,0.51)', fontFamily: "'Rubik', sans-serif", padding: '0 4px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ accentColor: '#FF3201', borderRadius: '3px' }} defaultChecked />
                            <span>Remember me</span>
                          </label>
                          <span 
                            style={{ cursor: 'pointer', color: '#FF3201', fontWeight: 500 }}
                            onClick={() => handleOpenForgotPassword()}
                          >
                            Forgot password
                          </span>
                        </div>

                        {/* Submit Button: Confirm */}
                        <button 
                          type="submit"
                          style={{
                            width: '100%',
                            height: '48px',
                            margin: '8px 0 0 0',
                            background: '#FF3201',
                            borderRadius: '20px',
                            border: '1px solid rgba(0, 0, 0, 0.25)',
                            color: '#FFFDFD',
                            fontSize: '1rem',
                            fontFamily: "'Rubik', sans-serif",
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(255, 50, 1, 0.25)'
                          }}
                        >
                          confirm
                        </button>

                        {/* Divider */}
                        <div style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.51)', fontSize: '0.88rem', fontFamily: "'Rubik', sans-serif", margin: '4px 0' }}>
                          OR
                        </div>

                        {/* Social Login Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {/* Google */}
                          <a 
                            href="/api/v1/auth/google" 
                            style={{
                              width: '100%',
                              height: '42px',
                              background: '#FFFFFF',
                              boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.25)',
                              borderRadius: '14px',
                              border: '1px solid rgba(0, 0, 0, 0.28)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                              color: '#000000',
                              fontSize: '0.85rem',
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 500,
                              textDecoration: 'none'
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="20" height="20" style={{ display: 'block' }}>
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            Log in with Google
                          </a>

                          {/* Facebook (Blue f letter inside White Circle Badge) */}
                          <a 
                            href="/api/v1/auth/facebook" 
                            style={{
                              width: '100%',
                              height: '42px',
                              background: '#0655FF',
                              boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.25)',
                              borderRadius: '14px',
                              border: '1px solid rgba(0, 0, 0, 0.31)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                              color: '#FFFFFF',
                              fontSize: '0.85rem',
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 500,
                              textDecoration: 'none'
                            }}
                          >
                            <div 
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              <svg viewBox="0 0 24 24" width="15" height="15" fill="#0655FF" style={{ display: 'block' }}>
                                <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.361H7.319v3.209h2.76v8.196h3.318z"/>
                              </svg>
                            </div>
                            Log in with Facebook
                          </a>

                          {/* Line (Authentic LINE logo image) */}
                          <a 
                            href="/api/v1/auth/line" 
                            style={{
                              width: '100%',
                              height: '42px',
                              background: '#19D219',
                              boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.25)',
                              borderRadius: '14px',
                              border: '1px solid rgba(0, 0, 0, 0.28)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                              color: '#FFFFFF',
                              fontSize: '0.85rem',
                              fontFamily: "'Rubik', sans-serif",
                              fontWeight: 500,
                              textDecoration: 'none'
                            }}
                          >
                            <img 
                              src="/line_chatgpt_logo.png" 
                              alt="LINE" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/signin_images/source/ChatGPT%20Image%20Jul%2013,%202026,%2002_05_00%20PM.png';
                              }}
                              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                            />
                            Log in with Line
                          </a>
                        </div>

                        {/* Footer Switch Link */}
                        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.85rem', fontFamily: "'Rubik', sans-serif" }}>
                          <span style={{ color: 'rgba(0, 0, 0, 0.51)' }}>new to ? </span>
                          <span 
                            onClick={() => setAuthTab('register')} 
                            style={{ color: '#FF3201', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Sign Up
                          </span>
                        </div>

                        {/* Interactive Demo Staff Role Login Buttons */}
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #CBD5E1', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            ⚡ ปุ่มลัดล็อกอินตามสิทธิ์แผนก (Demo Role Login)
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                            <button type="button" onClick={() => { setLoginEmail('admin@terasmart.com'); setLoginPassword('Password123!'); }} style={{ padding: '6px 4px', fontSize: '0.7rem', borderRadius: '6px', background: '#0F172A', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                              🛡️ Admin
                            </button>
                            <button type="button" onClick={() => { setLoginEmail('stock@terasmart.com'); setLoginPassword('Password123!'); }} style={{ padding: '6px 4px', fontSize: '0.7rem', borderRadius: '6px', background: '#2563EB', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                              📦 คลังสินค้า
                            </button>
                            <button type="button" onClick={() => { setLoginEmail('sales@terasmart.com'); setLoginPassword('Password123!'); }} style={{ padding: '6px 4px', fontSize: '0.7rem', borderRadius: '6px', background: '#D97706', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                              👥 ฝ่ายขาย
                            </button>
                            <button type="button" onClick={() => { setLoginEmail('shipping@terasmart.com'); setLoginPassword('Password123!'); }} style={{ padding: '6px 4px', fontSize: '0.7rem', borderRadius: '6px', background: '#059669', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                              🚚 จัดส่ง
                            </button>
                            <button type="button" onClick={() => { setLoginEmail('marketing@terasmart.com'); setLoginPassword('Password123!'); }} style={{ padding: '6px 4px', fontSize: '0.7rem', borderRadius: '6px', background: '#9333EA', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                              🎨 การตลาด
                            </button>
                            <button type="button" onClick={() => { setLoginEmail('accounting@terasmart.com'); setLoginPassword('Password123!'); }} style={{ padding: '6px 4px', fontSize: '0.7rem', borderRadius: '6px', background: '#DC2626', color: '#FFF', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                              💰 บัญชี
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      /* SIGN UP FORM */
                      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <h1 
                          style={{
                            color: '#FF3201',
                            fontSize: '2.8rem',
                            fontFamily: "'Rubik', sans-serif",
                            fontWeight: 700,
                            textAlign: 'center',
                            margin: 0,
                            lineHeight: '1.1',
                            letterSpacing: '0.96px'
                          }}
                        >
                          Sign Up
                        </h1>

                        <p 
                          style={{
                            textAlign: 'center',
                            color: '#000000',
                            fontSize: '0.95rem',
                            fontFamily: "'IBM Plex Sans Thai', sans-serif",
                            margin: '0 0 6px 0'
                          }}
                        >
                          Sign up for your account
                        </p>

                        {/* Username */}
                        <div style={{ position: 'relative', width: '100%' }}>
                          <User size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,0.45)' }} />
                          <input 
                            type="text" 
                            placeholder="Username " 
                            value={registerUsername}
                            onChange={(e) => setRegisterUsername(e.target.value.replace(/\d/g, ''))}
                            required
                            style={{ width: '100%', height: '42px', padding: '0 20px 0 48px', borderRadius: '20px', border: '1px solid rgba(0, 0, 0, 0.50)', background: '#FFFBFB', color: '#000', fontSize: '0.88rem', fontFamily: "'Rubik', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>

                        {/* Email */}
                        <div style={{ position: 'relative', width: '100%' }}>
                          <Mail size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,0.45)' }} />
                          <input 
                            type="email" 
                            placeholder="Email" 
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                            required
                            style={{ width: '100%', height: '42px', padding: '0 20px 0 48px', borderRadius: '20px', border: '1px solid rgba(0, 0, 0, 0.50)', background: '#FFFBFB', color: '#000', fontSize: '0.88rem', fontFamily: "'Rubik', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>

                        {/* Phone Number */}
                        <div style={{ position: 'relative', width: '100%' }}>
                          <Phone size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,0.45)' }} />
                          <input 
                            type="text" 
                            placeholder="Phone number" 
                            maxLength={10}
                            value={registerPhone}
                            onChange={(e) => setRegisterPhone(e.target.value.replace(/\D/g, ''))}
                            required
                            style={{ width: '100%', height: '42px', padding: '0 20px 0 48px', borderRadius: '20px', border: '1px solid rgba(0, 0, 0, 0.50)', background: '#FFFBFB', color: '#000', fontSize: '0.88rem', fontFamily: "'Rubik', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>

                        {/* Password */}
                        <div style={{ position: 'relative', width: '100%' }}>
                          <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,0.45)' }} />
                          <input 
                            type={showRegisterPassword ? 'text' : 'password'} 
                            placeholder="Pessword" 
                            minLength={6}
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            required
                            style={{ width: '100%', height: '42px', padding: '0 48px 0 48px', borderRadius: '20px', border: '1px solid rgba(0, 0, 0, 0.50)', background: '#FFFBFB', color: '#000', fontSize: '0.88rem', fontFamily: "'Rubik', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                          />
                          <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {/* Confirm Password */}
                        <div style={{ position: 'relative', width: '100%' }}>
                          <Lock size={18} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,0.45)' }} />
                          <input 
                            type={showRegisterConfirmPassword ? 'text' : 'password'} 
                            placeholder="Confirm password" 
                            minLength={6}
                            value={registerConfirmPassword}
                            onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                            required
                            style={{ width: '100%', height: '42px', padding: '0 48px 0 48px', borderRadius: '20px', border: '1px solid rgba(0, 0, 0, 0.50)', background: '#FFFFFF', color: '#000', fontSize: '0.88rem', fontFamily: "'Rubik', sans-serif", outline: 'none', boxSizing: 'border-box' }}
                          />
                          <button type="button" onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {showRegisterConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {/* Submit Button: Confirm */}
                        <button 
                          type="submit"
                          style={{
                            width: '100%',
                            height: '42px',
                            margin: '6px 0 0 0',
                            background: '#FF3201',
                            borderRadius: '20px',
                            border: '1px solid rgba(0, 0, 0, 0.25)',
                            color: '#FFFDFD',
                            fontSize: '1rem',
                            fontFamily: "'Rubik', sans-serif",
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(255, 50, 1, 0.25)'
                          }}
                        >
                          confirm
                        </button>

                        {/* Divider */}
                        <div style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.51)', fontSize: '0.85rem', fontFamily: "'Rubik', sans-serif" }}>
                          OR
                        </div>

                        {/* Social Login Buttons */}
                        {/* Social Login Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <a href="/api/v1/auth/google" style={{ width: '100%', height: '38px', background: '#FFFFFF', boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.25)', borderRadius: '14px', border: '1px solid rgba(0, 0, 0, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#000000', fontSize: '0.85rem', fontFamily: "'Rubik', sans-serif", fontWeight: 500, textDecoration: 'none' }}>
                            <svg viewBox="0 0 24 24" width="18" height="18" style={{ display: 'block' }}>
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                            </svg>
                            Log in with Google
                          </a>

                          <a href="/api/v1/auth/facebook" style={{ width: '100%', height: '38px', background: '#0655FF', boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.25)', borderRadius: '14px', border: '1px solid rgba(0, 0, 0, 0.31)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#FFFFFF', fontSize: '0.85rem', fontFamily: "'Rubik', sans-serif", fontWeight: 500, textDecoration: 'none' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="#0655FF" style={{ display: 'block' }}>
                                <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.361H7.319v3.209h2.76v8.196h3.318z"/>
                              </svg>
                            </div>
                            Log in with Facebook
                          </a>

                          <a href="/api/v1/auth/line" style={{ width: '100%', height: '38px', background: '#19D219', boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.25)', borderRadius: '14px', border: '1px solid rgba(0, 0, 0, 0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#FFFFFF', fontSize: '0.85rem', fontFamily: "'Rubik', sans-serif", fontWeight: 500, textDecoration: 'none' }}>
                            <img 
                              src="/line_chatgpt_logo.png" 
                              alt="LINE" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/signup_images/source/ChatGPT%20Image%20Jul%2013,%202026,%2002_05_00%20PM.png';
                              }}
                              style={{ width: '22px', height: '22px', objectFit: 'contain' }}
                            />
                            Log in with Line
                          </a>
                        </div>

                        {/* Footer Switch Link */}
                        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.85rem', fontFamily: "'Rubik', sans-serif" }}>
                          <span style={{ color: 'rgba(0, 0, 0, 0.51)' }}>Have an account? </span>
                          <span 
                            onClick={() => setAuthTab('login')} 
                            style={{ color: '#FF3201', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Sign In
                          </span>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* EDIT PROFILE MODAL */}
      {isEditProfileModalOpen && (
        <div className="modal active" style={{ zIndex: 1150 }}>
          <div className="modal-content" style={{ maxWidth: '450px', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>แก้ไขข้อมูลส่วนตัว</h3>
              <button className="close-btn" onClick={() => setIsEditProfileModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className="modal-body">
              {/* Form 1: General Info */}
              <form onSubmit={async (e) => { await updateProfile(e); setIsEditProfileModalOpen(false); }} className="mb-lg">
                <h4 style={{ marginTop: 0, color: 'var(--primary)', marginBottom: '12px' }}>ข้อมูลทั่วไป</h4>
                <div className="input-group">
                  <label className="input-label">ชื่อผู้ใช้งาน</label>
                  <input type="text" className="input-field" value={editUsername} onChange={(e) => setEditUsername(e.target.value.replace(/\d/g, ''))} required />
                </div>
                <div className="input-group">
                  <label className="input-label">เบอร์โทรศัพท์ (10 หลัก)</label>
                  <input type="text" className="input-field" value={editPhone} maxLength={10} onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))} />
                </div>
                <div className="input-group">
                  <label className="input-label">อัปโหลดรูปโปรไฟล์</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadAvatar(file);
                      }
                    }} 
                    className="input-field"
                    style={{ padding: '8px' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block mt-md">บันทึกข้อมูลทั่วไป</button>
              </form>

              <hr style={{ border: 0, borderTop: '1px solid var(--border-default)', margin: '20px 0' }} />

              {/* Form 2: Change Password */}
              <form onSubmit={async (e) => { await changePassword(e); setIsEditProfileModalOpen(false); }}>
                <h4 style={{ marginTop: 0, color: 'var(--primary)', marginBottom: '12px' }}>เปลี่ยนรหัสผ่าน</h4>
                <div className="input-group">
                  <label className="input-label">รหัสผ่านปัจจุบัน</label>
                  <input type="password" className="input-field" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)</label>
                  <input type="password" className="input-field" value={newPassword} minLength={6} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="input-label">ยืนยันรหัสผ่านใหม่</label>
                  <input type="password" className="input-field" value={confirmPassword} minLength={6} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary btn-block mt-md">เปลี่ยนรหัสผ่าน</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SMS OTP PHONE VERIFICATION MODAL */}
      {isOtpModalOpen && (
        <div className="modal active" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '25px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={18} style={{ color: 'var(--primary-color)' }} />
                <span>
                  {otpAction === 'bind' && 'ผูกเบอร์โทรศัพท์ผ่าน SMS OTP'}
                  {otpAction === 'change' && 'เปลี่ยนเบอร์โทรศัพท์ผ่าน SMS OTP'}
                  {otpAction === 'unbind' && 'ยืนยันยกเลิกการผูกเบอร์โทรศัพท์'}
                </span>
              </h3>
              <button className="close-btn" onClick={() => setIsOtpModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div className="modal-body">
              {!isOtpSent ? (
                /* Step 1: Phone Input & Request OTP */
                <form onSubmit={handleRequestOtp}>
                  {otpAction === 'unbind' ? (
                    <div style={{ padding: '14px', backgroundColor: 'rgba(244,33,46,0.08)', borderRadius: '10px', border: '1px solid rgba(244,33,46,0.2)', marginBottom: '16px' }}>
                      <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
                        คุณกำลังจะยกเลิกการผูกเบอร์โทรศัพท์ <strong>{user?.phone}</strong> ออกจากบัญชีนี้ ระบบจะส่งรหัส SMS OTP ไปยังเบอร์ดังกล่าวเพื่อยืนยันสิทธิ์ความเป็นเจ้าของจริง
                      </p>
                    </div>
                  ) : (
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '0.86rem', fontWeight: 600 }}>เบอร์โทรศัพท์ (10 หลัก)</label>
                      <input 
                        type="text" 
                        maxLength={10} 
                        value={otpPhoneInput} 
                        onChange={(e) => setOtpPhoneInput(e.target.value.replace(/\D/g, ''))} 
                        placeholder="เช่น 0812345678"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '6px', fontSize: '1rem', letterSpacing: '1px' }} 
                        required 
                      />
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block', lineHeight: 1.4 }}>
                        * <ShieldCheck size={12} style={{ marginRight: '3px', verticalAlign: 'middle', color: 'var(--primary-color)' }} /> 1 เบอร์โทรศัพท์สามารถเชื่อมผูกได้เพียง 1 บัญชีเท่านั้น และไม่สามารถซ้ำกับผู้อื่นได้
                      </span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '10px' }}
                    disabled={isOtpLoading}
                  >
                    {isOtpLoading ? 'กำลังส่งรหัส OTP...' : 'ขอรหัส SMS OTP'}
                  </button>
                </form>
              ) : (
                /* Step 2: OTP Verification Input */
                <form onSubmit={handleVerifyOtp}>
                  <div style={{ padding: '12px 14px', backgroundColor: 'rgba(0,186,124,0.08)', borderRadius: '10px', border: '1px solid rgba(0,186,124,0.25)', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>ส่ง OTP ไปที่: <strong>{otpPhoneInput || user?.phone}</strong></span>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 'bold', backgroundColor: 'rgba(255,50,1,0.1)', padding: '2px 6px', borderRadius: '4px' }}>รหัสอ้างอิง: {otpRefCode}</span>
                    </div>

                    {otpDevCode && (
                      <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed rgba(0,186,124,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>[ระบบทดสอบ] โค้ด OTP: <strong style={{ color: 'var(--primary-color)', fontSize: '0.95rem' }}>{otpDevCode}</strong></span>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '4px' }}
                          onClick={() => setOtpCodeInput(otpDevCode)}
                        >
                          ใส่โค้ดอัตโนมัติ
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: 600 }}>ระบุรหัส OTP 6 หลักที่ได้รับจาก SMS</label>
                    <input 
                      type="text" 
                      maxLength={6} 
                      value={otpCodeInput} 
                      onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ''))} 
                      placeholder="123456"
                      style={{ width: '100%', padding: '12px', textAlign: 'center', fontSize: '1.45rem', letterSpacing: '8px', fontWeight: 'bold', borderRadius: '8px', border: '1px solid var(--primary-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '6px' }} 
                      required 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '10px' }}
                    disabled={isOtpLoading || otpCodeInput.length !== 6}
                  >
                    {isOtpLoading ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัส OTP และดำเนินการ'}
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ width: '100%', marginTop: '10px', fontSize: '0.82rem' }}
                    onClick={handleRequestOtp}
                    disabled={isOtpLoading}
                  >
                    ขอรหัส OTP ใหม่อีกครั้ง
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW/EDIT ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="modal active" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <button className="close-btn" onClick={() => setIsAddressModalOpen(false)}><X size={20}/></button>
            <h3>{editingAddressId ? 'แก้ไขที่อยู่จัดส่ง' : 'เพิ่มที่อยู่จัดส่งใหม่'}</h3>
            <form onSubmit={saveAddress}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>ชื่อผู้รับสินค้า</label>
                <input 
                  type="text" 
                  value={receiverName} 
                  onChange={(e) => setReceiverName(e.target.value)} 
                  placeholder="เช่น สมชาย รักดี" 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                  required 
                />
              </div>
              <AddressForm 
                key={editingAddressId || 'new'}
                initialValues={newAddress}
                onChange={(values) => setNewAddress(values)} 
                showPhoneField={true} 
              />
              <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="is_default_checkbox"
                  checked={isAddressDefault}
                  onChange={(e) => setIsAddressDefault(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#FF3201', cursor: 'pointer' }}
                />
                <label htmlFor="is_default_checkbox" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 500 }}>
                  ตั้งเป็นที่อยู่จัดส่งหลัก (Set as Default Address)
                </label>
              </div>
              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '20px' }}>
                {editingAddressId ? 'บันทึกการแก้ไข' : 'บันทึกที่อยู่ใหม่'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM 3D CONFIRM DIALOG */}
      {confirmDialog.isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.3s ease forwards'
        }}>
          <style>{`
            @keyframes scaleUpClean {
              0% {
                opacity: 0;
                transform: scale(0.95) translateY(15px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            @keyframes pulseGlow {
              0% {
                box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4);
              }
              70% {
                box-shadow: 0 0 0 15px rgba(255, 59, 48, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(255, 59, 48, 0);
              }
            }
            @keyframes pulseGlowGreen {
              0% {
                box-shadow: 0 0 0 0 rgba(0, 186, 124, 0.5);
                opacity: 0.6;
              }
              70% {
                box-shadow: 0 0 0 10px rgba(0, 186, 124, 0);
                opacity: 1;
              }
              100% {
                box-shadow: 0 0 0 0 rgba(0, 186, 124, 0);
                opacity: 0.6;
              }
            }
          `}</style>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            background: 'linear-gradient(135deg, rgba(25, 25, 35, 0.95), rgba(15, 15, 20, 0.98))',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            borderRadius: '20px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 59, 48, 0.15)',
            transform: 'translateY(0) scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease',
            animation: 'scaleUpClean 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
            e.currentTarget.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.9), 0 0 45px rgba(255, 59, 48, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 59, 48, 0.15)';
          }}
          >
            {/* 3D Pulsing Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              border: '1.5px solid var(--primary-color)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 0 20px rgba(255, 59, 48, 0.2), inset 0 0 15px rgba(255, 59, 48, 0.1)',
              animation: 'pulseGlow 2s infinite'
            }}>
              <Trash2 size={32} style={{ color: 'var(--primary-color)', filter: 'drop-shadow(0 2px 8px rgba(255,59,48,0.4))' }} />
            </div>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {confirmDialog.title}
            </h3>
            
            <p style={{ margin: '0 0 25px 0', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {confirmDialog.message}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                onClick={confirmDialog.onCancel}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                ยกเลิก
              </button>
              
              <button 
                onClick={confirmDialog.onConfirm}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--primary-color)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(255,59,48,0.4)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,59,48,0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,59,48,0.4)';
                }}
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRACKING TIMELINE MODAL */}
      {trackingOrder && (() => {
        const steps = [
          { label: 'สั่งซื้อสำเร็จ', desc: 'ได้รับคำสั่งซื้อแล้ว' },
          { label: 'ชำระเงินแล้ว', desc: 'ตรวจสอบยอดโอนแล้ว' },
          { label: 'กำลังจัดส่ง', desc: 'มอบพัสดุให้ขนส่ง' },
          { label: 'จัดส่งสำเร็จ', desc: 'พัสดุส่งถึงผู้รับแล้ว' }
        ];
        
        let activeIdx = 0;
        const statusLower = (trackingOrder.status || '').toLowerCase();
        const shippingStatusLower = (trackingOrder.shipping_status || '').toLowerCase();

        if (['paid', 'approved', 'processing', 'ชำระเงินแล้ว', 'อนุมัติแล้ว', 'completed'].includes(statusLower) || ['paid', 'approved', 'processing'].includes(shippingStatusLower)) {
          activeIdx = 1;
        }
        if (['shipping', 'shipped', 'in_transit', 'in transit', 'กำลังจัดส่ง', 'out_for_delivery'].includes(statusLower) || ['shipping', 'shipped', 'in_transit', 'in transit', 'out_for_delivery', 'delivered'].includes(shippingStatusLower)) {
          activeIdx = 2;
        }
        if (['completed', 'delivered', 'success', 'สำเร็จ', 'จัดส่งสำเร็จ'].includes(statusLower) || ['completed', 'delivered', 'success', 'สำเร็จ', 'จัดส่งสำเร็จ'].includes(shippingStatusLower)) {
          activeIdx = 3;
        }

        const courierName = trackingOrder.courier_name || 'Kerry Express';
        const trackingNum = trackingOrder.tracking_number || 'fredcrfgfdc';

        return (
          <div className="modal active">
            <div className="modal-content" style={{ maxWidth: '650px', padding: '30px', maxHeight: '90vh', overflowY: 'auto' }}>
              <button className="close-btn" onClick={() => setTrackingOrder(null)}><X size={20} /></button>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '25px', color: 'var(--text-main)' }}>
                ติดตามพัสดุ (ใบสั่งซื้อ: #{trackingOrder.id.slice(0, 8)})
              </h3>

              {/* Horizontal Timeline Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', width: '100%', marginBottom: '20px' }}>
                  {/* Background progress track */}
                  <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '4px', backgroundColor: 'var(--border-color)', zIndex: 1 }} />
                  
                  {/* Active progress track */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    left: '10%', 
                    width: activeIdx === 3 ? '80%' : activeIdx === 2 ? '53.3%' : activeIdx === 1 ? '26.6%' : '0%', 
                    height: '4px', 
                    backgroundColor: '#22C55E', 
                    transition: 'width 0.4s ease',
                    zIndex: 1 
                  }} />

                  {/* Step Nodes */}
                  {steps.map((step, idx) => {
                    const isCompleted = idx <= activeIdx;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1, position: 'relative' }}>
                        {/* Circle */}
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          backgroundColor: isCompleted ? '#22C55E' : 'var(--bg-card)', 
                          border: `2.5px solid ${isCompleted ? '#22C55E' : 'var(--border-color)'}`,
                          color: isCompleted ? '#FFFFFF' : 'var(--text-muted)',
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center', 
                          fontWeight: 700, 
                          fontSize: '0.8rem',
                          boxShadow: isCompleted ? '0 0 14px rgba(34, 197, 94, 0.4)' : 'none',
                          transition: 'all 0.3s ease'
                        }}>
                          {isCompleted ? <CheckCircle size={18} style={{ color: '#FFFFFF' }} /> : idx + 1}
                        </div>
                        {/* Text labels */}
                        <strong style={{ fontSize: '0.78rem', color: isCompleted ? '#0F172A' : 'var(--text-muted)', marginTop: '10px', textAlign: 'center', display: 'block', wordBreak: 'keep-all', fontWeight: isCompleted ? 700 : 500 }}>
                          {step.label}
                        </strong>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center', maxWidth: '90px', display: 'block', lineHeight: 1.2 }}>
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Courier / delivery info card */}
                <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#FF3201', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                      <Truck size={18} /> รายละเอียดการจัดส่งพัสดุ
                    </h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px', fontSize: '0.85rem' }}>
                    <div>บริษัทขนส่ง: <strong style={{ color: '#0F172A', fontWeight: 700 }}>{courierName}</strong></div>
                    <div>
                      เลขพัสดุ: <strong style={{ color: '#FF3201', fontWeight: 700 }}>{trackingNum}</strong>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(trackingNum);
                          showToast('คัดลอกเลขพัสดุสำเร็จ!');
                        }}
                        style={{ marginLeft: '8px', background: '#FFF1F0', border: '1px solid #FFCCC7', color: '#FF3201', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        คัดลอก
                      </button>
                    </div>
                    <div style={{ gridColumn: '1/-1', color: '#475569', borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '4px' }}>
                      สถานะขนส่ง: <strong style={{ color: activeIdx === 3 ? '#22C55E' : '#FF3201', fontWeight: 700 }}>{trackingOrder.shipping_status || (activeIdx === 3 ? 'delivered' : 'กำลังจัดส่ง')}</strong><br />
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.82rem', color: '#0F172A' }}>
                        <Clock size={14} style={{ color: '#FF3201' }} /> คาดว่าจะได้รับสินค้า: <strong>
                          {(() => {
                            const minEst = new Date(trackingOrder.created_at);
                            minEst.setDate(minEst.getDate() + 2);
                            const maxEst = new Date(trackingOrder.created_at);
                            maxEst.setDate(maxEst.getDate() + 4);
                            const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
                            return `${minEst.toLocaleDateString('th-TH', options)} - ${maxEst.toLocaleDateString('th-TH', options)}`;
                          })()}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time Courier Timeline Checkpoints */}
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '0.88rem', color: '#0F172A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} color="#FF3201" /> ประวัติการเดินทางพัสดุเรียลไทม์ ({courierName})
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '22px' }}>
                    <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: '#E2E8F0' }} />

                    {activeIdx >= 3 && (
                      <div style={{ position: 'relative', fontSize: '0.82rem' }}>
                        <div style={{ position: 'absolute', left: '-22px', top: '3px', width: '12px', height: '12px', borderRadius: '50%', background: '#22C55E', border: '2px solid #fff', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
                        <div style={{ fontWeight: 700, color: '#15803D' }}>[จัดส่งสำเร็จ] พัสดุถูกจัดส่งถึงผู้รับเรียบร้อยแล้ว</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                          ปลายทาง: แขวงดอกไม้ เขตประเวศ กรุงเทพฯ | ผู้รับลงชื่อ: สมชาย (เจ้าของบ้าน)
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                          {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} 11:35 น.
                        </div>
                      </div>
                    )}

                    {activeIdx >= 2 && (
                      <div style={{ position: 'relative', fontSize: '0.82rem' }}>
                        <div style={{ position: 'absolute', left: '-22px', top: '3px', width: '12px', height: '12px', borderRadius: '50%', background: activeIdx === 2 ? '#3B82F6' : '#94A3B8', border: '2px solid #fff' }} />
                        <div style={{ fontWeight: activeIdx === 2 ? 700 : 500, color: activeIdx === 2 ? '#1D4ED8' : '#334155' }}>
                          [อยู่ระหว่างนำจ่าย] พนักงานขนส่ง {courierName} กำลังนำพัสดุออกจัดส่ง
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                          พนักงานจัดส่ง: สมพงษ์ (โทร: 089-876-5432)
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                          {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} 08:50 น.
                        </div>
                      </div>
                    )}

                    {activeIdx >= 2 && (
                      <div style={{ position: 'relative', fontSize: '0.82rem' }}>
                        <div style={{ position: 'absolute', left: '-22px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: '#94A3B8', border: '2px solid #fff' }} />
                        <div style={{ color: '#334155', fontWeight: 500 }}>[ถึงศูนย์กระจายสินค้า] พัสดุถึงศูนย์กระจายสินค้าปลายทาง (Bangkok Hub - Prawet)</div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                          {new Date(Date.now() - 86400000).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} 22:15 น.
                        </div>
                      </div>
                    )}

                    {activeIdx >= 1 && (
                      <div style={{ position: 'relative', fontSize: '0.82rem' }}>
                        <div style={{ position: 'absolute', left: '-22px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: '#94A3B8', border: '2px solid #fff' }} />
                        <div style={{ color: '#334155', fontWeight: 500 }}>[เข้ารับพัสดุ] {courierName} รับพัสดุเข้าระบบขนส่งจากคลังสินค้าเรียบร้อยแล้ว</div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                          {new Date(trackingOrder.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} 15:40 น.
                        </div>
                      </div>
                    )}

                    <div style={{ position: 'relative', fontSize: '0.82rem' }}>
                      <div style={{ position: 'absolute', left: '-22px', top: '3px', width: '10px', height: '10px', borderRadius: '50%', background: '#94A3B8', border: '2px solid #fff' }} />
                      <div style={{ color: '#334155', fontWeight: 500 }}>[สร้างคำสั่งซื้อ] ยืนยันคำสั่งซื้อและการชำระเงินเรียบร้อยแล้ว</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                        {new Date(trackingOrder.created_at).toLocaleString('th-TH')}
                      </div>
                    </div>
                  </div>

                  {/* Direct Courier Website Tracking Link */}
                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
                    <a 
                      href={
                        courierName.toLowerCase().includes('kerry') ? `https://th.kerryexpress.com/th/track/?track=${trackingNum}` :
                        courierName.toLowerCase().includes('flash') ? `https://www.flashexpress.co.th/tracking/?se=${trackingNum}` :
                        courierName.toLowerCase().includes('thailand') || courierName.toLowerCase().includes('ไปรษณีย์') ? `https://track.thailandpost.co.th/?trackNumber=${trackingNum}` :
                        `https://www.google.com/search?q=${encodeURIComponent(courierName + ' ' + trackingNum)}`
                      }
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        fontSize: '0.8rem', 
                        color: '#FF3201', 
                        background: '#FFF1F0', 
                        border: '1px solid #FFCCC7', 
                        padding: '6px 14px', 
                        borderRadius: '6px', 
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                    >
                      <ExternalLink size={14} /> เช็คสถานะสดบนเว็บ {courierName} {'>'}
                    </a>
                  </div>
                </div>

                {/* Real-time Order items list */}
                {trackingOrder.items && trackingOrder.items.length > 0 && (
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '15px', marginTop: '5px' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}>รายการสินค้าในคำสั่งซื้อ</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {trackingOrder.items.map((item: any) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#64748B' }}>
                          <span>{item.product_name} ({item.variant_name}) x{item.quantity}</span>
                          <span style={{ color: '#0F172A', fontWeight: 600 }}>{parseFloat(item.unit_price).toFixed(2)} ฿</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

        {/* BRANDS PAGE TAB (Matched 100% with User's Uploaded "Our Brand of product" Image) */}
        {activeTab === 'brands' && (
          <section id="tab-brands" className="tab-section active">
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 60px' }}>
              {/* Header Title Section matching User's Image */}
              <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2.6rem', fontWeight: 900, color: '#0F172A', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                  Our <span style={{ color: '#FF3201' }}>Brand</span> of product
                </h1>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FF3201', marginBottom: '10px' }}>
                  แบรนด์สินค้าของเรา
                </div>
                <div style={{ width: '88px', height: '4px', background: '#FF3201', borderRadius: '2px' }}></div>
              </div>

              {/* Full Brand Showcase Image from User's Design */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '32px 24px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                border: '1px solid #E2E8F0',
                marginBottom: '40px',
                textAlign: 'center'
              }}>
                <img 
                  src="/our_brands_all.png" 
                  alt="Our Brand of product - Tera Group" 
                  style={{ width: '100%', maxWidth: '1280px', height: 'auto', borderRadius: '12px', objectFit: 'contain' }}
                />
              </div>

              {/* Interactive Brand Filter Grid */}
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0F172A', marginBottom: '20px' }}>
                  เลือกชมสินค้าตามแบรนด์ที่คุณต้องการ
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '16px'
                }}>
                  {[
                    { name: 'VEICHI', logo: '/brand_veichi.svg' },
                    { name: 'POWTRAN', logo: '/brand_powran.svg' },
                    { name: 'MITSUBISHI ELECTRIC', logo: '/brand_mitsubishi.svg' },
                    { name: 'HITACHI', logo: '/brand_hitachi.svg' },
                    { name: 'Fuji Electric', logo: '/brand_fuji.svg' },
                    { name: 'sunways', logo: '/brand_sunways.svg' },
                    { name: 'risen', logo: '/brand_risen.svg' },
                    { name: 'HUAWEI', logo: '/brand_huawei.svg' },
                    { name: 'ABB', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/ABB_logo.svg/960px-ABB_logo.svg.png' },
                    { name: 'Schneider Electric', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Schneider_Electric_2007.svg/1280px-Schneider_Electric_2007.svg.png' },
                    { name: 'DELTA', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTDQ616VVCuM4YQeEuDvz9IxzpeOal9PfRT0IpfeHD-GQ&s=10', scale: 1.25 },
                    { name: 'TOSHIBA', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/df/TOSHIBA_Logo.png' },
                    { name: 'HASCON', logo: 'https://www.euroventblower.com/sites/default/files/hascon.png', scale: 2.2 },
                    { name: 'Danfoss', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Danfoss-Logo.svg/3840px-Danfoss-Logo.svg.png' },
                    { name: 'SIEMENS', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTmOhQMf2Kf7OkPu3nYLPaPM0SUKHfLoS_XrrrIY9nGxorYkioYroVuvso&s=10', scale: 1.3 },
                    { name: 'YASKAWA', logo: 'https://www.evolectriconline.com/images/content/original-1645536471827.png' },
                    { name: 'Caprari', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRv8FlPZE_x8TtAOTAi7zRKDi1IlvjmyCpcdf_rLXQZAMMn1I7KYvDPCbNT&s=10', scale: 2.1 },
                    { name: 'BCC Cable', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpasZXF-HGcJb6Uqh0yuVyhDoXkKck82R4x8QTKHGtcA&s=10', scale: 1.2 },
                    { name: 'OMRON', logo: 'https://logos-world.net/wp-content/uploads/2023/01/Omron-Logo.png' },
                    { name: 'YAZAKI', logo: 'https://seekvectorlogo.com/wp-content/uploads/2019/05/yazaki-vector-logo.png', scale: 1.2 }
                  ].map((b, idx) => (
                    <div 
                      key={idx}
                      onClick={() => {
                        setSelectedBrands([b.name]);
                        setSelectedCategory('ทั้งหมด');
                        setSearchText('');
                        setActiveTab('catalog');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '16px',
                        padding: '20px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '120px',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#FF3201';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 50, 1, 0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                      }}
                    >
                      <div style={{ height: '52px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {b.logo ? (
                          <img 
                            src={b.logo} 
                            alt={b.name} 
                            style={{ 
                              maxHeight: '44px', 
                              maxWidth: '85%', 
                              objectFit: 'contain', 
                              transform: b.scale ? `scale(${b.scale})` : 'none',
                              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))' 
                            }} 
                            onError={(e) => {
                              // Fallback text if external image fails to load
                              (e.currentTarget.style.display = 'none');
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.innerHTML = `<span style="font-size: 1.1rem; font-weight: 800; color: #0F172A;">${b.name}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <div style={{ fontSize: '1.15rem', fontFamily: "'Rubik', sans-serif", fontWeight: 800, color: '#0F172A', letterSpacing: '0.5px', textAlign: 'center' }}>
                            {b.name}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginTop: '10px', textAlign: 'center' }}>{b.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ABOUT US PAGE TAB (Populated 100% with Official 2026 Company Profile PDF Data) */}
        {activeTab === 'about' && (
          <section id="tab-about" className="tab-section active">
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 60px' }}>
              {/* Header Hero Title Section */}
              <div style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                borderRadius: '24px',
                padding: '48px 40px',
                color: '#FFFFFF',
                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
                marginBottom: '40px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'relative', zIndex: 2, maxWidth: '900px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 50, 1, 0.15)', border: '1px solid rgba(255, 50, 1, 0.4)', borderRadius: '20px', padding: '6px 16px', fontSize: '0.85rem', fontWeight: 700, color: '#FF3201', marginBottom: '16px' }}>
                    <span>TERA GROUP COMPANY PROFILE 2026</span>
                  </div>
                  <h1 style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-0.5px' }}>
                    One Stop Solution for <span style={{ color: '#FF3201' }}>AUTOMATION SYSTEM</span>
                  </h1>
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#94A3B8', marginBottom: '28px', maxWidth: '800px' }}>
                    “คำมั่นสัญญาของเราคือการทำให้ลูกค้าพึงพอใจในผลิตภัณฑ์ และการให้บริการด้วยบริการและเทคโนโลยีที่ดีที่สุดในปัจจุบัน” — บริษัท เทอรา กรุ้ป จำกัด และบริษัทในเครือ
                  </p>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <a 
                      href="/company profile PDF (Ref.) - 2026Rev.01.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn-cta-primary"
                      style={{ height: '46px', padding: '0 24px', fontSize: '0.92rem', width: 'auto', textDecoration: 'none' }}
                    >
                      📄 ดาวน์โหลด Company Profile (PDF) &gt;
                    </a>
                  </div>
                </div>
              </div>

              {/* Group Companies Breakdown (3 บริษัทในเครือ) */}
              <div style={{ marginBottom: '48px' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FF3201', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>OUR GROUP OF COMPANIES</div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>บริษัทในเครือ เทอรา กรุ้ป</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                  {/* Card 1: Tera Group */}
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '32px 28px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 50, 1, 0.1)', color: '#FF3201', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', marginBottom: '20px' }}>
                        TG
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>บริษัท เทอรา กรุ้ป จำกัด</h3>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#FF3201', marginBottom: '16px' }}>TERA GROUP CO., LTD.</div>
                      <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                        ให้บริการออกแบบ จำหน่าย ติดตั้ง และบำรุงรักษาระบบควบคุมมอเตอร์ (VSD / Inverter), ระบบไฟฟ้าอุตสาหกรรม, ระบบควบคุมอัตโนมัติ (Automation System) และระบบอนุรักษ์ประหยัดพลังงาน
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Tera Electric */}
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '32px 28px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', marginBottom: '20px' }}>
                        TE
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>บริษัท เทอรา อิเล็กทริค จำกัด</h3>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0284C7', marginBottom: '16px' }}>TERA ELECTRIC CO., LTD.</div>
                      <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                        ให้บริการออกแบบ จำหน่าย ติดตั้ง และบำรุงรักษาระบบโซลาร์เซลล์ (Solar Roof & On-Grid), ไฟถนนโซลาร์เซลล์ และอุปกรณ์โซลาร์เซลล์ประหยัดพลังงานสำหรับภาคอุตสาหกรรม
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Tera Power */}
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '20px',
                    padding: '32px 28px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', marginBottom: '20px' }}>
                        TP
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>บริษัท เทอรา พาวเวอร์ จำกัด</h3>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#10B981', marginBottom: '16px' }}>TERA POWER CO., LTD.</div>
                      <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                        ให้บริการออกแบบ จำหน่าย ติดตั้ง และบำรุงรักษาระบบสูบน้ำพลังงานแสงอาทิตย์ (Solar Pump), เครื่องสูบน้ำ, ระบบกระจายน้ำ และระบบท่อส่งน้ำสำหรับการเกษตรและอุตสาหกรรม
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ISO Certifications Standards Row */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '20px',
                padding: '36px 32px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                marginBottom: '48px'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FF3201', textTransform: 'uppercase', marginBottom: '4px' }}>CERTIFIED STANDARDS</div>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>มาตรฐานระดับสากล ISO ที่เราได้รับใบรับรอง</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                  {[
                    { code: 'ISO 9001:2015', name: 'ระบบบริหารงานคุณภาพ (Quality Management System)' },
                    { code: 'ISO 14001:2015', name: 'การจัดการสิ่งแวดล้อม (Environmental Management)' },
                    { code: 'ISO 45001:2018', name: 'อาชีวอนามัยและความปลอดภัย (Occupational Health & Safety)' },
                    { code: 'ISO 50001:2018', name: 'ระบบการจัดการพลังงาน (Energy Management System)' }
                  ].map((iso, i) => (
                    <div key={i} style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '20px 16px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FF3201', marginBottom: '6px' }}>{iso.code}</div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600, lineHeight: 1.4 }}>{iso.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Milestones Timeline (2549 - 2567) */}
              <div style={{ marginBottom: '48px' }}>
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FF3201', textTransform: 'uppercase', marginBottom: '4px' }}>MILESTONES & HISTORY</div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>เส้นทางความสำเร็จของ TERA GROUP</h2>
                </div>

                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '40px 36px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                    {[
                      { year: '2549', desc: 'ก่อตั้ง บริษัท อิเล็คทริคัล ออโตเมชั่น เทคโนโลยี จำกัด บุกเบิกบริการจำหน่าย ออกแบบ ติดตั้งอุปกรณ์ VSD ในโรงงาน' },
                      { year: '2552', desc: 'จัดตั้ง บริษัท เทอรา อิเล็กทริค จำกัด ขยายสินค้ารองรับงานกลุ่มพลังงานโซลาร์เซลล์' },
                      { year: '2557', desc: 'ได้รับการแต่งตั้งเป็นตัวแทนจำหน่ายอย่างเป็นทางการยี่ห้อ VEICHI (AC Drives)' },
                      { year: '2559', desc: 'เปลี่ยนชื่อบริษัทเป็น "บริษัท เทอรา กรุ้ป จำกัด" เพื่อรองรับการเติบโตแบบครบวงจร' },
                      { year: '2560', desc: 'จัดตั้ง บริษัท เทอรา พาวเวอร์ จำกัด รองรับกลุ่มพลังงานทางเลือก และระบบปั๊มน้ำ' },
                      { year: '2562', desc: 'เป็นตัวแทนจำหน่ายแบรนด์ POWTRAN และ PV Module RISEN ในประเทศไทย' },
                      { year: '2563', desc: 'รับมาตรฐาน ISO 9001:2015 และเป็นตัวแทน On-Grid SUNWAYS พร้อมรางวัล Gold Award' },
                      { year: '2567', desc: 'รับใบรับรอง ISO 45001:2018 (ความปลอดภัย) และ ISO 50001:2018 (จัดการพลังงาน)' }
                    ].map((m, idx) => (
                      <div key={idx} style={{
                        borderLeft: '3px solid #FF3201',
                        paddingLeft: '16px',
                        background: '#F8FAFC',
                        borderRadius: '0 12px 12px 0',
                        padding: '16px'
                      }}>
                        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FF3201', marginBottom: '4px' }}>{m.year}</div>
                        <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.5 }}>{m.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6-Step Service Workflow */}
              <div style={{
                background: '#F1F5F9',
                borderRadius: '24px',
                padding: '40px 32px'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FF3201', textTransform: 'uppercase', marginBottom: '4px' }}>SERVICE OVERVIEW</div>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>บริการครบทุกมิติด้วยทีมวิศวกรมากกว่า 15 ปี</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
                  {[
                    { step: '01', title: 'ให้คำปรึกษา', sub: 'รับฟังความต้องการ มอบคำแนะนำโดยวิศวกรผู้เชี่ยวชาญ' },
                    { step: '02', title: 'สำรวจและออกแบบ', sub: 'สำรวจหน้างานก่อนออกแบบระบบเพื่อประสิทธิภาพสูงสุด' },
                    { step: '03', title: 'ประเมินราคา', sub: 'ประเมินราคาอย่างมืออาชีพภายใต้กรอบงบประมาณ' },
                    { step: '04', title: 'จัดหาสินค้า', sub: 'คัดสรรผลิตภัณฑ์คุณภาพมาตรฐานโรงงานระดับโลก' },
                    { step: '05', title: 'ติดตั้งมาตรฐาน', sub: 'ดำเนินการติดตั้งปลอดภัยโดยทีมช่างและวิศวกร' },
                    { step: '06', title: 'บริการหลังการขาย', sub: 'อุ่นใจด้วยบริการดูแลและซ่อมบำรุงรวดเร็วตลอดเวลา' }
                  ].map((s, idx) => (
                    <div key={idx} style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '20px 14px',
                      border: '1px solid #E2E8F0',
                      textAlign: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FF3201', marginBottom: '6px' }}>{s.step}</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>{s.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', lineHeight: 1.4 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ORDERS & TRACKING TAB */}
        {activeTab === 'orders' && (
          <section id="tab-orders" className="tab-section active" style={{ padding: '80px 24px', background: '#F8FAFC', minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ maxWidth: '560px', width: '100%', margin: '0 auto', textAlign: 'center', background: '#FFFFFF', borderRadius: '24px', padding: '48px 32px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
              
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 50, 1, 0.08)', color: '#FF3201', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
                <Truck size={40} />
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0' }}>
                ติดตามสถานะคำสั่งซื้อ & ประวัติออเดอร์
              </h2>

              <p style={{ fontSize: '0.98rem', color: '#64748B', lineHeight: 1.6, margin: '0 0 32px 0' }}>
                กรุณาเข้าสู่ระบบเพื่อดูประวัติการสั่งซื้อ ติดตามสถานะจัดส่งพัสดุ และตรวจสอบรายละเอียดคำสั่งซื้อทั้งหมดของคุณ
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={() => { setActiveTab('profile'); setAuthTab('login'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700, borderRadius: '12px' }}
                >
                  เข้าสู่ระบบ / สมัครสมาชิก
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ width: '100%', padding: '12px', fontSize: '0.9rem', color: '#64748B', borderRadius: '12px' }}
                >
                  กลับสู่หน้าหลัก
                </button>
              </div>
            </div>
          </section>
        )}

      {/* Footer view matching Figma screenshot 100% */}
      <footer className={`main-footer ${activeTab === 'profile' && !user ? 'no-top-margin' : ''}`} style={{
        background: '#1E293B',
        color: '#94A3B8',
        padding: '48px 24px 32px',
        borderTop: '1px solid #334155',
        marginTop: activeTab === 'profile' && !user ? 0 : undefined
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.1fr 1.4fr 1.4fr 1.3fr', gap: '36px', marginBottom: '40px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <img src="/tera_logo_red_badge.png" alt="Tera Group Logo" style={{ height: '42px', width: 'auto', objectFit: 'contain', marginBottom: '16px', borderRadius: '4px' }} />
              <div style={{ color: '#E2E8F0', fontWeight: 700, fontSize: '0.95rem', textAlign: 'left', marginBottom: '6px' }}>บริษัท เทอรา กรุ้ป จำกัด</div>
              <div style={{ fontSize: '0.82rem', color: '#94A3B8', textAlign: 'left', opacity: 0.8 }}>ผู้นำด้านเทคโนโลยีและอุปกรณ์ดิจิทัล</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', padding: 0, textAlign: 'left' }}>บริการลูกค้า</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', alignItems: 'flex-start', textAlign: 'left' }}>
                <a href="https://www.teragroup.co.th/contact-us-th/" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', opacity: 0.8, textDecoration: 'none' }}>ติดต่อเรา</a>
                <a href="#faq" style={{ color: '#94A3B8', opacity: 0.8, textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); showToast('คำถามที่พบบ่อย'); }}>คำถามที่พบบ่อย</a>
                <a href="#returns" style={{ color: '#94A3B8', opacity: 0.8, textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); showToast('นโยบายการรับประกันสินค้า'); }}>นโยบายการคืนสินค้า</a>
                <a href="#orders" style={{ color: '#94A3B8', opacity: 0.8, textDecoration: 'none' }} onClick={(e) => { 
                  e.preventDefault(); 
                  if (user) {
                    setActiveTab('profile'); 
                    setProfileSubTab('orders');
                    fetchOrders(); 
                  } else {
                    setActiveTab('orders');
                  }
                  window.scrollTo({ top: 0, behavior: 'smooth' }); 
                }}>ติดตามออเดอร์</a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', padding: 0, textAlign: 'left' }}>เกี่ยวกับเรา</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', alignItems: 'flex-start', textAlign: 'left' }}>
                <a href="https://www.teragroup.co.th/about-us/" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', opacity: 0.8, textDecoration: 'none' }}>เกี่ยวกับ Tera Group</a>
                <a href="#careers" style={{ color: '#94A3B8', opacity: 0.8, textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); showToast('ร่วมงานกับเรา'); }}>ร่วมงานกับเรา</a>
                <a href="https://www.teragroup.co.th/category/news-activities/" target="_blank" rel="noopener noreferrer" style={{ color: '#94A3B8', opacity: 0.8, textDecoration: 'none' }}>ข่าวสารองค์กร</a>
                <a href="#partners" style={{ color: '#94A3B8', opacity: 0.8, textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); showToast('พันธมิตรทางธุรกิจ'); }}>พันธมิตรธุรกิจ</a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', padding: 0, textAlign: 'left' }}>ช่องทาง Social Media</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start', flexWrap: 'nowrap' }}>
                {[
                  { name: 'Facebook', url: 'https://www.facebook.com/teragroup0818198637', icon: '/social_fb.svg' },
                  { name: 'LINE', url: 'https://line.me/ti/p/~@teragroup', icon: '/social_line.svg' },
                  { name: 'TikTok', url: 'https://www.tiktok.com/@teragroup_inverter', icon: '/tiktok-logo-2--1.svg', isFull: true },
                  { name: 'YouTube', url: 'https://www.youtube.com/@teragroup3679', icon: '/social_yt.svg' },
                  { name: 'Shopee', url: 'https://shopee.co.th/teragroup', icon: '/social_shopee.svg' },
                  { name: 'Lazada', url: 'https://www.lazada.co.th/shop/teragroup/', icon: '/social_lazada.svg' }
                ].map((item) => (
                  <a 
                    key={item.name}
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title={item.name}
                    style={{ textDecoration: 'none', display: 'inline-block', flexShrink: 0 }}
                  >
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '5px',
                      overflow: 'hidden',
                      display: 'block',
                      position: 'relative'
                    }}>
                      <img 
                        src={item.icon} 
                        alt={item.name} 
                        style={{ 
                          width: '100%', 
                          height: item.isFull ? '100%' : '133.33%', 
                          objectFit: 'cover',
                          objectPosition: 'top',
                          display: 'block'
                        }} 
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <h4 style={{ color: '#FFFFFF', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', padding: 0, textAlign: 'left' }}>ชำระเงิน</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start', pointerEvents: 'none' }}>
                {/* 1. PromptPay (Image 31) */}
                <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '4px 10px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', boxSizing: 'border-box' }}>
                  <img src="/address_payment_images/image 31.svg" alt="PromptPay" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = '/image_31.svg'; }} />
                </div>

                {/* 2. TrueMoney (Image 196) */}
                <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '4px 10px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0', boxSizing: 'border-box' }}>
                  <img src="/address_payment_images/image 196.svg" alt="TrueMoney" style={{ height: '26px', width: 'auto', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = '/image_196.svg'; }} />
                </div>

                {/* 3. Bank Transfer (Image 197 + Blue Border) */}
                <div style={{ background: '#FFFFFF', borderRadius: '8px', padding: '4px 10px', height: '38px', border: '1.5px solid #044F90', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxSizing: 'border-box' }}>
                  <img src="/address_payment_images/image 197.svg" alt="Bank" style={{ width: '18px', height: '18px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).src = '/image_197.svg'; }} />
                  <span style={{ color: '#005C83', fontSize: '13px', fontWeight: 600 }}>ธนาคาร</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #334155', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#64748B' }}>
            © 2026 Tera Group Co., Ltd. All rights reserved. TeraSmart E-Commerce Platform v5
          </div>
        </div>
      </footer>

      {/* Bottom Navigation (Mobile) */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <button className={`bottom-nav-item ${activeTab === 'catalog' ? 'active' : ''}`} onClick={() => setActiveTab('catalog')}>
            <ShoppingBag size={22} />
            <span>สินค้า</span>
          </button>
          {user && (
            <button className={`bottom-nav-item ${activeTab === 'cart' ? 'active' : ''}`} onClick={() => setActiveTab('cart')}>
              <ShoppingCart size={22} />
              {cartItems.length > 0 && <span className="nav-badge">{cartItems.length}</span>}
              <span>ตะกร้า</span>
            </button>
          )}
          {user && (
            <button className={`bottom-nav-item ${activeTab === 'orders' || (activeTab === 'profile' && profileSubTab === 'orders') ? 'active' : ''}`} onClick={() => { 
              if (user) {
                setActiveTab('profile'); 
                setProfileSubTab('orders');
                fetchOrders(); 
              } else {
                setActiveTab('orders');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }}>
              <Clock size={22} />
              {orders.filter(o => o.status === 'pending').length > 0 && <span className="nav-badge">{orders.filter(o => o.status === 'pending').length}</span>}
              <span>คำสั่งซื้อ</span>
            </button>
          )}
          <button className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <User size={22} />
            <span>โปรไฟล์</span>
          </button>
        </div>
      </nav>

      {/* Forgot Password Modal */}
      {isForgotPasswordModalOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsForgotPasswordModalOpen(false);
          }}
        >
          <div 
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div 
              style={{
                padding: '24px 28px 16px 28px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255, 50, 1, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3201' }}>
                  <Key size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>
                    {forgotStep === 'request' ? 'ลืมรหัสผ่าน (Forgot Password)' : 'ตั้งรหัสผ่านใหม่ (Reset Password)'}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                    {forgotStep === 'request' ? 'กรอกอีเมลเพื่อรับรหัสกู้คืนรหัสผ่าน' : 'กรอกรหัสยืนยัน 6 หลักและตั้งรหัสผ่านใหม่'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsForgotPasswordModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px' }}>
              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestForgotToken}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
                      อีเมลผู้ใช้ของคุณ (Your Email)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input 
                        type="email" 
                        required
                        placeholder="example@email.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        style={{
                          width: '100%',
                          height: '46px',
                          paddingLeft: '42px',
                          paddingRight: '14px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    style={{
                      width: '100%',
                      height: '48px',
                      background: '#FF3201',
                      color: '#FFFFFF',
                      borderRadius: '14px',
                      border: 'none',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: isForgotLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isForgotLoading ? <RefreshCw size={18} className="spin" /> : <Mail size={18} />}
                    {isForgotLoading ? 'กำลังส่งรหัส...' : 'ส่งรหัสกู้คืนรหัสผ่าน'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmResetPassword}>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      รหัสกู้คืน 6 หลัก (Recovery Code)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Key size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input 
                        type="text" 
                        required
                        placeholder="เช่น TS-123456"
                        value={forgotToken}
                        onChange={(e) => setForgotToken(e.target.value)}
                        style={{
                          width: '100%',
                          height: '44px',
                          paddingLeft: '42px',
                          paddingRight: '14px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      รหัสผ่านใหม่ (New Password)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input 
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        style={{
                          width: '100%',
                          height: '44px',
                          paddingLeft: '42px',
                          paddingRight: '42px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                      >
                        {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                      ยืนยันรหัสผ่านใหม่ (Confirm New Password)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                      <input 
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        style={{
                          width: '100%',
                          height: '44px',
                          paddingLeft: '42px',
                          paddingRight: '42px',
                          borderRadius: '12px',
                          border: '1.5px solid #E2E8F0',
                          fontSize: '0.92rem',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                      >
                        {showForgotConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setForgotStep('request')}
                      style={{
                        flex: 1,
                        height: '46px',
                        background: '#F1F5F9',
                        color: '#475569',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      ย้อนกลับ
                    </button>
                    <button
                      type="submit"
                      disabled={isForgotLoading}
                      style={{
                        flex: 2,
                        height: '46px',
                        background: '#FF3201',
                        color: '#FFFFFF',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        cursor: isForgotLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      {isForgotLoading ? <RefreshCw size={16} className="spin" /> : <CheckCircle size={16} />}
                      {isForgotLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
