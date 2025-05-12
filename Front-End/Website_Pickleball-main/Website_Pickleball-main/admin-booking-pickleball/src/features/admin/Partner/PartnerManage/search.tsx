import { FilterItem } from '@/core/types';
import { ACCOUNT_STATUS, ROLE_NAME } from '@/utils';

const textSearch: FilterItem = {
  name: 'q',
  placeholder: 'placeholder:search',
  type: 'input',
  allowClear: true
};

const statusSearch: FilterItem = {
  name: 'status',
  placeholder: 'placeholder:status',
  type: 'select',
  options: ACCOUNT_STATUS,
  allowClear: true
};

const usernameSearch: FilterItem = {
  name: 'username',
  placeholder: 'placeholder:username',
  type: 'input',
  allowClear: true
};

const phoneNumberSearch: FilterItem = {
  name: 'phoneNumber',
  placeholder: 'placeholder:phone_number',
  type: 'input',
  allowClear: true
};

const emailSearch: FilterItem = {
  name: 'email',
  placeholder: 'placeholder:email',
  type: 'input',
  allowClear: true
};

const roleNameSearch: FilterItem = {
  name: 'roleName',
  placeholder: 'placeholder:role_name',
  type: 'select',
  options: ROLE_NAME,
  allowClear: true
};

export { textSearch, statusSearch, usernameSearch, phoneNumberSearch, emailSearch, roleNameSearch };
