import dayjs from 'dayjs';

import { DateFormat } from '../enums';

class FormatHelper {
  static stringToDate(
    dateString?: string,
    dateFormatFrom: DateFormat = DateFormat['YYYYMMDD'],
    dateFormatTo: DateFormat = DateFormat['DD/MM/YYYY']
  ) {
    if (!dateString) return '';
    const date = dayjs(dateString, dateFormatFrom);
    if (!date.isValid()) return dateString;
    return date.format(dateFormatTo);
  }

  static tryParseJson(data: string) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return { message: data ?? '' };
    }
  }
}

export default FormatHelper;
