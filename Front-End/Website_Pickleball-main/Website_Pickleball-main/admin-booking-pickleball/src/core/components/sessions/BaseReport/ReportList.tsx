import dayjs from 'dayjs';
import { useCallback } from 'react';

import SearchPageCore from '@/core/components/base/SearchPageCore';
import { ColumnsTableType, FilterItem, IResponseList, SearchParamsValue } from '@/core/types';

type ReportListProps<T> = {
  filterItems: FilterItem[];
  columns: ColumnsTableType<T>;
  loadData: (params: SearchParamsValue) => Promise<IResponseList<T[]>>;
  onBeforeSearch?: (params: any) => void;
};

export default function ReportList<T>({ columns, onBeforeSearch, ...props }: Readonly<ReportListProps<T>>) {
  const handleBeforeSearch = useCallback(
    (params: any) => {
      onBeforeSearch?.(params);
      const { day, month, year } = params;
      if (day) {
        params.day_number = dayjs(day).date();
        params.month_number = dayjs(day).month() + 1;
        params.year_number = dayjs(day).year();
      } else if (month) {
        params.day_number = 1;
        params.month_number = dayjs(month).month() + 1;
        params.year_number = dayjs(month).year();
      } else if (year) {
        params.day_number = 1;
        params.month_number = 1;
        params.year_number = dayjs(year).year();
      }
      delete params?.day;
      delete params?.month;
      delete params?.year;
    },
    [onBeforeSearch]
  );
  return <SearchPageCore {...props} columns={columns} onBeforeSearch={handleBeforeSearch} />;
}
