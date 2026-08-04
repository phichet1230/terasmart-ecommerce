import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, Users, Package, ShoppingBag, DollarSign, 
  AlertCircle, ShieldCheck, Truck, Edit3, Trash2, Plus, X, 
  Settings, LogOut, ArrowLeft, Download, RefreshCw, Clock, Eye, Sparkles,
  Printer, Shield, Briefcase, CheckCircle2, XCircle, Search, UserPlus, Sliders, FileText, ListChecks, Layers, Image as ImageIcon,
  TrendingUp, Activity
} from 'lucide-react';
import '../admin.css';

interface Variant {
  id: number;
  variant_name: string;
  sku: string;
  price: string;
  stock_quantity: number;
}

interface SpecRowInput {
  col1: string;
  col2: string;
  col3?: string;
}

interface AccessoryItem {
  item: string;
  spec: string;
  cat: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  slug: string;
  image_url: string;
  images?: string[];
  detail_image_1?: string;
  detail_image_2?: string;
  spec_headers?: string[];
  spec_table?: SpecRowInput[];
  advice_list?: string[];
  accessories_list?: AccessoryItem[];
  category_name: string;
  price: string;
  variants: Variant[];
}

interface Order {
  id: string;
  username: string;
  email: string;
  total_price: string;
  status: string;
  created_at: string;
  payment_status: string | null;
  slip_url: string | null;
  transaction_ref: string | null;
  courier_name: string | null;
  tracking_number: string | null;
}

interface Customer {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  account_status: string;
  created_at: string;
}

interface Employee {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  department: 'admin' | 'stock' | 'shipping' | 'accounting' | 'sales' | 'marketing';
  role_title: string;
  status: 'active' | 'leave' | 'inactive';
  joined_date: string;
  permissions: string[];
}

interface DepartmentInfo {
  id: 'admin' | 'stock' | 'shipping' | 'accounting' | 'sales' | 'marketing';
  title: string;
  titleEn: string;
  description: string;
  color: string;
  bgColor: string;
  icon: any;
  permissionsCount: number;
}

