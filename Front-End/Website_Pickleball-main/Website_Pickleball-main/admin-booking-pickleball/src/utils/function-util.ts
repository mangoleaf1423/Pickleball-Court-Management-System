import dayjs from 'dayjs';

import { DateFormat } from './enums';

const handleBeforeSearch = (params: any) => {
  if (params?.rangeDate?.length >= 2) {
    params.from_time = dayjs(params.rangeDate[0]).format(DateFormat.YYYYMMDDHHmm);
    params.to_time = dayjs(params.rangeDate[1]).format(DateFormat.YYYYMMDDHHmm);
  }
  delete params?.rangeDate;
};

export { handleBeforeSearch };
