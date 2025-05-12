import { Pagination, SelectType } from '@/core/types';
import { EnumToArrayObject } from './commonUtils';
import { PartnerRankEnum, PartnerStatusEnum, PartnerTypeEnum } from './enums';

export const ACCOUNT_STATUS = EnumToArrayObject(PartnerStatusEnum);

export const PARTNER_RANKS = EnumToArrayObject(PartnerRankEnum);

export const PARTNER_TYPES = EnumToArrayObject(PartnerTypeEnum);

export const APP_VERSION = 'v1.0.0';

export const DISTANCE_EXPIRE_QUOTA_EID = 12; // month

export const PAGE_SIZE_FULL = 999999;

export const PAGINATION_DEFAULT: Pagination = {
  page_number: 1,
  page_size: 10,
  total_elements: 0
};
