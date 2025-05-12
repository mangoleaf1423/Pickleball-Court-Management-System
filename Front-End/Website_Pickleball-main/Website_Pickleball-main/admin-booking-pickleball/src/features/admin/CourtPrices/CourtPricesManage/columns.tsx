import { Button, Tooltip, Image } from 'antd';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { ColumnTableType } from '@/core/types';

const companyCol: ColumnTableType<any> = {
  title: t('court_prices:court_name'),
  key: 'name',
  dataIndex: 'name',
  render(name, record) {
    return (
      <Link to={`/court-prices/edit/${record.id}`} className="!text-sky-600">
        {name}
      </Link>
    );
  },
  ellipsis: true,
  width: 200
};

const logoCol: ColumnTableType<any> = {
  title: t('court_prices:logo'),
  key: 'logoUrl',
  dataIndex: 'logoUrl',
  render: (logoUrl: string) => (
    <Image 
      src={logoUrl || "https://mediatech.vn/assets/images/imgstd.jpg"} 
      alt="logo"
      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
      preview={{
        mask: <div className="flex items-center justify-center">Xem ảnh</div>
      }}
    />
  ),
  width: 200,
  align: 'center',
  ellipsis: true
};

const backgroundCol: ColumnTableType<any> = {
  title: t('court_prices:background'),
  key: 'backgroundUrl',
  dataIndex: 'backgroundUrl',
  render: (backgroundUrl: string) => (
    <Image 
      src={backgroundUrl || "https://mediatech.vn/assets/images/imgstd.jpg"} 
      alt="background" 
      style={{ width: '100px', height: '100px', objectFit: 'cover' }}
      preview={{
        mask: <div className="flex items-center justify-center">Xem ảnh</div>
      }}
    />
  ),
  width: 200,
  align: 'center',
  ellipsis: true
};

const partnerNameCol: ColumnTableType<any> = {
  title: t('court_prices:open_time'),
  key: 'openTime', 
  dataIndex: 'openTime',
  width: 200,
  ellipsis: true,
  render: (time: string) => time || '24/24 tất cả các ngày'
};

const phoneNumberCol: ColumnTableType<any> = {
  title: t('court_prices:phone_number'),
  key: 'phone',
  dataIndex: 'phone',
  render: (phone: string) => (
    <a href={`tel:${phone}`} className="text-blue-600 hover:underline">
      {phone}
    </a>
  ),
  width: 150,
  ellipsis: true
};

// const taxNumberCol: ColumnTableType<any> = {
//   title: 'court_prices:link_website',
//   key: 'link',
//   dataIndex: 'link',
//   render: (link: string) => (
//     <a 
//       href={link} 
//       target="_blank" 
//       rel="noopener noreferrer" 
//       className="text-blue-600 hover:underline"
//     >
//       {link}
//     </a>
//   ),
//   width: 200,
//   ellipsis: true
// };

const representativeCol: ColumnTableType<any> = {
  title: t('court_prices:address'),
  key: 'address',
  dataIndex: 'address',
  width: 200,
  ellipsis: true
};

const statusCol: ColumnTableType<any> = {
  title: t('court_prices:status'),
  key: 'active',
  dataIndex: 'active',
  render(active: boolean) {
    return active ? t('common:active') : t('common:inactive');
  },
  width: 200,
  align: 'center',
  ellipsis: true,
  fixed: 'right'
};

const operationCol: (onEdit: any, onDelete: any) => ColumnTableType<any> = (onEdit, onDelete) => ({
  title: '',
  key: 'action',
  render(_, record) {
    return (
      <>
        <Tooltip title={t(['button:edit'])}>
          <Button icon={<i className="fal fa-edit" />} onClick={() => onEdit(record)} type="text" shape="circle" />
        </Tooltip>
        <Tooltip title={t(['button:delete'])}>
          <Button 
            icon={<i className="fal fa-trash-alt" />} 
            onClick={() => onDelete(record)} 
            type="text" 
            shape="circle" 
            danger
          />
        </Tooltip>
      </>
    );
  },
  align: 'center',
  width: 100,
  fixed: 'right'
});

export {
  companyCol,
  logoCol,
  operationCol,
  phoneNumberCol,
  partnerNameCol,
  representativeCol,
  statusCol,
  backgroundCol
};
