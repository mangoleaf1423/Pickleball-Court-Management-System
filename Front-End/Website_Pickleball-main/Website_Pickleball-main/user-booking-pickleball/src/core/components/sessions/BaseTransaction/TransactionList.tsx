import dayjs from 'dayjs';
import { useCallback } from 'react';

import SearchPageCore from '@/core/components/base/SearchPageCore';
import { ColumnsTableType, FilterItem, IResponseList, SearchParamsValue } from '@/core/types';
import { DateFormat } from '@/utils/enums';

type TransactionListProps<T> = {
  filterItems: FilterItem[];
  columns: ColumnsTableType<T>;
  loadData: (params: SearchParamsValue) => Promise<IResponseList<T[]>>;
  onBeforeSearch?: (params: any) => void;
};

export default function TransactionList<T>({ columns, onBeforeSearch, ...props }: Readonly<TransactionListProps<T>>) {
  const handleBeforeSearch = useCallback(
    (params: any) => {
      onBeforeSearch?.(params);
      if (params?.date?.length >= 2) {
        params.from_time = dayjs(params.date[0]).format(DateFormat.YYYYMMDDHHmm);
        params.to_time = dayjs(params.date[1]).format(DateFormat.YYYYMMDDHHmm);
      }
      delete params?.date;
    },
    [onBeforeSearch]
  );
  return <SearchPageCore {...props} columns={columns} onBeforeSearch={handleBeforeSearch} />;
}
