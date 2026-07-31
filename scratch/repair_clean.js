const fs = require('fs');
const path = require('path');

const tsxPath = path.join(__dirname, '../src/pages/Storefront.tsx');
let content = fs.readFileSync(tsxPath, 'utf8');

const heroStartIndex = content.indexOf('/* INDUSTRIAL HERO BANNER SECTION');
const catalogLayoutIndex = content.indexOf('<div className="catalog-layout">');

console.log('Hero start index:', heroStartIndex);
console.log('Catalog layout index:', catalogLayoutIndex);

if (heroStartIndex !== -1 && catalogLayoutIndex !== -1) {
  const beforeBlock = content.substring(0, heroStartIndex);
  const afterBlock = content.substring(catalogLayoutIndex);

  const cleanHeroAndBrandsBlock = `/* INDUSTRIAL HERO BANNER SECTION (Matched 100% with Figma Image) */
            <div className="industrial-hero-wrapper">
              <div className="industrial-hero-container">
                <div>
                  <div className="hero-subtitle">ผู้นำด้านเครื่องจักรอุตสาหกรรม และระบบอัตโนมัติครบวงจร</div>
                  <h1 className="hero-big-title">
                    <span className="title-dark">INDUSTRIAL</span><br />
                    <span className="title-orange">AUTOMATION</span><br />
                    <span className="title-dark">SOLUTIONS</span>
                  </h1>
                  <p className="hero-description">
                    เราคัดสรรสินค้าอุตสาหกรรมคุณภาพสูง พร้อมโซลูชันที่ตอบโจทย์ทุกความต้องการของโรงงานยุคใหม่
                  </p>
                  <div className="hero-cta-buttons">
                    <button className="btn-cta-primary" onClick={() => {
                      const el = document.getElementById('catalog-products-start');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}>
                      เลือกซื้อสินค้า &gt;
                    </button>
                    <button className="btn-cta-secondary" onClick={() => showToast('ดูโซลูชันและบริการของ Tera Group')}>
                      ดูโซลูชันของเรา &gt;
                    </button>
                  </div>
                </div>

                <div className="hero-machinery-graphic">
                  <img 
                    src="/hero_machinery_showcase.png" 
                    alt="Industrial Machinery Showcase" 
                    className="hero-machinery-img"
                  />
                </div>
              </div>

              {/* Trust Badges Row (Matched 100% with Figma Target Icons & Design) */}
              <div className="trust-badges-row">
                <div className="trust-badge-item">
                  <div className="trust-icon-box"><ShieldCheck size={22} strokeWidth={2} /></div>
                  <div>
                    <div className="trust-badge-title">สินค้าของแท้ 100%</div>
                    <div className="trust-badge-sub">รับประกันคุณภาพ</div>
                  </div>
                </div>
                <div className="trust-badge-item">
                  <div className="trust-icon-box"><Users size={22} strokeWidth={2} /></div>
                  <div>
                    <div className="trust-badge-title">ทีมวิศวกรพร้อมให้คำปรึกษา</div>
                    <div className="trust-badge-sub">ก่อนและหลังการขาย</div>
                  </div>
                </div>
                <div className="trust-badge-item">
                  <div className="trust-icon-box"><Truck size={22} strokeWidth={2} /></div>
                  <div>
                    <div className="trust-badge-title">จัดส่งรวดเร็ว</div>
                    <div className="trust-badge-sub">ทั่วประเทศไทย</div>
                  </div>
                </div>
                <div className="trust-badge-item">
                  <div className="trust-icon-box"><Headphones size={22} strokeWidth={2} /></div>
                  <div>
                    <div className="trust-badge-title">บริการหลังการขาย</div>
                    <div className="trust-badge-sub">มาตรฐานระดับสากล</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Catalog Page Main Container */}
            <div className="storefront-catalog-body" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 40px' }}>
              {/* Category Grid 8 Cards Bar (Matched 100% with Figma Target Screenshot 2) */}
              <div className="category-card-bar">
                <div className="category-grid-8">
                  <div className={\`category-card-item \${selectedCategory === 'ระบบอัตโนมัติและโรบอท' ? 'active' : ''}\`} onClick={() => handleCategorySelect('ระบบอัตโนมัติและโรบอท')}>
                    <div className="category-icon-wrapper"><img src="/cat_card_1.svg" alt="Robot" /></div>
                    <div className="category-card-title">ระบบอัตโนมัติและโรบอท</div>
                    <div className="category-card-sub">Automation &amp; Robot &gt;</div>
                  </div>

                  <div className={\`category-card-item \${selectedCategory === 'อินเวอร์เตอร์และเซอร์โว' ? 'active' : ''}\`} onClick={() => handleCategorySelect('อินเวอร์เตอร์และเซอร์โว')}>
                    <div className="category-icon-wrapper"><img src="/cat_card_2.svg" alt="Inverter" /></div>
                    <div className="category-card-title">อินเวอร์เตอร์และเซอร์โว</div>
                    <div className="category-card-sub">Inverter &amp; Servo &gt;</div>
                  </div>

                  <div className={\`category-card-item \${selectedCategory === 'PLC, HMI และคอนโทรล' ? 'active' : ''}\`} onClick={() => handleCategorySelect('PLC, HMI และคอนโทรล')}>
                    <div className="category-icon-wrapper"><img src="/cat_card_3.svg" alt="PLC" /></div>
                    <div className="category-card-title">PLC, HMI และคอนโทรล</div>
                    <div className="category-card-sub">PLC, HMI &amp; Control &gt;</div>
                  </div>

                  <div className={\`category-card-item \${selectedCategory === 'ระบบ IoT และเครื่องจักร' ? 'active' : ''}\`} onClick={() => handleCategorySelect('ระบบ IoT และเครื่องจักร')}>
                    <div className="category-icon-wrapper"><img src="/cat_card_4.svg" alt="IoT" /></div>
                    <div className="category-card-title">ระบบ IoT และเครื่องจักร</div>
                    <div className="category-card-sub">IoT &amp; Machines &gt;</div>
                  </div>

                  <div className={\`category-card-item \${selectedCategory === 'การเกษตรและเทคโนโลยี' ? 'active' : ''}\`} onClick={() => handleCategorySelect('การเกษตรและเทคโนโลยี')}>
                    <div className="category-icon-wrapper"><img src="/cat_card_5.svg" alt="Agri" /></div>
                    <div className="category-card-title">การเกษตรและเทคโนโลยี</div>
                    <div className="category-card-sub">Agriculture &gt;</div>
                  </div>

                  <div className={\`category-card-item \${selectedCategory === 'ตู้ควบคุม & ตู้ MDB' ? 'active' : ''}\`} onClick={() => handleCategorySelect('ตู้ควบคุม & ตู้ MDB')}>
                    <div className="category-icon-wrapper"><img src="/cat_card_6.svg" alt="Cabinet" /></div>
                    <div className="category-card-title">ตู้ควบคุม &amp; ตู้ MDB</div>
                    <div className="category-card-sub">Cabinet &gt;</div>
                  </div>

                  <div className={\`category-card-item \${selectedCategory === 'พลังงานแสงอาทิตย์' ? 'active' : ''}\`} onClick={() => handleCategorySelect('พลังงานแสงอาทิตย์')}>
                    <div className="category-icon-wrapper"><img src="/cat_card_7.svg" alt="Solar" /></div>
                    <div className="category-card-title">พลังงานแสงอาทิตย์</div>
                    <div className="category-card-sub">Solar &amp; Energy &gt;</div>
                  </div>

                  <div className={\`category-card-item \${selectedCategory === 'อะไหล่และอุปกรณ์เสริม' ? 'active' : ''}\`} onClick={() => handleCategorySelect('อะไหล่และอุปกรณ์เสริม')}>
                    <div className="category-icon-wrapper"><img src="/cat_card_8.svg" alt="Parts" /></div>
                    <div className="category-card-title">อะไหล่และอุปกรณ์เสริม</div>
                    <div className="category-card-sub">Parts &amp; Accessories &gt;</div>
                  </div>
                </div>
              </div>

              {/* Brands Section (Frameless Vector Logos with Balanced Spacing) */}
              <div className="brand-partners-section" id="catalog-products-start" style={{ margin: '36px 0 28px', padding: '24px 0', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div className="brand-section-title" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>แบรนด์ชั้นนำที่เราเป็นตัวแทนจำหน่าย</div>
                  <span className="brand-logo-text" style={{ fontSize: '0.88rem', color: '#FF3201', cursor: 'pointer', fontWeight: 700 }}>ดูทั้งหมด &gt;</span>
                </div>
                <div className="brand-logos-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '36px', flexWrap: 'nowrap', overflowX: 'auto', padding: '12px 0' }}>
                  <img src="/brand_huawei.svg" alt="HUAWEI" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                  <img src="/brand_veichi.svg" alt="VEICHI" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                  <img src="/brand_risen.svg" alt="risen" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                  <img src="/brand_powran.svg" alt="POWTRAN" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                  <img src="/brand_mitsubishi.svg" alt="MITSUBISHI" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                  <img src="/brand_hitachi.svg" alt="HITACHI" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                  <img src="/brand_fuji.svg" alt="Fuji Electric" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                  <img src="/brand_sunways.svg" alt="sunways" style={{ height: '36px', width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
                </div>
              </div>

              `;

  fs.writeFileSync(tsxPath, beforeBlock + cleanHeroAndBrandsBlock + afterBlock, 'utf8');
  console.log('Successfully repaired Storefront.tsx cleanly!');
}
