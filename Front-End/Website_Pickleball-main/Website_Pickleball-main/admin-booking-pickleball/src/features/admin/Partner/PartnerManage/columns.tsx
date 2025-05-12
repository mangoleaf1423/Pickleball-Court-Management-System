import { Button, Tooltip, Tag } from 'antd';
import { t } from 'i18next';

import { ColumnTableType } from '@/core/types';

const fullNameCol: ColumnTableType<any> = {
  title: 'partner:full_name',
  key: 'fullName',
  render(_, record) {
    return `${record.firstName} ${record.lastName}`;
  },
  ellipsis: true,
  width: 200
};

const userNameCol: ColumnTableType<any> = {
  title: 'partner:username',
  key: 'username',
  dataIndex: 'username',
  width: 200,
  ellipsis: true
};

const emailCol: ColumnTableType<any> = {
  title: 'partner:email',
  key: 'email',
  dataIndex: 'email',
  width: 250,
  ellipsis: true
};

const phoneNumberCol: ColumnTableType<any> = {
  title: 'partner:phone_number',
  key: 'phoneNumber',
  dataIndex: 'phoneNumber',
  width: 150,
  ellipsis: true
};

const dobCol: ColumnTableType<any> = {
  title: 'partner:dob',
  key: 'dob',
  dataIndex: 'dob',
  width: 150,
  ellipsis: true
};

const genderCol: ColumnTableType<any> = {
  title: 'partner:gender',
  key: 'gender',
  dataIndex: 'gender',
  render: (gender) => {
    let color = gender === 'MALE' ? 'blue' : gender === 'FEMALE' ? 'pink' : 'default';
    return <Tag color={color}>{gender === 'MALE' ? 'Nam' : gender === 'FEMALE' ? 'Nữ' : 'Khác'}</Tag>;
  },
  width: 120,
  align: 'center'
};

const rolesCol: ColumnTableType<any> = {
  title: 'partner:roles',
  key: 'roles',
  dataIndex: 'roles',
  render: (roles: Array<{ name: string }>) => (
    <>
      {roles.map(role => (
        <Tag 
          key={role.name} 
          color={role.name === 'Admin' ? 'red' : role.name === 'User' ? 'green' : 'geekblue'}
          style={{ margin: 2 }}
        >
          {role.name}
        </Tag>
      ))}
    </>
  ),
  width: 200
};

const studentCol: ColumnTableType<any> = {
  title: 'partner:student',
  key: 'student',
  dataIndex: 'student',
  render: (student: boolean) => (
    <Tag color={student ? 'success' : 'error'}>
      {student ? t('common:yes') : t('common:no')}
    </Tag>
  ),
  width: 100,
  align: 'center'
};

const operationCol: (onEdit: any, onToggleStatus: any) => ColumnTableType<any> = (onEdit, onToggleStatus) => ({
  title: '',
  key: 'action',
  render(_, record) {
    console.log('record: ', record);
    return (
      <>
        <Tooltip title={t(['common:button.edit'])}>
          <Button icon={<i className="fal fa-edit" />} onClick={() => onEdit(record)} type="text" shape="circle" />
        </Tooltip>
        <Tooltip title={t(['common:button.toggle_status'])}>
          <Button 
            icon={<i className={`fal ${record.active ? 'fa-toggle-on' : 'fa-toggle-off'}`} />} 
            onClick={() => onToggleStatus(record)} 
            type="text" 
            shape="circle" 
            style={{ color: record.active ? '#52c41a' : '#ff4d4f' }}
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
  dobCol,
  emailCol,
  fullNameCol,
   genderCol,
  operationCol,
  phoneNumberCol,
  rolesCol,
  studentCol,
  userNameCol
};
