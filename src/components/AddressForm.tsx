import React, { useState, useEffect } from 'react';

interface SubDistrict {
  name_th: string;
  zip_code: number;
}

interface District {
  name_th: string;
  sub_districts: SubDistrict[];
}

interface Province {
  name_th: string;
  districts: District[];
}

interface AddressFormProps {
  initialValues?: {
    province: string;
    district: string;
    subdistrict: string;
    postalCode: string;
    detail: string;
    phone?: string;
  };
  onChange: (values: {
    province: string;
    district: string;
    subdistrict: string;
    postalCode: string;
    detail: string;
    phone?: string;
  }) => void;
  showPhoneField?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  initialValues,
  onChange,
  showPhoneField = false,
}) => {
  const [addressDb, setAddressDb] = useState<Province[]>([]);
  const [province, setProvince] = useState(initialValues?.province || '');
  const [district, setDistrict] = useState(initialValues?.district || '');
  const [subdistrict, setSubdistrict] = useState(initialValues?.subdistrict || '');
  const [postalCode, setPostalCode] = useState(initialValues?.postalCode || '');
  const [detail, setDetail] = useState(initialValues?.detail || '');
  const [phone, setPhone] = useState(initialValues?.phone || '');

  const [lastProvince, setLastProvince] = useState(initialValues?.province || '');
  const [lastDistrict, setLastDistrict] = useState(initialValues?.district || '');

  useEffect(() => {
    fetch('/thailand_addresses.json')
      .then((res) => res.json())
      .then((data: Province[]) => {
        setAddressDb(data);
      })
      .catch((err) => console.error('Failed to load address DB:', err));
  }, []);

  useEffect(() => {
    onChange({ province, district, subdistrict, postalCode, detail, phone });
  }, [province, district, subdistrict, postalCode, detail, phone]);

  const activeProvinceObj = addressDb.find((p) => p.name_th === province);
  const activeDistrictObj = activeProvinceObj?.districts.find((d) => d.name_th === district);

  const districtsList = activeProvinceObj ? activeProvinceObj.districts : [];
  const subdistrictsList = activeDistrictObj ? activeDistrictObj.sub_districts : [];

  const handleProvinceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setProvince(val);

    if (val === '') {
      setDistrict('');
      setSubdistrict('');
      setPostalCode('');
      setLastProvince('');
      setLastDistrict('');
      return;
    }

    const matchedProv = addressDb.find((p) => p.name_th === val);
    if (matchedProv) {
      if (val !== lastProvince) {
        setDistrict('');
        setSubdistrict('');
        setPostalCode('');
        setLastProvince(val);
        setLastDistrict('');
      }
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setDistrict(val);

    if (val === '') {
      setSubdistrict('');
      setPostalCode('');
      setLastDistrict('');
      return;
    }

    if (!activeProvinceObj) return;

    const matchedDist = activeProvinceObj.districts.find((d) => d.name_th === val);
    if (matchedDist) {
      if (val !== lastDistrict) {
        setSubdistrict('');
        setPostalCode('');
        setLastDistrict(val);
      }
    }
  };

  const handleSubdistrictChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setSubdistrict(val);

    if (val === '') {
      setPostalCode('');
      return;
    }

    if (!activeDistrictObj) return;

    const matchedSub = activeDistrictObj.sub_districts.find((s) => s.name_th === val);
    if (matchedSub) {
      setPostalCode(matchedSub.zip_code.toString());
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {showPhoneField && (
        <div className="form-group" style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            เบอร์โทรศัพท์สำหรับที่อยู่นี้ <span style={{ color: '#EF4444' }}>*</span> (10 หลัก ขึ้นต้นด้วย 0)
          </label>
          <input
            type="text"
            className="form-control"
            value={phone}
            maxLength={10}
            placeholder="เช่น 0812345678"
            onChange={(e) => {
              let cleaned = e.target.value.replace(/\D/g, '');
              if (cleaned.length > 0 && !cleaned.startsWith('0')) {
                const zeroIdx = cleaned.indexOf('0');
                cleaned = zeroIdx !== -1 ? cleaned.substring(zeroIdx) : '';
              }
              setPhone(cleaned.slice(0, 10));
            }}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }}
            required
          />
        </div>
      )}

      <div className="form-group" style={{ marginBottom: '10px' }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>รายละเอียดที่อยู่ (บ้านเลขที่, ถนน, หมู่บ้าน)</label>
        <input
          type="text"
          className="form-control"
          value={detail}
          placeholder="เช่น 123/45 หมู่บ้านอุ่นใจ"
          onChange={(e) => setDetail(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }}
          required
        />
      </div>

      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>จังหวัด</label>
          <input
            type="text"
            className="form-control"
            value={province}
            list="react-provinces-list"
            placeholder="พิมพ์เลือกจังหวัด"
            onChange={handleProvinceChange}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }}
            required
          />
          <datalist id="react-provinces-list">
            {addressDb.map((p) => (
              <option key={p.name_th} value={p.name_th} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>อำเภอ / เขต</label>
          <input
            type="text"
            className="form-control"
            value={district}
            list="react-districts-list"
            placeholder="พิมพ์เลือกอำเภอ"
            onChange={handleDistrictChange}
            disabled={!province}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }}
            required
          />
          <datalist id="react-districts-list">
            {districtsList.map((d) => (
              <option key={d.name_th} value={d.name_th} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>ตำบล / แขวง</label>
          <input
            type="text"
            className="form-control"
            value={subdistrict}
            list="react-subdistricts-list"
            placeholder="พิมพ์เลือกตำบล"
            onChange={handleSubdistrictChange}
            disabled={!district}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px' }}
            required
          />
          <datalist id="react-subdistricts-list">
            {subdistrictsList.map((s) => (
              <option key={s.name_th} value={s.name_th} />
            ))}
          </datalist>
        </div>

        <div className="form-group">
          <label style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>รหัสไปรษณีย์</label>
          <input
            type="text"
            className="form-control"
            value={postalCode}
            placeholder="รหัสไปรษณีย์"
            disabled
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px', opacity: 0.7 }}
            required
          />
        </div>
      </div>
    </div>
  );
};
