import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

import { AppButton } from '@/core/components';
import SearchPageCore from '@/core/components/base/SearchPageCore';
import { Partner, SearchPageCoreRef, UserKong } from '@/core/types';
import {
  operationCol,
  phoneNumberCol,
  fullNameCol,
  emailCol,
  dobCol,
  genderCol,
  rolesCol,
  studentCol
} from './columns';
import { statusSearch, textSearch , usernameSearch, phoneNumberSearch, emailSearch, roleNameSearch} from './search';
import { UserService } from '@/core/services';
import { useApp } from '@/store';

interface IResponseList<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    pageSize: number
  }
}

const PartnerManage = () => {
  const navigate = useNavigate();
  const { user } = useApp();

  const searchPageCoreRef = useRef<SearchPageCoreRef<UserKong>>(null);

  const onEdit = useCallback(
    (record: UserKong) => {
      navigate(`/staff/edit/${record.id}`);
    },
    [navigate]
  );

  const onToggleStatus = useCallback(async (record: UserKong, currentStatus: boolean) => {
    try {
      await axios.put('https://picklecourt.id.vn/api/identity/users/activate', null, {
        params: {
          userId: record.id,
          isActive: record.active === true ? false : true
        },
        headers: {
          Authorization: `Bearer ${user?.result.token}`
        }
      });
      toast.success('Cập nhật trạng thái thành công');
      searchPageCoreRef.current?.fetchData();
    } catch (error) {
      console.error('Cập nhật trạng thái thất bại:', error);
      toast.error('Cập nhật trạng thái thất bại. Vui lòng kiểm tra quyền của bạn');
    }
  }, [user]);

  const onAddPartner = useCallback(() => {
    navigate('/staff/add');
  }, [navigate]);

  return (
<SearchPageCore
  ref={searchPageCoreRef}
  filterItems={[usernameSearch, phoneNumberSearch, emailSearch]}
  columns={[
    fullNameCol,
    emailCol,
    phoneNumberCol,
    dobCol,
    genderCol,
    rolesCol,
    // studentCol,
    operationCol(onEdit, onToggleStatus)
  ]}
  loadData={UserService.getStaffList}
  extra={
    <AppButton type="primary" ghost onClick={onAddPartner} iconType="add">
      button:add_account
    </AppButton>
  }
/>
  );
};

export default PartnerManage;
