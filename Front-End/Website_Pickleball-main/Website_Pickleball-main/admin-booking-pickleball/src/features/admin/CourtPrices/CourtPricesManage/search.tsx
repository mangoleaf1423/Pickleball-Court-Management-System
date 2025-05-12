import { FilterItem } from '@/core/types';
import { COURT_STATUS } from '@/utils';

const textSearch: FilterItem = {
  name: 'search',
  placeholder: 'placeholder:search',
  type: 'input',
  allowClear: true
};

const statusSearch: FilterItem = {
  name: 'status',
  placeholder: 'placeholder:status',
  type: 'select',
  options: COURT_STATUS,
  allowClear: true
};

export { textSearch, statusSearch };
