import { PartnerRankEnum, PartnerStatusEnum, PartnerTypeEnum, QuotaStatusEnum } from '@/utils/enums';
import { ParamsCommon } from './common';
import { ExportType } from '../enums';

export type PartnerRank = keyof typeof PartnerRankEnum | 'custom';
export type PartnerStatus = keyof typeof PartnerStatusEnum;
export type PartnerType = keyof typeof PartnerTypeEnum;
export type QuotaStatus = keyof typeof QuotaStatusEnum;

export type Process = 'kong' | 'eid';
export type QuotaTypeEID = 'user_quota' | 'transaction_quota';

export interface Partner {
  id: number;
  address: string;
  api_key: string;
  consumer_id: string;
  email: string;
  is_email_verified?: boolean;
  name: string;
  partner_rank: PartnerRank;
  partner_type: PartnerType;
  phone_number: string;
  representative?: string;
  username: string;
  tax_number?: string;
  status: PartnerStatus;
  province_id: number;
  district_id: number;
  ward_id: number;
  code: string;
  province_name?: string;
  district_name?: string;
  ward_name?: string;
  verify_remain?: number;
  ekyc_remain?: number;
  ceca_remain?: number;
  ocr_id_remain?: number;
  liveness_remain?: number;
  user_quota_remain?: number;
  transaction_quota_remain?: number;
  created_at?: string;
  created_by?: number;
  updated_at?: string;
}

export interface PartnerParams extends ParamsCommon {
  status?: PartnerStatus;
  q?: string;
  from_time?: string;
  to_time?: string;
  partner_type?: string;
}

export interface PartnerFormValue {
  username: string;
  email: string;
  name: string;
  password?: string;
  password_confirmation?: string;
  consumer_id?: string;
  api_key: string;
  id: number;
  partner_type: PartnerType;
  partner_rank: PartnerRank;
  province_id?: number;
  district_id?: number;
  ward_id?: number;
  representative?: string;
  tax_number?: string;
  status?: PartnerStatus;
  phone_number?: string;
}

export interface Quota {
  id: number;
  contract_name: string;
  contract_code: string;
  contract_at: string;
  expired_at: string;
  quota: number;
  partner_id: number;
  status: QuotaStatus;
  remain: number;
  used: number;
  rank?: PartnerRank;
  provider_config_code: string;
  provider_config_name: string;
  type?: QuotaTypeEID;
}

export interface QuotaParams {
  page?: number;
  size?: number;
}

export interface PayloadQuota
  extends Pick<Quota, 'contract_at' | 'contract_code' | 'contract_name' | 'rank' | 'provider_config_code'> {
  type?: QuotaTypeEID;
}

export interface PayloadQuotaTrial {
  contract_name: string;
  contract_code: string;
  contract_at: string;
  expired_at: string;
  quota: number;
  provider_config_code: string;
  type?: QuotaTypeEID;
}

export interface PayloadCancel {
  cancelled_reason: string;
}

export type QuotaRemain = {
  title: string;
  total: number;
  remain: number;
};


