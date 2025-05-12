export enum PathKeyEnum {
  Dashboard = 'dashboard',
  Partner = 'partners',
  Report = 'report'
}

export enum PathLabelEnum {
  dashboard = 'Dashboard',
  partners = 'Danh sách đối tác',
  report = 'Báo cáo',
  transaction = 'Transaction',
  setting = 'Setting',
  add = 'Add'
}

export enum ActionKeyEnum {
  Edit = 'edit',
  Remove = 'remove',
  Logout = 'logout',
  Add = 'add',
  ChangeStatus = 'change-status',
  UpdatePassword = 'update-password',
  UpdateAPIKey = 'update-api-key'
}

// Enum Partner

export enum PartnerTypeEnum {
  individual = 'individual',
  business = 'business',
  government = 'government'
}

export enum PartnerRankTierEnum {
  bronze = 'TIER 1',
  silver = 'TIER 2',
  gold = 'TIER 3',
  platinum = 'TIER 4',
  diamond = 'TIER 5'
}

export enum PartnerRankEnum {
  bronze = 'BRONZE',
  silver = 'SILVER',
  gold = 'GOLD',
  platinum = 'PLATINUM',
  diamond = 'DIAMOND'
}

export enum PartnerStatusEnum {
  active = 'Active',
  inactive = 'Inactive'
}

export enum RoleNameEnum { 
  manager = 'Manager',
  staff = 'Staff',
  user = 'User',
  student = 'Student'
}

export enum CourtStatusEnum {
  active = 'Active',
  inactive = 'Inactive'
}

export enum QuotaStatusEnum {
  created = 'New',
  active = 'Active',
  expired = 'Expired',
  cancelled = 'Cancelled'
}

// Enum Transaction

export enum TransactionStatusEnum {
  success = 'Success',
  fail = 'Fail'
}

// Enum Dateformat
export enum DateFormat {
  'DD/MM/YYYY' = 'DD/MM/YYYY',
  DDMMYYYYHHmm = 'DD/MM/YYYY HH:mm',
  DDMMYYYYHHmmss = 'DD/MM/YYYY HH:mm:ss',
  YYYYMMDDHHmm = 'YYYYMMDDHHmm',
  YYYYMMDD = 'YYYYMMDD'
}