// Dynamic vector SVG illustration generator
const renderProductSvg = (productName: string) => {
  const name = (productName || '').toLowerCase();
  if (name.includes('phone')) {
    return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', color: '#3182ce', filter: 'drop-shadow(0 6px 14px rgba(49, 130, 206, 0.35))' }}>
        <rect x="26" y="8" width="48" height="84" rx="9" fill="#1a202c" stroke="#4a5568" strokeWidth="2.5" />
        <rect x="29" y="11" width="42" height="78" rx="7" fill="url(#phone-screen-grad-admin)" />
        <rect x="41" y="14" width="18" height="4.5" rx="2.5" fill="#0c0d12" />
        <circle cx="50" cy="83" r="2.5" fill="#2d3748" />
        <defs>
          <linearGradient id="phone-screen-grad-admin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3182ce" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#805ad5" stopOpacity="0.85" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  if (name.includes('watch')) {
    return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', color: '#e53e3e', filter: 'drop-shadow(0 6px 14px rgba(229, 62, 62, 0.35))' }}>
        <rect x="42" y="4" width="16" height="26" rx="3" fill="#2d3748" />
        <rect x="42" y="70" width="16" height="26" rx="3" fill="#2d3748" />
        <rect x="28" y="28" width="44" height="44" rx="12" fill="#1a202c" stroke="#4a5568" strokeWidth="2.5" />
        <rect x="31" y="31" width="38" height="38" rx="9" fill="url(#watch-screen-grad-admin)" />
        <circle cx="50" cy="50" r="12" fill="none" stroke="#ffffff" strokeDasharray="2,2" strokeWidth="1.2" />
        <line x1="50" y1="50" x2="50" y2="40" stroke="#ff3201" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="50" y1="50" x2="59" y2="50" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
        <defs>
          <linearGradient id="watch-screen-grad-admin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2d3748" />
            <stop offset="100%" stopColor="#141622" />
          </linearGradient>
        </defs>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" style={{ width: '80%', height: '80%', color: 'var(--text-muted)', opacity: 0.4 }}>
      <rect x="25" y="25" width="50" height="50" rx="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M25,25 L75,75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M75,25 L25,75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
};

const ProductImage = ({ name, imageUrl }: { name: string; imageUrl?: string }) => {
  const [error, setError] = React.useState(false);

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'customers' | 'products' | 'banners' | 'employees'>('dashboard');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Department definitions
  const departments: DepartmentInfo[] = [
    {
      id: 'admin',
      title: 'ฝ่ายบริหาร & IT (Super Admin)',
      titleEn: 'Executive & IT Security',
      description: 'ดูแลและควบคุมความปลอดภัยของระบบทั้งหมด กำหนดสิทธิ์พนักงานหลังบ้าน ตรวจสอบ Log และการตั้งค่าระบบหลัก',
      color: '#FF3201',
      bgColor: 'rgba(255, 50, 1, 0.1)',
      icon: ShieldCheck,
      permissionsCount: 12
    },
    {
      id: 'stock',
      title: 'ฝ่ายคลังสินค้า & สต็อก',
      titleEn: 'Stock & Inventory Dept',
      description: 'จัดการแคตตาล็อกสินค้า อัปเดตรูปภาพประกอบรายละเอียดสินค้า (Detail Images) ตารางสเปกหลายคอลัมน์ และอุปกรณ์เสริม',
      color: '#2563EB',
      bgColor: 'rgba(37, 99, 235, 0.1)',
      icon: Package,
      permissionsCount: 8
    },
    {
      id: 'shipping',
      title: 'ฝ่ายจัดส่ง & ขนส่งพัสดุ',
      titleEn: 'Logistics & Shipping Dept',
      description: 'พิมพ์ใบแปะหน้าพัสดุ (Shipping Label) ออกเลข Tracking, อัปเดตสถานะการจัดส่ง และประสานงานบริษัทขนส่งเอกชน',
      color: '#7C3AED',
      bgColor: 'rgba(124, 58, 237, 0.1)',
      icon: Truck,
      permissionsCount: 6
    },
    {
      id: 'accounting',
      title: 'ฝ่ายบัญชี & การเงิน',
      titleEn: 'Accounting & Finance Dept',
      description: 'ตรวจสอบสลิปโอนเงิน อนุมัติยอดชำระ ออกใบกำกับภาษี/ใบเสร็จรับเงิน และสรุปรายงานยอดขายสะสม',
      color: '#059669',
      bgColor: 'rgba(5, 150, 105, 0.1)',
      icon: DollarSign,
      permissionsCount: 9
    },
    {
      id: 'sales',
      title: 'ฝ่ายบริการลูกค้า & ฝ่ายขาย',
      titleEn: 'Customer Support & Sales',
      description: 'ดูแลข้อมูลสมาชิกและลูกค้า รับเรื่องร้องเรียน ตรวจสอบประวัติการสั่งซื้อ ให้บริการหลังการขายและการติดต่อสื่อสาร',
      color: '#D97706',
      bgColor: 'rgba(217, 119, 6, 0.1)',
      icon: Users,
      permissionsCount: 7
    },
    {
      id: 'marketing',
      title: 'ฝ่ายการตลาด & คอนเทนต์',
      titleEn: 'Marketing & Content Dept',
      description: 'จัดการสไลเดอร์แบนเนอร์หน้าร้าน สร้างแคมเปญสื่ิอโปรโมชัน สินค้าไฮไลท์ และกิจกรรมส่งเสริมการขาย',
      color: '#DB2777',
      bgColor: 'rgba(219, 39, 119, 0.1)',
      icon: Sparkles,
      permissionsCount: 5
    }
  ];

  // Initial Back-office Employees state
  const initialEmployees: Employee[] = [
    {
      id: 'emp-1',
      code: 'EMP-2026-001',
      name: 'สมชาย ใจดี',
      email: 'somchai.j@teragroup.com',
      phone: '081-234-5678',
      department: 'admin',
      role_title: 'IT System Admin & Director',
      status: 'active',
      joined_date: '2025-01-15',
      permissions: ['Full Access', 'User Management', 'System Config']
    },
    {
      id: 'emp-2',
      code: 'EMP-2026-002',
      name: 'สมศรี มีสุข',
      email: 'somsri.m@teragroup.com',
      phone: '082-345-6789',
      department: 'accounting',
      role_title: 'Financial Accounting Manager',
      status: 'active',
      joined_date: '2025-03-01',
      permissions: ['Bank Slip Verification', 'Invoice Generation', 'Revenue Reports']
    },
    {
      id: 'emp-3',
      code: 'EMP-2026-003',
      name: 'ประเสริฐ เรืองฤทธิ์',
      email: 'prasert.r@teragroup.com',
      phone: '083-456-7890',
      department: 'stock',
      role_title: 'Senior Inventory Specialist',
      status: 'active',
      joined_date: '2025-04-10',
      permissions: ['Product Catalog CRUD', 'Detail Images Manager', 'Multi-column Spec Tables']
    },
    {
      id: 'emp-4',
      code: 'EMP-2026-004',
      name: 'มานพ ส่งชัย',
      email: 'manop.s@teragroup.com',
      phone: '084-567-8901',
      department: 'shipping',
      role_title: 'Logistics Coordinator',
      status: 'active',
      joined_date: '2025-06-20',
      permissions: ['Order Shipment Status', 'Tracking Number Entry', 'Shipping Labels']
    },
    {
      id: 'emp-5',
      code: 'EMP-2026-005',
      name: 'รัตนา บริการดี',
      email: 'rattana.b@teragroup.com',
      phone: '085-678-9012',
      department: 'sales',
      role_title: 'Customer Service Supervisor',
      status: 'active',
      joined_date: '2025-08-12',
      permissions: ['Customer Account Status', 'Order Inquiry', 'Customer Support']
    },
    {
      id: 'emp-6',
      code: 'EMP-2026-006',
      name: 'วิชัย สื่อสร้างสรรค์',
      email: 'wichai.c@teragroup.com',
      phone: '086-789-0123',
      department: 'marketing',
      role_title: 'Marketing & Banner Content Designer',
      status: 'active',
      joined_date: '2025-10-05',
      permissions: ['Hero Banner CRUD', 'Promotion Highlights', 'Campaign Management']
    }
  ];

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('tera_backoffice_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  // Employee Modal state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDept, setEmpDept] = useState<'admin' | 'stock' | 'shipping' | 'accounting' | 'sales' | 'marketing'>('stock');
  const [empRoleTitle, setEmpRoleTitle] = useState('');

  // Shipping Label Print state
  const [printingOrderLabel, setPrintingOrderLabel] = useState<Order | null>(null);

  // Slip Audit state
  const [verifyingOrderSlip, setVerifyingOrderSlip] = useState<Order | null>(null);
  const [slipNote, setSlipNote] = useState('');

  // Product Details Inspector Modal State (Back-Office View)
  const [viewingProductDetail, setViewingProductDetail] = useState<Product | null>(null);

  // Metrics states
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    activeCustomers: 0,
    pendingPayments: 0,
    teamKpis: [] as any[],
    recentAuditLogs: [] as any[]
  });

  // Table lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem('tera_storefront_products');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 1,
        name: 'ปั๊มน้ำซับเมิร์สโซล่าเซลล์ Tera Solar Pump 4 นิ้ว (DC Brushless)',
        description: 'ปั๊มน้ำบาดาลโซล่าเซลล์ มอเตอร์ DC บรัสเลส ไร้แปรงถ่าน ประสิทธิภาพสูง ตัวเรือนสแตนเลส 304 ทนทาน รองรับแรงดันกว้าง',
        slug: 'tera-solar-pump-4-inch',
        image_url: '/checkout_images/image 156.svg',
        detail_image_1: '/checkout_images/image 156.svg',
        category_name: 'ปั้มน้ำบาดาล',
        price: '18500',
        variants: [
          { id: 101, variant_name: 'รุ่น 1100W (1.5 HP) 80-210V', sku: 'TERA-SI4VS-1100', price: '18500', stock_quantity: 15 },
          { id: 102, variant_name: 'รุ่น 1500W (2.0 HP) 110-250V', sku: 'TERA-SI4VS-1500', price: '24900', stock_quantity: 10 },
          { id: 103, variant_name: 'รุ่น 2200W (3.0 HP) High Flow', sku: 'TERA-SI4VS-2200', price: '32500', stock_quantity: 8 }
        ]
      },
      {
        id: 2,
        name: 'แผงโซล่าเซลล์ Tera Mono Half-Cut 550W (Tier 1 N-Type High Efficiency)',
        description: 'แผงโซล่าเซลล์ ชนิด โมโนคริสตัลไลน์ N-Type Half-Cut Cell กำลังผลิตสูงสุด 550W ผ่านการรับรองมาตรฐานสากล Tier 1',
        slug: 'tera-mono-half-cut-550w',
        image_url: '/checkout_images/image 206.svg',
        category_name: 'แผงโซล่าเซลล์ & ระบบพลังงาน',
        price: '3500',
        variants: [
          { id: 201, variant_name: 'ชุด 1 แผง (Single Panel)', sku: 'TERA-SOLAR-550W-1', price: '3500', stock_quantity: 50 },
          { id: 202, variant_name: 'แพ็ค 4 แผง (Set of 4 Panels)', sku: 'TERA-SOLAR-550W-4', price: '13200', stock_quantity: 20 }
        ]
      },
      {
        id: 3,
        name: 'ตู้ควบคุมปั๊มน้ำโซล่าเซลล์อัตโนมัติ (DC Surge & Breaker Control Box)',
        description: 'ตู้ควบคุมระบบปั๊มน้ำโซล่าเซลล์สำเร็จรูป พร้อมอุปกรณ์ป้องกันฟ้าผ่า (Surge Protection) และเบรกเกอร์ DC ตัดการทำงานอัตโนมัติเมื่อน้ำแห้ง',
        slug: 'tera-dc-control-box',
        image_url: '/checkout_images/image 207.svg',
        category_name: 'แผงโซล่าเซลล์ & ระบบพลังงาน',
        price: '1450',
        variants: [
          { id: 301, variant_name: 'รุ่นมาตรฐาน DC 1000V (Standard)', sku: 'TERA-BOX-DC-STD', price: '1450', stock_quantity: 30 },
          { id: 302, variant_name: 'รุ่นพรีเมียม AC/DC Hybrid Auto Switch', sku: 'TERA-BOX-HYBRID', price: '3850', stock_quantity: 15 }
        ]
      },
      {
        id: 4,
        name: 'Tera Phone 15 Pro Max 5G (Flagship Smartphone)',
        description: 'สมาร์ทโฟนระดับเรือธง ชิปประมวลผลรุ่นใหม่ล่าสุด จอแสดงผล 120Hz Super Retina XDR กล้องถ่ายภาพความละเอียดสูง 108MP พร้อมระบบชาร์จไว',
        slug: 'tera-phone-15-pro-max',
        image_url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800',
        category_name: 'สมาร์ทไอที & อิเล็กทรอนิกส์',
        price: '42900',
        variants: [
          { id: 401, variant_name: 'ความจุ 256GB - Titanium Natural', sku: 'TERA-P15-256GB', price: '42900', stock_quantity: 12 },
          { id: 402, variant_name: 'ความจุ 512GB - Titanium Black', sku: 'TERA-P15-512GB', price: '48900', stock_quantity: 5 }
        ]
      },
      {
        id: 5,
        name: 'Tera Laptop Pro 16 Workstation Notebook',
        description: 'แล็ปท็อปสำหรับการทำงานวิศวกรรมและการประมวลผลหนัก หน้าจอ 16 นิ้ว 4K OLED ตัวเรือนอลูมิเนียมแอร์คราฟต์เกรด',
        slug: 'tera-laptop-pro-16',
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        category_name: 'สมาร์ทไอที & อิเล็กทรอนิกส์',
        price: '69900',
        variants: [
          { id: 501, variant_name: 'RAM 18GB / SSD 512GB', sku: 'TERA-LAP-18GB', price: '69900', stock_quantity: 7 },
          { id: 502, variant_name: 'RAM 36GB / SSD 1TB', sku: 'TERA-LAP-36GB', price: '89900', stock_quantity: 4 }
        ]
      },
      {
        id: 6,
        name: 'Tera Smart Watch Ultra 2 (Solar Charging & GPS)',
        description: 'นาฬิกาสมาร์ทวอทช์สายลุย ชาร์จพลังงานแสงอาทิตย์ได้ในตัว วัดระดับออกซิเจน การเต้นของหัวใจ พร้อมระบบ GPS นำทางแม่นยำสูง',
        slug: 'tera-smart-watch-ultra-2',
        image_url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800',
        category_name: 'สมาร์ทไอที & อิเล็กทรอนิกส์',
        price: '14900',
        variants: [
          { id: 601, variant_name: 'สายสปอร์ต Titanium Band', sku: 'TERA-WATCH-ULTRA', price: '14900', stock_quantity: 25 }
        ]
      },
      {
        id: 7,
        name: 'สายไฟจุ่มน้ำ VCT 3x2.5 sq.mm (Submersible Power Cable)',
        description: 'สายไฟชนิด VCT 3 ฉนวนกันน้ำพิเศษ 3-Core สำหรับงานปั๊มน้ำบาดาลจุ่มน้ำ ทนความชื้นและแรงดันน้ำลึกได้อย่างดีเยี่ยม',
        slug: 'tera-submersible-cable-vct-3x25',
        image_url: '/checkout_images/image 208.svg',
        category_name: 'อะไหล่ & อุปกรณ์เสริม',
        price: '2250',
        variants: [
          { id: 701, variant_name: 'ความยาว 50 เมตร', sku: 'TERA-CABLE-50M', price: '2250', stock_quantity: 40 },
          { id: 702, variant_name: 'ความยาว 100 เมตร', sku: 'TERA-CABLE-100M', price: '4100', stock_quantity: 20 }
        ]
      },
      {
        id: 8,
        name: 'สลิงสแตนเลส 304 หนา 4 มม. (Stainless Steel Wire Rope)',
        description: 'สลิงสแตนเลสเกรด 304 ไร้สนิม ทนทานแรงดึงสูง สำหรับผูกแขวนปั๊มน้ำบาดาลในบ่อลึก ปลอดภัยตลอดอายุการใช้งาน',
        slug: 'tera-stainless-wire-rope-4mm',
        image_url: '/checkout_images/image 209.svg',
        category_name: 'อะไหล่ & อุปกรณ์เสริม',
        price: '980',
        variants: [
          { id: 801, variant_name: 'ความยาว 50 เมตร + กิ๊บล็อก 4 ตัว', sku: 'TERA-ROPE-50M', price: '980', stock_quantity: 35 }
        ]
      }
    ];
  });

  // Banners CRUD state & helpers
  interface BannerItem {
    id: number;
    src: string;
    title: string;
    active: boolean;
  }

  const defaultBannersList: BannerItem[] = [
    { id: 1, src: '/our_brands_all.png', title: 'Our Brand of product - Tera Group', active: true },
    { id: 2, src: '/hero_banner_full.png', title: 'Industrial Automation & Inverter Solutions', active: true },
    { id: 3, src: '/hero_machinery_showcase.png', title: 'VEICHI AC Drives & High Precision Servo Motors', active: true },
    { id: 4, src: '/hero_machinery_showcase_alt.png', title: 'Solar Agricultural Inverters & Pumping Systems', active: true }
  ];

  const [banners, setBanners] = useState<BannerItem[]>(defaultBannersList);

  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSrc, setBannerSrc] = useState('');
  const [bannerActive, setBannerActive] = useState(true);

  // Dialog / Edit states
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editOrderStatus, setEditOrderStatus] = useState('');
  const [editCourierName, setEditCourierName] = useState('');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');

  interface VariantInput {
    id?: number;
    variant_name: string;
    sku?: string;
    price: string;
    stock_quantity: number;
  }

  // Product CRUD states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [productImagesText, setProductImagesText] = useState('');
  const [productVariants, setProductVariants] = useState<VariantInput[]>([]);
  
  // Dynamic Product Detail Images States (รูปประกอบรายละเอียดสินค้า #1 และ #2)
  const [productDetailImg1, setProductDetailImg1] = useState<string>('');
  const [productDetailImg2, setProductDetailImg2] = useState<string>('');

  // Dynamic Multi-column Spec Table States
  const [specTableHeaders, setSpecTableHeaders] = useState<string[]>(['หัวข้อข้อมูล', 'รายละเอียดทางเทคนิค (Details)', 'หมายเหตุ / โมเดล']);
  const [productSpecRows, setProductSpecRows] = useState<SpecRowInput[]>([]);
  
  // Additional Advice Points & Compatible Accessories States
  const [productAdviceList, setProductAdviceList] = useState<string[]>([]);
  const [productAccessoriesList, setProductAccessoriesList] = useState<AccessoryItem[]>([]);

  // Toast dialog
  const [toasts, setToasts] = useState<string[]>([]);

  // Profile settings states for employees
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const defaultPumpSpecHeaders = ['หัวข้อข้อมูล', 'รายละเอียดทางเทคนิค (Details)', 'หมายเหตุ / โมเดล'];
  
  const defaultPumpSpecRows: SpecRowInput[] = [
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
  ];

  const defaultAdvicePoints: string[] = [
    'ห้ามดัดแปลง แก้ไขสินค้า หรือนำไปใช้งานผิดประเภท',
    'ห้ามใช้สารเคมีที่มีฤทธิ์เป็นกรด และด่างทำความสะอาด',
    'จัดเก็บในที่แห้ง และพ้นมือเด็ก',
    'ห้ามจัดเก็บใกล้ความร้อน และเปลวไฟ',
    'ห้ามใช้งานร่วมกับอุปกรณ์ที่ไม่ได้มาตรฐาน',
    'หากสินค้าชำรุดเสียหาย ควรส่งให้ช่างเป็นผู้ซ่อม'
  ];

  const defaultAccessoriesList: AccessoryItem[] = [
    { item: 'แผงโซลาร์เซลล์ Mono', spec: '500W (ใช้ออกแบบเซ็ต 3-4 แผง)', cat: 'Power' },
    { item: 'สายไฟจุ่มน้ำ VCT 3 Core', spec: '3 X 2.5 mm² (ยาว 30m / 50m)', cat: 'Cable' },
    { item: 'สลิงสแตนเลส 304', spec: 'หนา 4 mm (รับน้ำหนักปั๊ม)', cat: 'Rigging' },
    { item: 'ฝาปิดปากบ่อบาดาล', spec: 'ขนาด 4 นิ้ว (ท่อออก 1 1/4")', cat: 'Hardware' },
    { item: 'ชุดตู้ควบคุม DC กันฟ้าผ่า', spec: 'DC Surge + Breaker Box', cat: 'Safety' },
    { item: 'ข้อต่อเกลียวนอก', spec: 'ทองเหลือง/สแตนเลส 1 1/4"', cat: 'Fitting' }
  ];

  const saveEmployeesState = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    localStorage.setItem('tera_backoffice_employees', JSON.stringify(newEmployees));
  };

  const saveBannersState = (newBanners: BannerItem[]) => {
    setBanners(newBanners);
    localStorage.setItem('tera_storefront_banners', JSON.stringify(newBanners));
    window.dispatchEvent(new Event('tera_banners_updated'));
  };

  const saveProductsState = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('tera_storefront_products', JSON.stringify(newProducts));
    window.dispatchEvent(new Event('tera_products_updated'));
  };

  const openAddBannerModal = () => {
    setEditingBanner(null);
    setBannerTitle('');
    setBannerSrc('');
    setBannerActive(true);
    setIsBannerModalOpen(true);
  };

  const openEditBannerModal = (b: BannerItem) => {
    setEditingBanner(b);
    setBannerTitle(b.title);
    setBannerSrc(b.src);
    setBannerActive(b.active);
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerSrc.trim()) {
      showToast('กรุณากรอกข้อมูลชื่อแบรนเนอร์และรูปภาพให้ครบถ้วน');
      return;
    }
    try {
      if (editingBanner) {
        await apiRequest(`/api/v1/banners/${editingBanner.id}`, 'PUT', {
          title: bannerTitle.trim(),
          src: bannerSrc.trim(),
          active: bannerActive
        });
        showToast('แก้ไขรูปภาพแบรนเนอร์เรียบร้อย!');
      } else {
        await apiRequest('/api/v1/banners', 'POST', {
          title: bannerTitle.trim(),
          src: bannerSrc.trim(),
          active: bannerActive
        });
        showToast('เพิ่มรูปภาพแบรนเนอร์ใหม่เรียบร้อย!');
      }
      await loadBanners();
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + (err.message || ''));
    }
    setIsBannerModalOpen(false);
  };

  const toggleBannerActive = async (id: number) => {
    const target = banners.find(b => b.id === id);
    if (!target) return;
    try {
      await apiRequest(`/api/v1/banners/${id}`, 'PUT', { active: !target.active });
      showToast('อัปเดตสถานะแบรนเนอร์เรียบร้อย');
      await loadBanners();
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาด: ' + (err.message || ''));
    }
  };

  const deleteBanner = async (id: number) => {
    if (banners.length <= 1) {
      showToast('ต้องมีแบรนเนอร์อย่างน้อย 1 รายการในระบบ');
      return;
    }
    try {
      await apiRequest(`/api/v1/banners/${id}`, 'DELETE');
      showToast('ลบแบรนเนอร์เรียบร้อย');
      await loadBanners();
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการลบ: ' + (err.message || ''));
    }
  };

  const addVariantRow = () => {
    setProductVariants((prev) => [
      ...prev,
      { variant_name: `รุ่นที่ ${prev.length + 1}`, price: productPrice || '0', stock_quantity: 10 }
    ]);
  };

  const removeVariantRow = (index: number) => {
    if (productVariants.length <= 1) {
      showToast('สินค้าต้องมีตัวเลือกรุ่นอย่างน้อย 1 รายการ');
      return;
    }
    setProductVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariantRow = (index: number, field: keyof VariantInput, value: any) => {
    setProductVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Dynamic Multi-column Spec Table Row Handlers
  const addSpecRow = () => {
    setProductSpecRows((prev) => [
      ...prev,
      { col1: '', col2: '', col3: '' }
    ]);
  };

  const removeSpecRow = (index: number) => {
    setProductSpecRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSpecRow = (index: number, field: keyof SpecRowInput, value: string) => {
    setProductSpecRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Advice Handlers
  const addAdviceItem = () => {
    setProductAdviceList((prev) => [...prev, 'ข้อแนะนำใหม่...']);
  };

  const removeAdviceItem = (index: number) => {
    setProductAdviceList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAdviceItem = (index: number, value: string) => {
    setProductAdviceList((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  // Accessories Handlers
  const addAccessoryItem = () => {
    setProductAccessoriesList((prev) => [
      ...prev,
      { item: 'อุปกรณ์ใหม่', spec: 'สเปกแนะนำ', cat: 'Power' }
    ]);
  };

  const removeAccessoryItem = (index: number) => {
    setProductAccessoriesList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAccessoryItem = (index: number, field: keyof AccessoryItem, value: string) => {
    setProductAccessoriesList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const openAddEmployeeModal = () => {
    setEditingEmployee(null);
    setEmpName('');
    setEmpEmail('');
    setEmpPhone('');
    setEmpDept('stock');
    setEmpRoleTitle('เจ้าหน้าที่คลังสินค้า');
    setIsEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpEmail(emp.email);
    setEmpPhone(emp.phone);
    setEmpDept(emp.department);
    setEmpRoleTitle(emp.role_title);
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim()) {
      showToast('กรุณากรอกข้อมูลชื่อและอีเมลให้ครบถ้วน');
      return;
    }

    if (editingEmployee) {
      const updated = employees.map(emp => emp.id === editingEmployee.id ? {
        ...emp,
        name: empName.trim(),
        email: empEmail.trim(),
        phone: empPhone.trim(),
        department: empDept,
        role_title: empRoleTitle.trim()
      } : emp);
      saveEmployeesState(updated);
      showToast('แก้ไขข้อมูลพนักงานเรียบร้อย');
    } else {
      const newEmpCode = `EMP-2026-00${employees.length + 1}`;
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        code: newEmpCode,
        name: empName.trim(),
        email: empEmail.trim(),
        phone: empPhone.trim(),
        department: empDept,
        role_title: empRoleTitle.trim() || 'เจ้าหน้าที่ประจำแผนก',
        status: 'active',
        joined_date: new Date().toISOString().slice(0, 10),
        permissions: ['Department Operations', 'System Dashboard']
      };
      saveEmployeesState([...employees, newEmp]);
      showToast(`เพิ่มพนักงานใหม่สำเร็จ (${newEmpCode})`);
    }
    setIsEmployeeModalOpen(false);
  };

  const toggleEmployeeStatus = (empId: string) => {
    const updated = employees.map(emp => emp.id === empId ? {
      ...emp,
      status: (emp.status === 'active' ? 'inactive' : 'active') as any
    } : emp);
    saveEmployeesState(updated);
    showToast('อัปเดตสถานะพนักงานเรียบร้อย');
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
      setAdmin(updatedUser);
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
        setAdmin(updatedUser);
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

  const syncAdminData = async () => {
    if (!isAuthorized || !admin) return;
    try {
      await Promise.allSettled([
        loadMetrics(),
        loadOrders(),
        loadCustomers(),
        loadProducts(),
        loadBanners()
      ]);
    } catch (err) {
      console.warn('Sync admin error:', err);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  useEffect(() => {
    if (!isAuthorized || !admin) return;

    syncAdminData();

    // 1. Storage listener across browser tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.key.includes('tera_') || e.key.includes('admin')) {
        syncAdminData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tera_admin_updated', syncAdminData);
    window.addEventListener('tera_products_updated', syncAdminData);
    window.addEventListener('tera_banners_updated', syncAdminData);
    window.addEventListener('tera_orders_updated', syncAdminData);

    // 2. Tab Focus & Visibility Change
    window.addEventListener('focus', syncAdminData);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAdminData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Periodic Background Sync (6-second heartbeat for multi-staff live updates)
    const autoSyncInterval = setInterval(syncAdminData, 6000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tera_admin_updated', syncAdminData);
      window.removeEventListener('tera_products_updated', syncAdminData);
      window.removeEventListener('tera_banners_updated', syncAdminData);
      window.removeEventListener('tera_orders_updated', syncAdminData);
      window.removeEventListener('focus', syncAdminData);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(autoSyncInterval);
    };
  }, [isAuthorized, admin]);

  const showToast = (msg: string) => {
    setToasts((prev) => [...prev, msg]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
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
    try {
      response = await fetch(url, options);
    } catch (err: any) {
      throw new Error('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ');
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || `เกิดข้อผิดพลาดในการประมวลผล (HTTP ${response.status})`);
      }
      // Broadcast mutation sync event if method is POST, PUT, DELETE, PATCH
      if (method !== 'GET') {
        localStorage.setItem('tera_sync_timestamp', Date.now().toString());
        window.dispatchEvent(new Event('tera_admin_updated'));
        window.dispatchEvent(new Event('tera_products_updated'));
        window.dispatchEvent(new Event('tera_banners_updated'));
        window.dispatchEvent(new Event('tera_orders_updated'));
      }
      return data;
    } else {
      if (response.status === 401) {
        localStorage.removeItem('tera_token');
        localStorage.removeItem('tera_user');
        setAdmin(null);
        setIsAuthorized(false);
        throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง');
      }
      if (response.status === 413) {
        throw new Error('ขนาดรูปภาพหรือข้อมูลส่งออกใหญ่เกินไป กรุณาใช้ไฟล์ขนาดไม่เกิน 50MB');
      }
      if (response.status === 404) {
        throw new Error('ไม่พบ API Endpoint หรือข้อมูลในระบบ');
      }
      throw new Error(`ระบบขัดข้องชั่วคราว หรือกำลังอัปเดตเซิร์ฟเวอร์ (HTTP ${response.status})`);
    }
  };

  const checkAdminAuth = () => {
    try {
      const token = localStorage.getItem('tera_token');
      const userStr = localStorage.getItem('tera_user');
      if (!token || !userStr) {
        showToast('กรุณาเข้าสู่ระบบก่อนเข้าหน้าแผงควบคุม');
        navigate('/');
        return;
      }
      const localUser = JSON.parse(userStr);
      if (!['admin', 'stock', 'accounting', 'shipping', 'sales', 'marketing'].includes(localUser.role)) {
        showToast('สิทธิ์ไม่ถูกต้องสำหรับการเข้าถึงระบบการจัดการ');
        navigate('/');
        return;
      }
      setAdmin(localUser);
      setIsAuthorized(true);
      if (localUser.role === 'stock') {
        setActiveTab('products');
      } else if (localUser.role === 'accounting') {
        setActiveTab('orders');
      } else {
        setActiveTab('dashboard');
      }
    } catch {
      showToast('เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์');
      navigate('/');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tera_token');
    localStorage.removeItem('tera_user');
    showToast('ออกจากระบบจัดการแล้ว');
    navigate('/');
  };

  const loadMetrics = async () => {
    try {
      const res = await apiRequest('/api/v1/admin/dashboard');
      const data = res.data;
      setMetrics({
        totalSales: parseFloat(data.total_sales || 0),
        totalOrders: parseInt(data.total_orders || 0),
        activeCustomers: parseInt(data.active_customers || 0),
        pendingPayments: parseInt(data.pending_payments || 0),
        teamKpis: data.team_kpis || [],
        recentAuditLogs: data.recent_audit_logs || []
      });
      setLastUpdated(new Date().toLocaleString('th-TH'));
    } catch {
      setMetrics({
        totalSales: 184500.00,
        totalOrders: 14,
        activeCustomers: 8,
        pendingPayments: 2,
        teamKpis: [
          { team_id: 1, team_name: 'ทีม 1 - ฝ่ายขาย (Sales Team)', leader: 'พี่โอ๊ต', position: 'SALE DIRECTOR', target_amount: 500000, actual_sales: 320000, kpi_percentage: 64.0 },
          { team_id: 2, team_name: 'ทีม 2 - ฝ่ายการตลาด (Marketing Team)', leader: 'พี่กิ๊ฟ', position: 'ACT. MARKETING MANAGER', target_amount: 300000, actual_sales: 210000, kpi_percentage: 70.0 },
          { team_id: 3, team_name: 'ทีม 3 - ฝ่ายจัดซื้อและคลังสินค้า (Warehouse & Purchase Team)', leader: 'พี่ฝน', position: 'ACT.PURCHASE&WAREHOUSE MGR.', target_amount: 200000, actual_sales: 165000, kpi_percentage: 82.5 }
        ],
        recentAuditLogs: []
      });
      setLastUpdated(new Date().toLocaleString('th-TH'));
    }
  };

  const loadOrders = async () => {
    try {
      const res = await apiRequest('/api/v1/admin/orders');
      setOrders(res.data);
    } catch {
      setOrders([
        {
          id: 'ORD-2026-9812',
          username: 'somchai_user',
          email: 'somchai@gmail.com',
          total_price: '18500.00',
          status: 'paid',
          created_at: new Date().toISOString(),
          payment_status: 'completed',
          slip_url: '/dummy_slip.jpg',
          transaction_ref: 'KBANK-9823412',
          courier_name: 'Flash Express',
          tracking_number: 'TH0148291823'
        },
        {
          id: 'ORD-2026-9813',
          username: 'wichai_buyer',
          email: 'wichai@yahoo.com',
          total_price: '25900.00',
          status: 'shipping',
          created_at: new Date().toISOString(),
          payment_status: 'completed',
          slip_url: '/dummy_slip.jpg',
          transaction_ref: 'SCB-881923',
          courier_name: 'Kerry Express',
          tracking_number: 'KER-9982341'
        }
      ]);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await apiRequest('/api/v1/admin/customers');
      setCustomers(res.data);
    } catch {
      setCustomers([
        { id: 'c1', username: 'somchai_user', email: 'somchai@gmail.com', phone: '081-234-5678', role: 'customer', account_status: 'active', created_at: new Date().toISOString() },
        { id: 'c2', username: 'wichai_buyer', email: 'wichai@yahoo.com', phone: '089-876-5432', role: 'customer', account_status: 'active', created_at: new Date().toISOString() }
      ]);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await apiRequest('/api/v1/admin/products');
      if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
        setProducts(res.data);
        localStorage.setItem('tera_storefront_products', JSON.stringify(res.data));
        localStorage.setItem('tera_sync_timestamp', Date.now().toString());
        window.dispatchEvent(new Event('tera_products_updated'));
        return;
      }
    } catch (err) {
      console.warn('Admin load products API notice:', err);
    }

    const cached = localStorage.getItem('tera_storefront_products');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          return;
        }
      } catch (e) {}
    }
  };

  const loadBanners = async () => {
    try {
      const res = await apiRequest('/api/v1/banners');
      if (res && res.data && Array.isArray(res.data)) {
        setBanners(res.data);
        localStorage.setItem('tera_storefront_banners', JSON.stringify(res.data));
        localStorage.setItem('tera_sync_timestamp', Date.now().toString());
        window.dispatchEvent(new Event('tera_banners_updated'));
      }
    } catch (err) {
      console.warn('Admin load banners API notice:', err);
    }
  };

  /* ─── CSV EXPORT FUNCTIONS ─── */
  const downloadCSV = (filename: string, csvContent: string) => {
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`ส่งออกไฟล์ ${filename} สำเร็จ!`);
  };

  const exportOrdersCSV = () => {
    const headers = ['รหัสสั่งซื้อ', 'ชื่อลูกค้า', 'อีเมล', 'ยอดรวม (฿)', 'สถานะออเดอร์', 'สถานะการชำระ', 'ผู้ขนส่ง', 'เลขพัสดุ', 'วันที่สั่ง'];
    const rows = orders.map(o => [
      o.id,
      o.username,
      o.email,
      parseFloat(o.total_price).toFixed(2),
      o.status,
      o.payment_status || '-',
      o.courier_name || '-',
      o.tracking_number || '-',
      new Date(o.created_at).toLocaleString('th-TH')
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadCSV(`orders_export_${new Date().toISOString().slice(0,10)}.csv`, csv);
  };

  const exportCustomersCSV = () => {
    const headers = ['ชื่อผู้ใช้', 'อีเมล', 'เบอร์โทรศัพท์', 'บทบาท', 'สถานะบัญชี', 'วันที่สมัคร'];
    const rows = customers.map(c => [
      c.username,
      c.email,
      c.phone || '-',
      c.role,
      c.account_status,
      new Date(c.created_at).toLocaleString('th-TH')
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadCSV(`customers_export_${new Date().toISOString().slice(0,10)}.csv`, csv);
  };

  const exportProductsCSV = () => {
    const headers = ['รหัสสินค้า', 'ชื่อสินค้า', 'หมวดหมู่', 'ราคาหลัก (฿)', 'คำอธิบาย', 'ตัวเลือกย่อย', 'สต็อกรวม'];
    const rows = products.map(p => {
      const variantInfo = p.variants ? p.variants.map(v => `${v.variant_name}(${v.stock_quantity})`).join(', ') : '-';
      const totalStock = p.variants ? p.variants.reduce((sum, v) => sum + v.stock_quantity, 0) : 0;
      return [
        p.id,
        p.name,
        p.category_name,
        parseFloat(p.price).toFixed(2),
        p.description,
        variantInfo,
        totalStock
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    downloadCSV(`products_export_${new Date().toISOString().slice(0,10)}.csv`, csv);
  };

  const handleRefreshAll = () => {
    loadMetrics();
    loadOrders();
    loadCustomers();
    loadProducts();
    showToast('รีเฟรชข้อมูลทุกแผนกสำเร็จ');
  };

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      await apiRequest(`/api/v1/admin/orders/${editingOrder.id}/status`, 'PUT', {
        status: editOrderStatus,
        courier_name: editOrderStatus === 'shipping' ? editCourierName : undefined,
        tracking_number: editOrderStatus === 'shipping' ? editTrackingNumber : undefined
      });
      showToast('อัปเดตสถานะออเดอร์สำเร็จ!');
      setEditingOrder(null);
      loadOrders();
      loadMetrics();
    } catch {
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? {
        ...o,
        status: editOrderStatus,
        courier_name: editCourierName,
        tracking_number: editTrackingNumber
      } : o));
      showToast('อัปเดตสถานะออเดอร์สำเร็จ (Local)');
      setEditingOrder(null);
    }
  };

  const toggleCustomerStatus = async (customerId: string, currentStatus: string) => {
    const targetStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await apiRequest(`/api/v1/admin/customers/${customerId}/status`, 'PUT', { status: targetStatus });
      showToast(`เปลี่ยนสถานะบัญชีสมาชิกสำเร็จ! (${targetStatus})`);
      loadCustomers();
      loadMetrics();
    } catch {
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, account_status: targetStatus } : c));
      showToast(`เปลี่ยนสถานะบัญชีสมาชิกสำเร็จ! (${targetStatus})`);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const imageUrlList = productImagesText.split('\n').map(s => s.trim()).filter(Boolean);
    const mainUrl = imageUrlList.length > 0 ? imageUrlList[0] : (productImageUrl || 'https://picsum.photos/400/300');

    let updatedList: Product[] = [];
    if (editingProduct) {
      updatedList = products.map(p => p.id === editingProduct.id ? {
        ...p,
        name: productName,
        description: productDesc,
        price: productPrice,
        category_name: productCategory,
        image_url: mainUrl,
        images: imageUrlList.length > 0 ? imageUrlList : [mainUrl],
        detail_image_1: productDetailImg1 || p.detail_image_1 || '/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_32 PM 1.svg',
        detail_image_2: productDetailImg2 || p.detail_image_2 || '/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_35 PM 1.svg',
        spec_headers: specTableHeaders,
        spec_table: productSpecRows,
        advice_list: productAdviceList,
        accessories_list: productAccessoriesList,
        variants: productVariants as any
      } : p);
    } else {
      const newP: Product = {
        id: Date.now(),
        name: productName,
        description: productDesc,
        slug: productName.toLowerCase().replace(/\s+/g, '-'),
        image_url: mainUrl,
        images: imageUrlList.length > 0 ? imageUrlList : [mainUrl],
        detail_image_1: productDetailImg1 || '/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_32 PM 1.svg',
        detail_image_2: productDetailImg2 || '/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_35 PM 1.svg',
        category_name: productCategory,
        price: productPrice,
        spec_headers: specTableHeaders,
        spec_table: productSpecRows,
        advice_list: productAdviceList,
        accessories_list: productAccessoriesList,
        variants: productVariants as any
      };
      updatedList = [...products, newP];
    }

    saveProductsState(updatedList);
    showToast('บันทึกข้อมูลสินค้า รูปรายละเอียด และสเปกเรียบร้อย!');

    try {
      const payload = {
        name: productName,
        description: productDesc,
        price: parseFloat(productPrice),
        category_name: productCategory,
        image_url: mainUrl,
        images: imageUrlList.length > 0 ? imageUrlList : [mainUrl],
        detail_image_1: productDetailImg1,
        detail_image_2: productDetailImg2,
        variants: productVariants,
        spec_headers: specTableHeaders,
        spec_table: productSpecRows.filter(s => s.col1.trim() || s.col2.trim()),
        advice_list: productAdviceList,
        accessories_list: productAccessoriesList
      };

      if (editingProduct) {
        await apiRequest(`/api/v1/admin/products/${editingProduct.id}`, 'PUT', payload);
      } else {
        await apiRequest('/api/v1/admin/products', 'POST', payload);
      }
      showToast('บันทึกข้อมูลสินค้าสำเร็จ');
      await loadProducts();
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการบันทึก: ' + (err.message || ''));
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const deleteProduct = async (productId: number) => {
    if (!window.confirm('คุณแน่ใจว่าต้องการลบสินค้าชิ้นนี้ (Soft Delete)?')) return;

    try {
      await apiRequest(`/api/v1/admin/products/${productId}`, 'DELETE');
      showToast('ลบสินค้าชิ้นนี้สำเร็จ');
      await loadProducts();
    } catch (err: any) {
      showToast('ไม่สามารถลบสินค้าได้: ' + (err.message || ''));
    }
  };

  const triggerEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductName(prod.name);
    setProductDesc(prod.description);
    setProductPrice(prod.price);
    setProductCategory(prod.category_name);
    setProductImageUrl(prod.image_url);
    setProductImagesText(prod.images && prod.images.length > 0 ? prod.images.join('\n') : prod.image_url || '');
    
    setProductDetailImg1(prod.detail_image_1 || '/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_32 PM 1.svg');
    setProductDetailImg2(prod.detail_image_2 || '/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_35 PM 1.svg');

    if (prod.variants && prod.variants.length > 0) {
      setProductVariants(prod.variants.map(v => ({
        id: v.id,
        variant_name: v.variant_name,
        sku: v.sku,
        price: v.price,
        stock_quantity: v.stock_quantity
      })));
    } else {
      setProductVariants([{ variant_name: 'รุ่นมาตรฐาน (Standard)', price: prod.price || '0', stock_quantity: 10 }]);
    }

    if (prod.spec_headers && Array.isArray(prod.spec_headers) && prod.spec_headers.length > 0) {
      setSpecTableHeaders(prod.spec_headers);
    } else {
      setSpecTableHeaders(defaultPumpSpecHeaders);
    }

    if (prod.spec_table && Array.isArray(prod.spec_table) && prod.spec_table.length > 0) {
      setProductSpecRows(prod.spec_table);
    } else {
      setProductSpecRows(defaultPumpSpecRows);
    }

    if (prod.advice_list && Array.isArray(prod.advice_list) && prod.advice_list.length > 0) {
      setProductAdviceList(prod.advice_list);
    } else {
      setProductAdviceList(defaultAdvicePoints);
    }

    if (prod.accessories_list && Array.isArray(prod.accessories_list) && prod.accessories_list.length > 0) {
      setProductAccessoriesList(prod.accessories_list);
    } else {
      setProductAccessoriesList(defaultAccessoriesList);
    }

    setIsProductModalOpen(true);
  };

  const triggerAddProduct = () => {
    setEditingProduct(null);
    setProductName('');
    setProductDesc('');
    setProductPrice('18500');
    setProductCategory('ปั๊มน้ำบาดาลโซล่าเซลล์');
    setProductImageUrl('/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_32 PM 1.svg');
    setProductImagesText('/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_32 PM 1.svg\n/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_35 PM 1.svg');
    setProductDetailImg1('/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_32 PM 1.svg');
    setProductDetailImg2('/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_35 PM 1.svg');
    setProductVariants([
      { variant_name: 'รุ่น 1100W (1.5 HP) 80-210V', price: '18500', stock_quantity: 12 },
      { variant_name: 'รุ่น 1500W (2.0 HP) 110-250V', price: '24900', stock_quantity: 8 }
    ]);
    setSpecTableHeaders(defaultPumpSpecHeaders);
    setProductSpecRows(defaultPumpSpecRows);
    setProductAdviceList(defaultAdvicePoints);
    setProductAccessoriesList(defaultAccessoriesList);
    setIsProductModalOpen(true);
  };

  // Filter employees by department
  const filteredEmployees = selectedDeptFilter === 'all' 
    ? employees 
    : employees.filter(e => e.department === selectedDeptFilter);

  // Determine role label
  const getRoleLabel = () => {
    if (!admin) return '';
    if (admin.role === 'admin') return 'ผู้ดูแลระบบสูงสุด (Super Admin)';
    if (admin.role === 'stock') return 'ฝ่ายคลังสินค้า & สต็อก';
    if (admin.role === 'shipping') return 'ฝ่ายจัดส่ง & ขนส่ง';
    if (admin.role === 'accounting') return 'ฝ่ายบัญชี & การเงิน';
    if (admin.role === 'sales') return 'ฝ่ายบริการลูกค้า & ฝ่ายขาย';
    if (admin.role === 'marketing') return 'ฝ่ายการตลาด & คอนเทนต์';
    return admin.role;
  };

  if (!isAuthorized) {
    return <div style={{ color: '#fff', padding: '20px', textAlign: 'center' }}>กำลังตรวจสอบสิทธิ์ Admin...</div>;
  }

  return (
    <div className="admin-page">
      {/* Toast Alert Notifications */}
      <div id="toast-container" className="toast-container">
        {toasts.map((toast, index) => (
          <div key={index} className="toast show">{toast}</div>
        ))}
      </div>

      {/* Main Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Settings size={22} />
          <div>
            <div style={{ lineHeight: 1.1 }}>TeraAdmin</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 600, letterSpacing: '0.5px' }}>TERA GROUP BACK-OFFICE</div>
          </div>
        </div>

        <nav className="admin-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <BarChart2 size={16} /> สรุปภาพรวมแดชบอร์ด
          </button>
          
          <button className={activeTab === 'employees' ? 'active' : ''} onClick={() => setActiveTab('employees')}>
            <Briefcase size={16} /> พนักงาน & แผนกหลังบ้าน
          </button>

          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            <ShoppingBag size={16} /> การสั่งซื้อ & จัดส่งพัสดุ
          </button>

          <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
            <Package size={16} /> คลังสินค้า & สต็อก
          </button>

          <button className={activeTab === 'customers' ? 'active' : ''} onClick={() => setActiveTab('customers')}>
            <Users size={16} /> สมาชิก & บริการลูกค้า
          </button>

          <button className={activeTab === 'banners' ? 'active' : ''} onClick={() => setActiveTab('banners')}>
            <Sparkles size={16} /> สื่อแบรนเนอร์ & การตลาด
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout}>
            <LogOut size={16} /> ออกจากระบบหลังบ้าน
          </button>
        </div>
      </aside>

      {/* Admin Content Area */}
      <main className="admin-main">
        {/* Top Sticky Header */}
        <header className="admin-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span>ระบบหลังบ้าน</span>
              <span className={`dept-badge ${admin?.role || 'admin'}`}>{getRoleLabel()}</span>
            </h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Tera Ecommerce Multi-Department Back-Office Management Suite
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Department Role View Filter Swapper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F1F5F9', padding: '4px 10px', borderRadius: '100px', border: '1px solid #E2E8F0' }}>
              <Sliders size={14} style={{ color: '#64748B' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569' }}>กรองแผนก:</span>
              <select 
                value={selectedDeptFilter} 
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', cursor: 'pointer', outline: 'none' }}
              >
                <option value="all">🏢 ทุกแผนกหลังบ้าน (All)</option>
                <option value="admin">🛡️ ฝ่ายบริหาร & IT Admin</option>
                <option value="stock">📦 ฝ่ายคลังสินค้า & สต็อก</option>
                <option value="shipping">🚚 ฝ่ายจัดส่ง & ขนส่ง</option>
                <option value="accounting">💰 ฝ่ายบัญชี & การเงิน</option>
                <option value="sales">👥 ฝ่ายบริการลูกค้า & ฝ่ายขาย</option>
                <option value="marketing">🎨 ฝ่ายการตลาด & คอนเทนต์</option>
              </select>
            </div>

            {/* Admin User Profile Button */}
            <div 
              className="admin-user-badge" 
              style={{ cursor: 'pointer', gap: '8px' }} 
              onClick={() => { setEditUsername(admin?.username || ''); setEditPhone(admin?.phone || ''); setIsProfileModalOpen(true); }}
            >
              {admin?.profile_image ? (
                <img src={admin.profile_image} alt={admin.username} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <ShieldCheck size={16} style={{ color: 'var(--primary-color)' }} />
              )}
              <span>{admin?.username}</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {/* TAB 1: SUMMARY DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-view">
              <div className="section-header">
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>แดชบอร์ดภาพรวมการดำเนินงานทุกแผนก</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ระบบบริหารจัดการสำหรับเจ้าหน้าที่และผู้ดูแลระบบทุกฝ่าย</p>
                </div>
                <div className="section-actions">
                  <button className="btn-refresh" onClick={handleRefreshAll}>
                    <RefreshCw size={14} /> รีเฟรชข้อมูลทุกแผนก
                  </button>
                </div>
              </div>

              {lastUpdated && (
                <div className="dashboard-timestamp">
                  <Clock size={13} />
                  <span>อัปเดตข้อมูลล่าสุดเมื่อ {lastUpdated}</span>
                </div>
              )}

              {/* Top Department Overview Metrics */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <span>💰 ฝ่ายบัญชี - ยอดขายรวม</span>
                    <DollarSign size={20} style={{ color: '#059669' }} />
                  </div>
                  <strong>{parseFloat(metrics.totalSales.toString()).toFixed(2)} ฿</strong>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, display: 'block', marginTop: '6px' }}>+14.5% จากเดือนที่แล้ว</span>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span>🚚 ฝ่ายจัดส่ง - คำสั่งซื้อสะสม</span>
                    <ShoppingBag size={20} style={{ color: '#7C3AED' }} />
                  </div>
                  <strong>{metrics.totalOrders} รายการ</strong>
                  <span style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 600, display: 'block', marginTop: '6px' }}>จัดส่งสำเร็จแล้ว 92%</span>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span>👥 ฝ่ายขาย - สมาชิก Active</span>
                    <Users size={20} style={{ color: '#D97706' }} />
                  </div>
                  <strong>{metrics.activeCustomers} บัญชี</strong>
                  <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 600, display: 'block', marginTop: '6px' }}>ยืนยันตัวตนเรียบร้อย</span>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span>📦 ฝ่ายคลัง - รอดำเนินการชำระ</span>
                    <AlertCircle size={20} style={{ color: metrics.pendingPayments > 0 ? '#EF4444' : 'var(--text-muted)' }} />
                  </div>
                  <strong style={{ color: metrics.pendingPayments > 0 ? '#EF4444' : 'var(--text-main)' }}>{metrics.pendingPayments} บิล</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginTop: '6px' }}>รอฝ่ายบัญชีอนุมัติสลิป</span>
                </div>
              </div>

              {/* MONTHLY TEAM SALES TARGET & KPI BREAKDOWN */}
              <div className="admin-card" style={{ marginBottom: '32px' }}>
                <div className="section-header">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={20} style={{ color: '#FF3201' }} />
                      <span>สรุปยอดขายสะสมรายเดือนเทียบกับเป้าหมาย (Monthly Sales Target & KPI %)</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                      ติดตามผลงานยอดขายรวมแยกตามทีมและหัวหน้าทีม อัปเดตข้อมูลแบบเรียลไทม์
                    </p>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ทีม / แผนก</th>
                        <th>หัวหน้าทีม (Team Leader)</th>
                        <th>ตำแหน่ง (Position)</th>
                        <th>เป้าหมายประจำเดือน (Target)</th>
                        <th>ยอดขายสะสมจริง (Actual Sales)</th>
                        <th>ความคืบหน้า KPI %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(metrics.teamKpis && metrics.teamKpis.length > 0 ? metrics.teamKpis : [
                        { team_id: 1, team_name: 'ทีม 1 - ฝ่ายขาย (Sales Team)', leader: 'พี่โอ๊ต', position: 'SALE DIRECTOR', target_amount: 500000, actual_sales: 39241.58, kpi_percentage: 64.0 },
                        { team_id: 2, team_name: 'ทีม 2 - ฝ่ายการตลาด (Marketing Team)', leader: 'พี่กิ๊ฟ', position: 'ACT. MARKETING MANAGER', target_amount: 300000, actual_sales: 23544.95, kpi_percentage: 70.0 },
                        { team_id: 3, team_name: 'ทีม 3 - ฝ่ายจัดซื้อและคลังสินค้า (Warehouse & Purchase Team)', leader: 'พี่ฝน', position: 'ACT.PURCHASE&WAREHOUSE MGR.', target_amount: 200000, actual_sales: 15696.63, kpi_percentage: 82.5 }
                      ]).map((kpi: any) => (
                        <tr key={kpi.team_id}>
                          <td>
                            <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{kpi.team_name}</strong>
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: '#FF3201', fontSize: '0.95rem' }}>{kpi.leader || kpi.leader_name}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '6px', background: '#F1F5F9', color: '#475569', fontWeight: 700 }}>
                              {kpi.position || 'DEPARTMENT LEADER'}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 600 }}>
                            {parseFloat(kpi.target_amount || 0).toLocaleString('th-TH')} ฿
                          </td>
                          <td style={{ fontFamily: 'Rubik, sans-serif', fontWeight: 700, color: '#059669' }}>
                            {parseFloat(kpi.actual_sales || kpi.current_sales || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
                          </td>
                          <td style={{ minWidth: '180px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ flex: 1, height: '10px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                                <div 
                                  style={{ 
                                    width: `${Math.min(100, kpi.kpi_percentage || 0)}%`, 
                                    height: '100%', 
                                    background: (kpi.kpi_percentage || 0) >= 80 ? '#059669' : (kpi.kpi_percentage || 0) >= 50 ? '#D97706' : '#EF4444',
                                    borderRadius: '10px',
                                    transition: 'width 0.5s ease'
                                  }} 
                                />
                              </div>
                              <strong style={{ fontSize: '0.85rem', fontFamily: 'Rubik', color: (kpi.kpi_percentage || 0) >= 80 ? '#059669' : '#0F172A' }}>
                                {kpi.kpi_percentage || 0}%
                              </strong>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RECENT AUDIT LOGS TABLE */}
              <div className="admin-card" style={{ marginBottom: '32px' }}>
                <div className="section-header">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={20} style={{ color: '#0763B3' }} />
                      <span>ประวัติบันทึกการทำงานในระบบ (System Audit Logs)</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                      บันทึกกิจกรรมการปรับปรุงสินค้า อัปเดตสถานะคำสั่งซื้อ และจัดการสมาชิกของแอดมิน
                    </p>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>วันที่ / เวลา</th>
                        <th>ผู้ดำเนินการ (Admin)</th>
                        <th>กิจกรรม (Action)</th>
                        <th>ตารางที่กระทบ (Target)</th>
                        <th>ID อ้างอิง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(metrics.recentAuditLogs && metrics.recentAuditLogs.length > 0 ? metrics.recentAuditLogs : [
                        { id: 1, created_at: new Date().toISOString(), admin_name: 'AdminTera (พี่โอ๊ต)', admin_role: 'admin', action: 'อนุมัติการชำระเงินและเปลี่ยนสถานะจัดส่ง', target_table: 'orders', target_id: 'ORD-2026-9813' },
                        { id: 2, created_at: new Date(Date.now() - 3600000).toISOString(), admin_name: 'ประเสริฐ (พี่ฝน)', admin_role: 'stock', action: 'ปรับปรุงจำนวนสต็อกสินค้า TERA 1100W', target_table: 'product_variants', target_id: 'VAR-102' },
                        { id: 3, created_at: new Date(Date.now() - 7200000).toISOString(), admin_name: 'วิชัย (พี่กิ๊ฟ)', admin_role: 'marketing', action: 'เพิ่มแบรนเนอร์โปรโมชันประจำเดือน', target_table: 'banners', target_id: 'BAN-501' }
                      ]).map((log: any) => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '0.82rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                            {new Date(log.created_at).toLocaleString('th-TH')}
                          </td>
                          <td>
                            <span style={{ fontWeight: 700, color: '#0F172A' }}>{log.admin_name || 'Admin'}</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>({log.admin_role || 'admin'})</span>
                          </td>
                          <td style={{ fontWeight: 600, color: '#334155' }}>{log.action}</td>
                          <td>
                            <span style={{ fontSize: '0.78rem', background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              {log.target_table}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'Rubik, monospace', fontSize: '0.82rem', color: '#475569' }}>
                            {log.target_id}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Department Cards Quick Access */}
              <div className="admin-card" style={{ marginBottom: '32px' }}>
                <div className="section-header">
                  <h3>🏢 โครงสร้างแผนกพนักงานหลังบ้าน (Department Breakdown)</h3>
                  <button className="btn btn-secondary btn-small" onClick={() => setActiveTab('employees')}>
                    จัดการทีมพนักงานทั้งหมด ({employees.length} คน)
                  </button>
                </div>

                <div className="dept-cards-grid">
                  {departments.map((dept) => {
                    const DeptIcon = dept.icon;
                    const empCount = employees.filter(e => e.department === dept.id).length;
                    return (
                      <div key={dept.id} className="dept-card" style={{ borderLeft: `4px solid ${dept.color}` }}>
                        <div className="dept-card-header">
                          <div className="dept-icon-wrapper" style={{ backgroundColor: dept.bgColor, color: dept.color }}>
                            <DeptIcon size={22} />
                          </div>
                          <span className={`dept-badge ${dept.id}`}>{empCount} พนักงาน</span>
                        </div>
                        <div className="dept-card-title">{dept.title}</div>
                        <div style={{ fontSize: '0.75rem', color: dept.color, fontWeight: 700, marginBottom: '6px' }}>{dept.titleEn}</div>
                        <div className="dept-card-desc">{dept.description}</div>
                        <div className="dept-stats-row">
                          <div className="dept-stat-item">สิทธิ์ในระบบ: <strong>{dept.permissionsCount} รายการ</strong></div>
                          <div className="dept-stat-item">สถานะ: <strong style={{ color: '#059669' }}>เปิดใช้งาน</strong></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACK-OFFICE EMPLOYEES & DEPARTMENTS MANAGEMENT */}
          {activeTab === 'employees' && (
            <div className="employees-view">
              <div className="admin-card">
                <div className="section-header">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>รายชื่อพนักงานหลังบ้านและการกำหนดสิทธิ์แต่ละแผนก</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>จัดการข้อมูลเจ้าหน้าที่หลังบ้าน สิทธิ์การทำงาน และสถานะบัญชีรายแผนก</p>
                  </div>
                  <div className="section-actions">
                    <button className="btn btn-primary" onClick={openAddEmployeeModal}>
                      <UserPlus size={16} /> เพิ่มพนักงานใหม่
                    </button>
                  </div>
                </div>

                {/* Employees Data Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>รหัสพนักงาน</th>
                        <th>ชื่อ - นามสกุล</th>
                        <th>อีเมล / เบอร์โทร</th>
                        <th>สังกัดแผนก</th>
                        <th>ตำแหน่งงาน</th>
                        <th>สถานะ</th>
                        <th>วันที่เริ่มงาน</th>
                        <th>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>ไม่พบพนักงานในแผนกที่เลือก</td></tr>
                      )}
                      {filteredEmployees.map((emp) => (
                        <tr key={emp.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{emp.code}</td>
                          <td>
                            <strong style={{ color: '#0F172A' }}>{emp.name}</strong>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem', color: '#0F172A' }}>{emp.email}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{emp.phone}</div>
                          </td>
                          <td>
                            <span className={`dept-badge ${emp.department}`}>
                              {departments.find(d => d.id === emp.department)?.title.split(' (')[0] || emp.department}
                            </span>
                          </td>
                          <td><span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{emp.role_title}</span></td>
                          <td>
                            <span className={`status-badge ${emp.status === 'active' ? 'completed' : 'pending'}`}>
                              {emp.status === 'active' ? 'ปฏิบัติงานปกติ' : 'ลางาน/ระงับ'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{emp.joined_date}</td>
                          <td>
                            <div className="action-btn-cell">
                              <button className="btn btn-secondary btn-small" onClick={() => openEditEmployeeModal(emp)}>
                                <Edit3 size={13} /> แก้ไข
                              </button>
                              <button className="btn btn-secondary btn-small" onClick={() => toggleEmployeeStatus(emp.id)}>
                                {emp.status === 'active' ? 'ระงับ' : 'เปิดงาน'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS & SHIPPING MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="orders-view">
              <div className="admin-card">
                <div className="section-header">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>รายการสั่งซื้อและการจัดส่งพัสดุ (Orders & Shipping)</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ฝ่ายจัดส่ง และฝ่ายบัญชีสามารถอัปเดตสถานะ ออกใบแปะหน้าพัสดุ และตรวจสอบสลิป</p>
                  </div>
                  <div className="section-actions">
                    <button className="btn-export" onClick={exportOrdersCSV}>
                      <Download size={14} /> ส่งออก CSV
                    </button>
                    <button className="btn-refresh" onClick={loadOrders}>
                      <RefreshCw size={14} /> รีเฟรช
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>รหัสสั่งซื้อ</th>
                        <th>ลูกค้า / อีเมล</th>
                        <th>ยอดรวมบิล</th>
                        <th>สถานะหลัก</th>
                        <th>การจ่ายเงิน (ฝ่ายบัญชี)</th>
                        <th>สลิปโอน</th>
                        <th>ข้อมูลจัดส่ง (ฝ่ายขนส่ง)</th>
                        <th>เครื่องมือจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>ยังไม่มีรายการสั่งซื้อ</td></tr>
                      )}
                      {orders.map((ord) => (
                        <tr key={ord.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700 }}>#{ord.id.slice(0, 10)}</td>
                          <td>
                            <strong>{ord.username}</strong> <br />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ord.email}</span>
                          </td>
                          <td><strong style={{ color: '#059669', fontSize: '1rem' }}>{parseFloat(ord.total_price).toFixed(2)} ฿</strong></td>
                          <td>
                            <span className={`status-badge ${ord.status}`}>
                              {ord.status === 'pending' ? 'รอชำระเงิน' : ord.status === 'paid' ? 'จ่ายเงินแล้ว' : ord.status === 'shipping' ? 'กำลังจัดส่ง' : 'สำเร็จ'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${ord.payment_status === 'completed' ? 'completed' : 'pending'}`}>
                              {ord.payment_status === 'completed' ? 'ชำระแล้ว' : 'ค้างชำระ'}
                            </span>
                          </td>
                          <td>
                            {ord.slip_url ? (
                              <button className="btn btn-secondary btn-small" onClick={() => setVerifyingOrderSlip(ord)}>
                                <Eye size={12} /> ดู/ตรวจสลิป
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ไม่มีสลิป</span>
                            )}
                          </td>
                          <td>
                            {ord.tracking_number ? (
                              <span style={{ fontSize: '0.78rem' }}>
                                <span style={{ color: '#7C3AED', fontWeight: 700 }}>{ord.courier_name}</span><br/>
                                <strong style={{ color: '#2563EB', fontFamily: 'monospace' }}>{ord.tracking_number}</strong>
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ยังไม่ระบุเลข</span>
                            )}
                          </td>
                          <td>
                            <div className="action-btn-cell">
                              <button className="btn btn-primary btn-small" onClick={() => {
                                setEditingOrder(ord);
                                setEditOrderStatus(ord.status);
                                setEditCourierName(ord.courier_name || 'Flash Express');
                                setEditTrackingNumber(ord.tracking_number || '');
                              }}>
                                อัปเดตสถานะ
                              </button>

                              <button className="btn btn-secondary btn-small" onClick={() => setPrintingOrderLabel(ord)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Printer size={12} /> ใบแปะพัสดุ
                              </button>

                              {ord.status !== 'cancelled' && ord.status !== 'delivered' && (
                                <button 
                                  className="btn btn-danger btn-small" 
                                  style={{ background: '#DC2626', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  onClick={async () => {
                                    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธสลิป / ยกเลิกคำสั่งซื้อ #${ord.id.slice(0, 8)}? ระบบจะทำการคืนสต็อกสินค้าให้อัตโนมัติ`)) {
                                      try {
                                        await apiRequest(`/api/v1/admin/orders/${ord.id}/status`, 'PUT', { status: 'cancelled' });
                                        showToast('ปฏิเสธสลิปและยกเลิกคำสั่งซื้อเรียบร้อยแล้ว (คืนสต็อกสินค้าเรียบร้อย)');
                                        loadOrders();
                                      } catch (err: any) {
                                        showToast(err.message);
                                      }
                                    }
                                  }}
                                >
                                  <XCircle size={12} /> ปฏิเสธสลิป
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTS & INVENTORY MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="products-view">
              <div className="admin-card">
                <div className="section-header">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>คลังสินค้า & สเปกข้อมูลสินค้า (Inventory & Dynamic Detail Images)</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ฝ่ายคลังสินค้าสามารถจัดการตารางสเปก อัปเดตรูปภาพประกอบรายละเอียด 1 & 2 และอุปกรณ์เสริม</p>
                  </div>
                  <div className="section-actions">
                    <button className="btn btn-primary" onClick={triggerAddProduct}>
                      <Plus size={16} /> เพิ่มสินค้าใหม่
                    </button>
                    <button className="btn-export" onClick={exportProductsCSV}>
                      <Download size={14} /> ส่งออก CSV
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>สินค้า</th>
                        <th>ชื่อรายการสินค้า</th>
                        <th>หมวดหมู่</th>
                        <th>ราคาหลัก</th>
                        <th>ตัวเลือกรุ่นย่อย & สต็อก</th>
                        <th>รูปรายละเอียด & สเปก</th>
                        <th>เครื่องมือจัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>ยังไม่มีสินค้าในคลัง</td></tr>
                      )}
                      {products.map((prod) => {
                        const totalStock = prod.variants ? prod.variants.reduce((sum, v) => sum + v.stock_quantity, 0) : 0;
                        const specRowsCount = prod.spec_table ? prod.spec_table.length : 0;
                        const accessoriesCount = prod.accessories_list ? prod.accessories_list.length : 0;
                        return (
                          <tr key={prod.id}>
                            <td style={{ width: '56px', height: '56px' }}>
                              <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#F8FAFC' }}>
                                <ProductImage name={prod.name} imageUrl={prod.image_url} />
                              </div>
                            </td>
                            <td>
                              <strong style={{ color: '#0F172A', fontSize: '0.92rem' }}>{prod.name}</strong>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ID: #{prod.id}</div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px' }}>
                                {prod.category_name}
                              </span>
                            </td>
                            <td><strong style={{ color: '#059669' }}>{parseFloat(prod.price).toFixed(2)} ฿</strong></td>
                            <td>
                              {prod.variants && prod.variants.length > 0 ? (
                                prod.variants.map((v) => (
                                  <div key={v.id} className={`variant-stock-badge ${v.stock_quantity <= 3 ? 'low-stock' : ''}`}>
                                    <span>{v.variant_name}:</span> <strong>{v.stock_quantity} ชิ้น</strong>
                                  </div>
                                ))
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ไม่มีรุ่นย่อย</span>
                              )}
                            </td>
                            <td>
                              <button 
                                className="btn btn-secondary btn-small" 
                                onClick={() => setViewingProductDetail(prod)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', border: '1px solid #BFDBFE' }}
                              >
                                <Eye size={12} /> สเปก & รูปประกอบ ({specRowsCount} แถว | {accessoriesCount} อุปกรณ์)
                              </button>
                            </td>
                            <td>
                              <div className="action-btn-cell">
                                <button className="btn btn-secondary btn-small" onClick={() => triggerEditProduct(prod)}>
                                  <Edit3 size={13} /> แก้ไข
                                </button>
                                <button className="btn btn-danger btn-small" onClick={() => deleteProduct(prod.id)}>
                                  <Trash2 size={13} /> ลบ
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMERS MANAGEMENT */}
          {activeTab === 'customers' && (
            <div className="customers-view">
              <div className="admin-card">
                <div className="section-header">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>รายชื่อบัญชีสมาชิกทั้งหมดในระบบ (Customers)</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ฝ่ายขาย และฝ่ายบริการลูกค้าสามารถดูแลบัญชีสมาชิกและประวัติการสั่งซื้อ</p>
                  </div>
                  <div className="section-actions">
                    <button className="btn-export" onClick={exportCustomersCSV}>
                      <Download size={14} /> ส่งออก CSV
                    </button>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ชื่อผู้ใช้</th>
                        <th>อีเมล</th>
                        <th>เบอร์โทรศัพท์</th>
                        <th>บทบาทในระบบ</th>
                        <th>สถานะบัญชี</th>
                        <th>วันที่สมัครสมาชิก</th>
                        <th>เครื่องมือ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>ยังไม่มีข้อมูลสมาชิก</td></tr>
                      )}
                      {customers.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.username}</strong></td>
                          <td style={{ color: 'var(--text-muted)' }}>{c.email}</td>
                          <td>{c.phone || '—'}</td>
                          <td>
                            <span className={`dept-badge ${c.role === 'admin' ? 'admin' : 'sales'}`}>
                              {c.role === 'admin' ? 'Admin' : 'สมาชิกทั่วไป'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${c.account_status === 'active' ? 'completed' : 'pending'}`}>
                              {c.account_status === 'active' ? 'เปิดใช้งาน' : 'ระงับบัญชี'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {new Date(c.created_at).toLocaleDateString('th-TH')}
                          </td>
                          <td>
                            <button className="btn btn-secondary btn-small" onClick={() => toggleCustomerStatus(c.id, c.account_status)}>
                              {c.account_status === 'active' ? 'ระงับการใช้งาน' : 'ปลดบล็อก'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BANNERS & MARKETING */}
          {activeTab === 'banners' && (
            <div className="banners-view">
              <div className="admin-card">
                <div className="section-header">
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>จัดการรูปภาพแบรนเนอร์สื่อหน้าร้าน (Banners & Marketing)</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ฝ่ายการตลาดสามารถเพิ่ม สลับสถานะ หรือเปลี่ยนรูปสไลเดอร์แบนเนอร์หน้าร้านได้ทันที</p>
                  </div>
                  <div className="section-actions">
                    <button className="btn btn-primary" onClick={openAddBannerModal}>
                      <Plus size={16} /> เพิ่มแบรนเนอร์ใหม่
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {banners.map((b) => (
                    <div key={b.id} style={{ border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', background: '#FFFFFF', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                      <div style={{ width: '100%', height: '160px', overflow: 'hidden', backgroundColor: '#F8FAFC', position: 'relative' }}>
                        <img src={b.src} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                          <span className={`status-badge ${b.active ? 'completed' : 'pending'}`}>
                            {b.active ? 'เปิดใช้งานอยู่' : 'ปิดการใช้งาน'}
                          </span>
                        </div>
                      </div>

                      <div style={{ padding: '16px' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{b.title}</h4>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '16px' }}>
                          Path: {b.src}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                          <button className="btn btn-secondary btn-small" onClick={() => toggleBannerActive(b.id)}>
                            {b.active ? 'ปิดการแสดงผล' : 'เปิดการแสดงผล'}
                          </button>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary btn-small" onClick={() => openEditBannerModal(b)}>
                              <Edit3 size={13} />
                            </button>
                            <button className="btn btn-danger btn-small" onClick={() => deleteBanner(b.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* PRODUCT DETAILS & SPEC TABLE INSPECTOR MODAL (BACK-OFFICE VIEW) */}
      {viewingProductDetail && (
        <div className="modal active" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '960px', padding: '32px', borderRadius: '24px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={20} style={{ color: '#2563EB' }} />
                <span>ตรวจสอบรายละเอียดสินค้าและรูปภาพประกอบ (Product Details Inspector)</span>
              </h3>
              <button className="close-btn" onClick={() => setViewingProductDetail(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.6rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ background: '#FFFFFF', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginTop: 0, marginBottom: '14px' }}>
                {viewingProductDetail.name}
              </h4>

              {/* SECTION 1: DYNAMIC MULTI-COLUMN SPEC TABLE (LEFT) & DETAIL IMAGE 1 (RIGHT) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '28px', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', border: '1px solid #555555' }}>
                    <thead>
                      <tr style={{ background: '#EAEAEA' }}>
                        {(viewingProductDetail.spec_headers || defaultPumpSpecHeaders).map((h, i) => (
                          <th key={i} style={{ padding: '10px 14px', textAlign: i === 0 ? 'center' : 'left', fontWeight: 700, color: '#0F172A', border: '1px solid #555555' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(viewingProductDetail.spec_table || defaultPumpSpecRows).map((row, idx) => (
                        <tr key={idx} style={{ backgroundColor: '#FFFFFF' }}>
                          <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 600, color: '#334155', border: '1px solid #555555', whiteSpace: 'nowrap' }}>{row.col1}</td>
                          <td style={{ padding: '8px 14px', textAlign: 'left', color: '#0F172A', border: '1px solid #555555', whiteSpace: 'pre-line', lineHeight: 1.4 }}>{row.col2}</td>
                          {row.col3 !== undefined && (
                            <td style={{ padding: '8px 14px', textAlign: 'left', color: '#475569', border: '1px solid #555555' }}>{row.col3}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>รูปประกอบ #1 (Row 1)</div>
                  <img 
                    src={viewingProductDetail.detail_image_1 || viewingProductDetail.image_url || '/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_32 PM 1.svg'} 
                    alt="Detail Image 1" 
                    onError={(e) => { (e.target as HTMLImageElement).src = '/checkout_images/image 205.svg'; }}
                    style={{ width: '100%', maxWidth: '240px', height: 'auto', objectFit: 'contain' }} 
                  />
                </div>
              </div>

              {/* SECTION 2: ADDITIONAL ADVICE (LEFT) & DETAIL IMAGE 2 (RIGHT) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '28px', alignItems: 'start', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem', textDecoration: 'underline', marginBottom: '12px' }}>
                    ข้อแนะนำเพิ่มเติม
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', fontSize: '0.86rem', color: '#334155', lineHeight: 1.85 }}>
                    {(viewingProductDetail.advice_list || defaultAdvicePoints).map((adv, idx) => (
                      <li key={idx}>• {adv}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>รูปประกอบ #2 (Row 2)</div>
                  <img 
                    src={viewingProductDetail.detail_image_2 || "/checkout_images/ChatGPT Image Jul 18, 2026, 02_48_35 PM 1.svg"} 
                    alt="Detail Image 2" 
                    onError={(e) => { (e.target as HTMLImageElement).src = '/checkout_images/image 186.svg'; }}
                    style={{ width: '100%', maxWidth: '240px', height: 'auto', objectFit: 'contain' }} 
                  />
                </div>
              </div>

              {/* SECTION 3: ACCESSORIES TABLE */}
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                  อุปกรณ์สินค้าที่ใช้ร่วมกับสินค้าตัวนี้ได้ :
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #000000' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F1F1', borderBottom: '1px solid #000000' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>ชื่อสินค้า</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>สเปกแนะนำ</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#0F172A' }}>ประเภท</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewingProductDetail.accessories_list || defaultAccessoriesList).map((acc, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                          <td style={{ padding: '8px 14px', fontWeight: 600, color: '#0F172A' }}>{acc.item}</td>
                          <td style={{ padding: '8px 14px', color: '#475569' }}>{acc.spec}</td>
                          <td style={{ padding: '8px 14px', fontWeight: 700, color: '#0763B3' }}>{acc.cat}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setViewingProductDetail(null)}>ปิดหน้าต่างตรวจสอบ</button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE SHIPPING LABEL MODAL (LOGISTICS DEPT) */}
      {printingOrderLabel && (
        <div className="modal active" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Printer size={18} style={{ color: '#7C3AED' }} />
                <span>พิมพ์ใบแปะหน้าพัสดุ (Shipping Label)</span>
              </h3>
              <button className="close-btn" onClick={() => setPrintingOrderLabel(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div className="shipping-label-container">
              <div className="shipping-label-header">
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#FF3201', letterSpacing: '0.5px' }}>TERA ECOMMERCE</div>
                  <div style={{ fontSize: '0.75rem', color: '#555' }}>บริษัท เทรากรุ๊ป จำกัด (สำนักงานใหญ่)</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>ผู้ขนส่ง: {printingOrderLabel.courier_name || 'Flash Express'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#555' }}>วันที่ออกใบ: {new Date().toLocaleDateString('th-TH')}</div>
                </div>
              </div>

              <div className="barcode-box">
                <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '2px', fontFamily: 'monospace' }}>
                  *{printingOrderLabel.tracking_number || printingOrderLabel.id}*
                </div>
                <div style={{ height: '36px', background: 'repeating-linear-gradient(90deg, #000 0, #000 2px, #fff 2px, #fff 4px)', margin: '6px 0' }}></div>
                <div style={{ fontSize: '0.75rem', color: '#333' }}>TRACKING: {printingOrderLabel.tracking_number || 'TH-PENDING-001'}</div>
              </div>

              <div className="shipping-label-addresses">
                <div className="address-box">
                  <div className="address-box-title">ผู้ส่ง (Sender):</div>
                  <strong style={{ fontSize: '0.88rem' }}>TERA ECOMMERCE CENTER</strong><br />
                  <span style={{ fontSize: '0.8rem', color: '#333', lineHeight: 1.4, display: 'block', marginTop: '4px' }}>
                    123/45 ถนนพหลโยธิน เขตจตุจักร กรุงเทพมหานคร 10900<br />
                    โทร: 02-123-4567
                  </span>
                </div>

                <div className="address-box">
                  <div className="address-box-title">ผู้รับ (Recipient):</div>
                  <strong style={{ fontSize: '0.88rem' }}>คุณ {printingOrderLabel.username}</strong><br />
                  <span style={{ fontSize: '0.8rem', color: '#333', lineHeight: 1.4, display: 'block', marginTop: '4px' }}>
                    อีเมล: {printingOrderLabel.email}<br />
                    ปทุมวัน / Pathum Wan, กรุงเทพมหานคร 10110<br />
                    โทร: 081-XXX-XXXX
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', marginBottom: '12px' }}>
                <strong>รายการสินค้าในพัสดุ (Order #{printingOrderLabel.id.slice(0, 10)}):</strong>
                <div style={{ padding: '8px', background: '#F5F5F5', borderRadius: '6px', marginTop: '4px' }}>
                  • ปั๊มน้ำบาดาลโซล่าเซลล์บัสเลส TERA 1100W x 1 ชิ้น<br />
                  ยอดเก็บเงินรวม: <strong>{parseFloat(printingOrderLabel.total_price).toFixed(2)} ฿</strong> ({printingOrderLabel.payment_status === 'completed' ? 'ชำระแล้ว' : 'เก็บเงินปลายทาง'})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setPrintingOrderLabel(null)}>ปิดหน้าต่าง</button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <Printer size={16} /> พิมพ์ใบสั่งงานจัดส่ง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY PAYMENT SLIP MODAL (ACCOUNTING DEPT) */}
      {verifyingOrderSlip && (
        <div className="modal active" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} style={{ color: '#059669' }} />
                <span>ฝ่ายบัญชี: ตรวจสอบสลิปการโอนเงิน</span>
              </h3>
              <button className="close-btn" onClick={() => setVerifyingOrderSlip(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.88rem', color: '#0F172A', marginBottom: '8px' }}>
                ออเดอร์: <strong>#{verifyingOrderSlip.id}</strong> | ยอดเงิน: <strong style={{ color: '#059669' }}>{parseFloat(verifyingOrderSlip.total_price).toFixed(2)} ฿</strong>
              </div>

              {verifyingOrderSlip.slip_url ? (
                <div style={{ width: '100%', maxHeight: '360px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: '#F8FAFC', textAlign: 'center' }}>
                  <img src={verifyingOrderSlip.slip_url} alt="Slip" style={{ maxWidth: '100%', maxHeight: '360px', objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', color: 'var(--text-muted)' }}>
                  ไม่มีรูปภาพสลิปที่แนบไว้
                </div>
              )}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>บันทึกเพิ่มเติมจากฝ่ายบัญชี:</label>
              <input 
                type="text" 
                value={slipNote} 
                onChange={(e) => setSlipNote(e.target.value)} 
                placeholder="เช่น ตรวจสอบยอดเข้าบัญชี KBANK เรียบร้อยแล้ว" 
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)' }} 
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  setOrders(prev => prev.map(o => o.id === verifyingOrderSlip.id ? { ...o, payment_status: 'rejected' } : o));
                  showToast('ปฏิเสธสลิปเรียบร้อย');
                  setVerifyingOrderSlip(null);
                }}
              >
                <XCircle size={16} /> สลิปไม่ถูกต้อง
              </button>

              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setOrders(prev => prev.map(o => o.id === verifyingOrderSlip.id ? { ...o, payment_status: 'completed', status: 'paid' } : o));
                  showToast('อนุมัติการชำระเงินเรียบร้อยแล้ว');
                  setVerifyingOrderSlip(null);
                }}
                style={{ background: '#059669' }}
              >
                <CheckCircle2 size={16} /> อนุมัติการชำระเงิน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT / ADD EMPLOYEE MODAL */}
      {isEmployeeModalOpen && (
        <div className="modal active" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '540px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{editingEmployee ? 'แก้ไขข้อมูลพนักงานหลังบ้าน' : 'เพิ่มพนักงานหลังบ้านใหม่'}</h3>
              <button className="close-btn" onClick={() => setIsEmployeeModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveEmployee}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>ชื่อ - นามสกุล พนักงาน</label>
                <input 
                  type="text" 
                  value={empName} 
                  onChange={(e) => setEmpName(e.target.value)} 
                  placeholder="เช่น สมชาย ใจดี" 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>อีเมลพนักงาน</label>
                <input 
                  type="email" 
                  value={empEmail} 
                  onChange={(e) => setEmpEmail(e.target.value)} 
                  placeholder="เช่น somchai@teragroup.com" 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>เบอร์โทรศัพท์ติดต่อ</label>
                <input 
                  type="text" 
                  value={empPhone} 
                  onChange={(e) => setEmpPhone(e.target.value)} 
                  placeholder="เช่น 081-234-5678" 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>สังกัดแผนกหลังบ้าน (Department)</label>
                <select 
                  value={empDept} 
                  onChange={(e) => setEmpDept(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }}
                >
                  <option value="admin">🛡️ ฝ่ายบริหาร & IT Admin</option>
                  <option value="stock">📦 ฝ่ายคลังสินค้า & สต็อก</option>
                  <option value="shipping">🚚 ฝ่ายจัดส่ง & ขนส่ง</option>
                  <option value="accounting">💰 ฝ่ายบัญชี & การเงิน</option>
                  <option value="sales">👥 ฝ่ายบริการลูกค้า & ฝ่ายขาย</option>
                  <option value="marketing">🎨 ฝ่ายการตลาด & คอนเทนต์</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>ชื่อตำแหน่งงาน (Role Title)</label>
                <input 
                  type="text" 
                  value={empRoleTitle} 
                  onChange={(e) => setEmpRoleTitle(e.target.value)} 
                  placeholder="เช่น เจ้าหน้าที่ประจำแผนก" 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEmployeeModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกข้อมูลพนักงาน</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / ADD PRODUCT MODAL (WITH MULTI-COLUMN SPEC TABLE, DETAIL IMAGES, & ACCESSORIES EDITOR) */}
      {isProductModalOpen && (
        <div className="modal active" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '920px', padding: '28px', borderRadius: '20px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {editingProduct ? 'แก้ไขข้อมูลสินค้า & รูปภาพประกอบรายละเอียด' : 'เพิ่มสินค้าใหม่ & จัดการรูปภาพสเปกสินค้า'}
              </h3>
              <button className="close-btn" onClick={() => setIsProductModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.6rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={saveProduct}>
              {/* CARD 1: GENERAL INFO */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 14px 0', color: '#FF3201', fontSize: '0.98rem', fontWeight: 700 }}>1. ข้อมูลหลักสินค้า (General Information)</h4>
                
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>ชื่อสินค้า</label>
                  <input 
                    type="text" 
                    value={productName} 
                    onChange={(e) => setProductName(e.target.value)} 
                    placeholder="เช่น ปั๊มน้ำบาดาลโซล่าเซลล์บัสเลส TERA 1100W" 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>ราคาหลัก (฿)</label>
                    <input 
                      type="number" 
                      value={productPrice} 
                      onChange={(e) => setProductPrice(e.target.value)} 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>หมวดหมู่สินค้า</label>
                    <input 
                      type="text" 
                      value={productCategory} 
                      onChange={(e) => setProductCategory(e.target.value)} 
                      placeholder="เช่น ปั๊มน้ำบาดาลโซล่าเซลล์" 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>คำอธิบายสรุปสินค้า</label>
                  <textarea 
                    value={productDesc} 
                    onChange={(e) => setProductDesc(e.target.value)} 
                    rows={2} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                  />
                </div>
              </div>

              {/* CARD 2: PRODUCT DETAIL IMAGES MANAGER (NEW!) */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 14px 0', color: '#EC4899', fontSize: '0.98rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} />
                  <span>2. จัดการรูปภาพประกอบในรายละเอียดสินค้า (Product Detail Images Editor)</span>
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* DETAIL IMAGE 1 (Row 1 Image - Beside Spec Table) */}
                  <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                      รูปประกอบ #1 (แสดงขนานกับตารางสเปก - Row 1):
                    </label>

                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.78rem', color: '#64748B' }}>อัปโหลดไฟล์รูปภาพใหม่จากเครื่อง:</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) setProductDetailImg1(evt.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ width: '100%', padding: '6px', fontSize: '0.8rem', marginTop: '4px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.78rem', color: '#64748B' }}>หรือระบุ URL รูปภาพ:</label>
                      <input 
                        type="text" 
                        value={productDetailImg1} 
                        onChange={(e) => setProductDetailImg1(e.target.value)} 
                        placeholder="/checkout_images/... หรือ https://..." 
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                      />
                    </div>

                    {productDetailImg1 && (
                      <div style={{ textAlign: 'center', background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                        <img 
                          src={productDetailImg1} 
                          alt="Detail 1 Preview" 
                          onError={(e) => { (e.target as HTMLImageElement).src = '/checkout_images/image 205.svg'; }}
                          style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} 
                        />
                      </div>
                    )}
                  </div>

                  {/* DETAIL IMAGE 2 (Row 2 Image - Beside Additional Advice) */}
                  <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '6px' }}>
                      รูปประกอบ #2 (แสดงขนานกับข้อแนะนำเพิ่มเติม - Row 2):
                    </label>

                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.78rem', color: '#64748B' }}>อัปโหลดไฟล์รูปภาพใหม่จากเครื่อง:</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) setProductDetailImg2(evt.target.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ width: '100%', padding: '6px', fontSize: '0.8rem', marginTop: '4px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '0.78rem', color: '#64748B' }}>หรือระบุ URL รูปภาพ:</label>
                      <input 
                        type="text" 
                        value={productDetailImg2} 
                        onChange={(e) => setProductDetailImg2(e.target.value)} 
                        placeholder="/checkout_images/... หรือ https://..." 
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}
                      />
                    </div>

                    {productDetailImg2 && (
                      <div style={{ textAlign: 'center', background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                        <img 
                          src={productDetailImg2} 
                          alt="Detail 2 Preview" 
                          onError={(e) => { (e.target as HTMLImageElement).src = '/checkout_images/image 186.svg'; }}
                          style={{ maxWidth: '100%', maxHeight: '120px', objectFit: 'contain' }} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 3: VARIANTS */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#2563EB', fontSize: '0.98rem', fontWeight: 700 }}>3. ตัวเลือกรุ่นย่อย (Variants) & จำนวนสต็อก</h4>
                  <button type="button" className="btn btn-secondary btn-small" onClick={addVariantRow}>
                    + เพิ่มรุ่นย่อย
                  </button>
                </div>

                <div className="variants-form-rows">
                  {productVariants.map((varItem, idx) => (
                    <div key={idx} className="variant-form-row">
                      <input 
                        type="text" 
                        value={varItem.variant_name} 
                        onChange={(e) => updateVariantRow(idx, 'variant_name', e.target.value)} 
                        placeholder="ชื่อรุ่นย่อย" 
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
                      />
                      <input 
                        type="number" 
                        value={varItem.price} 
                        onChange={(e) => updateVariantRow(idx, 'price', e.target.value)} 
                        placeholder="ราคา" 
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
                      />
                      <input 
                        type="number" 
                        value={varItem.stock_quantity} 
                        onChange={(e) => updateVariantRow(idx, 'stock_quantity', parseInt(e.target.value) || 0)} 
                        placeholder="สต็อก" 
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
                      />
                      <button type="button" className="remove-row-btn" onClick={() => removeVariantRow(idx)}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 4: MULTI-COLUMN SPEC TABLE EDITOR */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h4 style={{ margin: 0, color: '#7C3AED', fontSize: '0.98rem', fontWeight: 700 }}>
                    4. ตารางข้อมูลทางเทคนิคหลายคอลัมน์ (Multi-Column Specification Table)
                  </h4>
                  <button type="button" className="btn btn-secondary btn-small" onClick={addSpecRow}>
                    + เพิ่มแถวสเปก
                  </button>
                </div>

                {/* Column Headers Customizer */}
                <div style={{ marginBottom: '14px', background: '#FFFFFF', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    ปรับแต่งหัวข้อคอลัมน์ตาราง (Column Headers):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={specTableHeaders[0] || 'หัวข้อข้อมูล'} 
                      onChange={(e) => {
                        const newHeaders = [...specTableHeaders];
                        newHeaders[0] = e.target.value;
                        setSpecTableHeaders(newHeaders);
                      }} 
                      placeholder="ชื่อคอลัมน์ที่ 1" 
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700 }}
                    />
                    <input 
                      type="text" 
                      value={specTableHeaders[1] || 'รายละเอียดทางเทคนิค (Details)'} 
                      onChange={(e) => {
                        const newHeaders = [...specTableHeaders];
                        newHeaders[1] = e.target.value;
                        setSpecTableHeaders(newHeaders);
                      }} 
                      placeholder="ชื่อคอลัมน์ที่ 2" 
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700 }}
                    />
                    <input 
                      type="text" 
                      value={specTableHeaders[2] || 'หมายเหตุ / โมเดล'} 
                      onChange={(e) => {
                        const newHeaders = [...specTableHeaders];
                        newHeaders[2] = e.target.value;
                        setSpecTableHeaders(newHeaders);
                      }} 
                      placeholder="ชื่อคอลัมน์ที่ 3" 
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.82rem', fontWeight: 700 }}
                    />
                  </div>
                </div>

                {/* Rows Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {productSpecRows.map((specRow, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 36px', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={specRow.col1} 
                        onChange={(e) => updateSpecRow(idx, 'col1', e.target.value)} 
                        placeholder="คอลัมน์ 1 (เช่น แบรนด์)" 
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                      />
                      <textarea 
                        value={specRow.col2} 
                        onChange={(e) => updateSpecRow(idx, 'col2', e.target.value)} 
                        placeholder="คอลัมน์ 2 (รายละเอียดสเปก)" 
                        rows={1}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                      />
                      <input 
                        type="text" 
                        value={specRow.col3 || ''} 
                        onChange={(e) => updateSpecRow(idx, 'col3', e.target.value)} 
                        placeholder="คอลัมน์ 3 (โมเดล/โน้ต)" 
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                      />
                      <button type="button" className="remove-row-btn" onClick={() => removeSpecRow(idx)}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 5: ADDITIONAL ADVICE BULLET POINTS */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#D97706', fontSize: '0.98rem', fontWeight: 700 }}>5. ข้อแนะนำเพิ่มเติม (Additional Advice Bullets)</h4>
                  <button type="button" className="btn btn-secondary btn-small" onClick={addAdviceItem}>
                    + เพิ่มข้อแนะนำ
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {productAdviceList.map((advItem, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1rem', color: '#D97706' }}>•</span>
                      <input 
                        type="text" 
                        value={advItem} 
                        onChange={(e) => updateAdviceItem(idx, e.target.value)} 
                        placeholder="ข้อความคำแนะนำหรือข้อควรระวัง..." 
                        style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                      />
                      <button type="button" className="remove-row-btn" onClick={() => removeAdviceItem(idx)}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD 6: COMPATIBLE ACCESSORIES TABLE */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, color: '#059669', fontSize: '0.98rem', fontWeight: 700 }}>6. อุปกรณ์สินค้าที่ใช้ร่วมกับสินค้าตัวนี้ได้ (Accessories Table)</h4>
                  <button type="button" className="btn btn-secondary btn-small" onClick={addAccessoryItem}>
                    + เพิ่มอุปกรณ์เสริม
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {productAccessoriesList.map((acc, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 36px', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        value={acc.item} 
                        onChange={(e) => updateAccessoryItem(idx, 'item', e.target.value)} 
                        placeholder="ชื่อสินค้าอุปกรณ์" 
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                      />
                      <input 
                        type="text" 
                        value={acc.spec} 
                        onChange={(e) => updateAccessoryItem(idx, 'spec', e.target.value)} 
                        placeholder="สเปกแนะนำ" 
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                      />
                      <input 
                        type="text" 
                        value={acc.cat} 
                        onChange={(e) => updateAccessoryItem(idx, 'cat', e.target.value)} 
                        placeholder="ประเภท" 
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }} 
                      />
                      <button type="button" className="remove-row-btn" onClick={() => removeAccessoryItem(idx)}>&times;</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>บันทึกข้อมูลสินค้า รูปภาพรายละเอียด และสเปกทั้งหมด</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROFILE SETTINGS MODAL */}
      {isProfileModalOpen && (
        <div className="modal active" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>แก้ไขข้อมูลส่วนตัวเจ้าหน้าที่</h3>
              <button className="close-btn" onClick={() => setIsProfileModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <div>
              <form onSubmit={async (e) => { await updateProfile(e); setIsProfileModalOpen(false); }} style={{ marginBottom: '25px' }}>
                <h4 style={{ marginTop: 0, color: 'var(--primary-color)', fontSize: '0.92rem', fontWeight: 600 }}>ข้อมูลทั่วไป</h4>
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>ชื่อผู้ใช้งาน</label>
                  <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} required />
                </div>
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>เบอร์โทรศัพท์ (10 หลัก)</label>
                  <input type="text" value={editPhone} maxLength={10} onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} />
                </div>

                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>อัปโหลดรูปโปรไฟล์</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadAvatar(file);
                      }
                    }} 
                    style={{ width: '100%', padding: '8px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}
                  />
                </div>
                
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: 'auto' }}>บันทึกข้อมูลทั่วไป</button>
              </form>

              <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />

              <form onSubmit={async (e) => { await changePassword(e); setIsProfileModalOpen(false); }}>
                <h4 style={{ marginTop: 0, color: 'var(--primary-color)', fontSize: '0.92rem', fontWeight: 600 }}>เปลี่ยนรหัสผ่าน</h4>
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>รหัสผ่านปัจจุบัน</label>
                  <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} required />
                </div>
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)</label>
                  <input type="password" value={newPassword} minLength={6} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} required />
                </div>
                
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>ยืนยันรหัสผ่านใหม่</label>
                  <input type="password" value={confirmPassword} minLength={6} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} required />
                </div>
                
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: 'auto' }}>เปลี่ยนรหัสผ่าน</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BANNER CRUD MODAL */}
      {isBannerModalOpen && (
        <div className="modal active" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '560px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{editingBanner ? 'แก้ไขรูปภาพแบรนเนอร์' : 'เพิ่มรูปภาพแบรนเนอร์ใหม่'}</h3>
              <button className="close-btn" onClick={() => setIsBannerModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleSaveBanner}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>ชื่อ / หัวข้อภาพแบรนเนอร์</label>
                <input 
                  type="text" 
                  value={bannerTitle} 
                  onChange={(e) => setBannerTitle(e.target.value)} 
                  placeholder="เช่น Our Brand of product - Tera Group" 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>URL รูปภาพแบรนเนอร์</label>
                <input 
                  type="text" 
                  value={bannerSrc} 
                  onChange={(e) => setBannerSrc(e.target.value)} 
                  placeholder="/our_brands_all.png หรือ https://..." 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                  required 
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>อัปโหลดไฟล์รูปภาพใหม่ (ออปชันเสริม)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        if (evt.target?.result) setBannerSrc(evt.target.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                  style={{ width: '100%', padding: '8px', marginTop: '4px' }} 
                />
              </div>

              {bannerSrc && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>ตัวอย่างรูปภาพที่จะแสดง:</label>
                  <div style={{ width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)' }}>
                    <img src={bannerSrc} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="banner-active-check" 
                  checked={bannerActive} 
                  onChange={(e) => setBannerActive(e.target.checked)} 
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary-color)' }}
                />
                <label htmlFor="banner-active-check" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>เปิดใช้งานแบรนเนอร์นี้บนสไลเดอร์หน้าร้านทันที</label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsBannerModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกรูปภาพแบรนเนอร์</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE ORDER STATUS MODAL */}
      {editingOrder && (
        <div className="modal active" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>อัปเดตสถานะการสั่งซื้อ & การจัดส่ง</h3>
              <button className="close-btn" onClick={() => setEditingOrder(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleUpdateOrderStatus}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>สถานะหลักของออเดอร์</label>
                <select 
                  value={editOrderStatus} 
                  onChange={(e) => setEditOrderStatus(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }}
                >
                  <option value="pending">รอชำระเงิน (Pending)</option>
                  <option value="paid">รับชำระเงินแล้ว (Paid)</option>
                  <option value="shipping">กำลังจัดส่งพัสดุ (Shipping)</option>
                  <option value="completed">จัดส่งสำเร็จ (Completed)</option>
                  <option value="cancelled">ยกเลิกออเดอร์ (Cancelled)</option>
                </select>
              </div>

              {editOrderStatus === 'shipping' && (
                <>
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>บริษัทขนส่งเอกชน (Courier)</label>
                    <select 
                      value={editCourierName} 
                      onChange={(e) => setEditCourierName(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }}
                    >
                      <option value="Flash Express">Flash Express</option>
                      <option value="Kerry Express">Kerry Express</option>
                      <option value="J&T Express">J&T Express</option>
                      <option value="DHL Supply Chain">DHL Supply Chain</option>
                      <option value="TERA Logistics Fleet">TERA Logistics Fleet (รถขนส่งเทรา)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>หมายเลขพัสดุ (Tracking Number)</label>
                    <input 
                      type="text" 
                      value={editTrackingNumber} 
                      onChange={(e) => setEditTrackingNumber(e.target.value)} 
                      placeholder="เช่น TH0148291823" 
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }} 
                      required 
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingOrder(null)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกอัปเดตสถานะ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
