import axios from 'axios';
import { toast } from 'react-toastify';
import { isNumber } from 'lodash';

import i18n from '@/app/i18n';
import { ResponseCommon } from '@/core/types';

class CommonHelper {
  public static handleError(error: any): void {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const errData = error.response.data;
        if (typeof errData === 'string') {
          toast.error(errData);
        } else if ('error' in errData) {
          const err = errData as ResponseCommon<null>;
          if (!err.success) {
            toast.error(err.error.message ?? i18n.t(['common:fail']));
          }
        } else {
          const err = errData as Error;
          toast.error(err?.message || i18n.t(['common:fail']));
        }
      }
    } else if (error?.error) {
      toast.error(error.error?.message || i18n.t(['common:fail']));
    } else {
      toast.error(i18n.t(['common:fail']));
    }
  }

  static readonly formatNumber = (nb?: number | string) => {
    if (!nb || isNaN(Number(nb))) return 0;
    return new Intl.NumberFormat().format(Number(nb) || 0);
  };

  static readonly EnumToArrayObject = (enumConvert: { [key: number | string]: number | string }) => {
    return Object.keys(enumConvert).map((key) => {
      return {
        label: enumConvert[key as keyof typeof enumConvert],
        value: key
      };
    });
  };
  public static fieldArrayToString(arr: (string | number)[]): string {
    let fieldNameString = '';
    arr.forEach((item) => {
      if (isNumber(item)) {
        fieldNameString += `[${item}].`;
      } else {
        fieldNameString += item;
      }
    });
    return fieldNameString;
  }
}
export default CommonHelper;
