export type SettingType = 'long';

export type SETTING_CODE = 'EKYC_ORIGINAL_PRICE' | 'POST_PAID_ORIGINAL_PRICE';

export interface Setting {
  code: string;
  description: string;
  is_allow_update: boolean;
  status: string;
  type: SettingType;
  value: string;
}

export interface SettingParams {
  page_number: number;
  page_size: number;
}
