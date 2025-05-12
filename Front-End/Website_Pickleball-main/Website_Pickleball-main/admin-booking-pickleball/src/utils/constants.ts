import { Pagination, SelectType } from '@/core/types';
import { EnumToArrayObject } from './commonUtils';
import { CourtStatusEnum, PartnerRankEnum, PartnerStatusEnum, PartnerTypeEnum, RoleNameEnum } from './enums';

export const ACCOUNT_STATUS = EnumToArrayObject(PartnerStatusEnum);

export const ROLE_NAME = EnumToArrayObject(RoleNameEnum);

export const COURT_STATUS = EnumToArrayObject(CourtStatusEnum);

export const PARTNER_RANKS = EnumToArrayObject(PartnerRankEnum);

export const PARTNER_TYPES = EnumToArrayObject(PartnerTypeEnum);

export const APP_VERSION = 'v1.0.0';

export const DISTANCE_EXPIRE_QUOTA_EID = 12; // month

export const PAGE_SIZE_FULL = 999999;

export const PAGINATION_DEFAULT: Pagination = {
  page: 1,
  size: 10,
  totalElements: 0
};
