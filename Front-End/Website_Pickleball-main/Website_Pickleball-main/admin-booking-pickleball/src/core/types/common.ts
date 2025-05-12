import { PickerMode } from 'rc-picker/lib/interface';
import { ColumnGroupType, ColumnType } from 'antd/es/table';
import { Dayjs } from 'dayjs';
import { ItemType } from 'antd/es/menu/interface';
import { Dispatch, SetStateAction } from 'react';
import { FieldNames } from 'rc-select/lib/Select.js';
import { FormInstance, MenuProps, SelectProps } from 'antd';

import { ActionKeyEnum } from '@/utils/enums';
import { EnumAsUnion } from './enum-as-union';

export type ActionTypes = EnumAsUnion<typeof ActionKeyEnum>;

export interface SelectType<T> {
  label: string | number;
  labelEn?: string;
  value: T;
  show?: boolean;
}
export interface ParamsCommon {
  page: number;
  size: number;
} 

export interface ErrorObject {
  code: string;
  message: string;
}

export interface Pagination {
  page: number;
  size: number;
  totalElements?: number;
}

export interface ResponseCommon<T> {
  success: boolean;
  data?: T;
  error: ErrorObject;
}

export interface IResponseList<T> extends ResponseCommon<T> {
  page: number;
  totalElements: number;
  totalPages: number;
}

export interface FormLayoutItem {
  labelCol?: {
    span?: number;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
    offset?: number;
  };
  wrapperCol?: {
    span?: number;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
    offset?: number;
  };
}

export type Size = {
  span?: number;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
};

export type SearchParamsValue = Record<string, string | number | Dayjs | [Dayjs, Dayjs] | undefined>;

export type PayloadValue = Record<string, string | number | boolean | undefined>;

export type ColumnTableType<T> = ColumnGroupType<T> | ColumnType<T> | null;

export type ColumnsTableType<T> = ColumnTableType<T>[];

export type ColumnTableTypeExcludeNull<T> = ColumnGroupType<T> | ColumnType<T>;
export type ColumnsTableTypeExcludeNull<T> = ColumnTableTypeExcludeNull<T>[];

export type MenuItem =
  | (Exclude<
      ItemType<{
        roles?: Role[];
        show?: boolean;
        key: string;
      }>,
      null
    > & {
      roles?: Role[];
      show?: boolean;
    })
  | null;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SearchPageCoreRef<T> = {
  fetchData: () => void;
  setLoading: Dispatch<SetStateAction<boolean>>;
  form: FormInstance<any>;
};

type FilterItemCommon = {
  name: string;
  size?: Size;
  allowClear?: boolean;
  defaultValue?: number | string | Dayjs | [Dayjs, Dayjs] | [number, number];
  placeholder: string | [string, string];
  conditionDisplay?: Record<string, string>;
};

type FilterItemSelect = FilterItemCommon & {
  type: 'select';
  selectType?: 'static' | 'api' | 'search';
  fieldNames?: FieldNames;
  fetchData?: () => void;
  optionAll?: any;
  showSearch?: boolean;
} & Pick<SelectProps, 'options' | 'optionFilterProp'>;

type FilterItemInput = FilterItemCommon & {
  type: 'input';
};

type FilterItemDate = FilterItemCommon & {
  type: 'date';
  mode?: PickerMode;
};

type FilterItemRangeDate = FilterItemCommon & {
  type: 'range-date';
};

type FilterItemDropdown = FilterItemCommon & {
  type: 'dropdown';
  enumMap?: any;
} & Pick<MenuProps, 'items'>;

export type FilterItem = FilterItemSelect | FilterItemInput | FilterItemDate | FilterItemRangeDate | FilterItemDropdown;

export type InfoItem<T> = {
  icon?: JSX.Element;
  label?: React.ReactNode;
  dataIndex: keyof T;
  size?: Size;
  render?: (data: T) => React.ReactNode;
  isHidden?: boolean;
};
