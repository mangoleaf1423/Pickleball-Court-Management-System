export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF'
}
export enum LocalStorageKeyEnum {
  auth = 'auth'
}

export enum ExportTransactionStatusEnum {
  'pending' = 'Pending',
  'error' = 'Error',
  'processing' = 'Processing',
  'completed' = 'Completed',
  'expired' = 'Expired'
}

export enum ServiceEnum {

}

export enum TransactionTypeEnum {
  'T' = 'Transaction Request',
  'R' = 'User Request'
}

export enum ExportType {
  MANUAL = 'manual',
  DAILY = 'daily',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}
