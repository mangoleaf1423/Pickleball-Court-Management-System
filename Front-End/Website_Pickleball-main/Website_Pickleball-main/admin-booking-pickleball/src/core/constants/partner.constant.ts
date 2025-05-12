import { Partner } from '../types';

export const quotaRemainMap: {
  [key in ServiceCode]: {
    title: string;
    total: keyof Partner;
    remain: keyof Partner;
    transactionType: TransactionType;
  }[];
} = {
  V: [
    {
      title: 'user-quota',
      total: 'user_quota_total',
      remain: 'user_quota_remain',
      transactionType: 'R'
    },
    {
      title: 'transaction-quota',
      total: 'transaction_quota_total',
      remain: 'transaction_quota_remain',
      transactionType: 'T'
    }
  ],
  C: [
    {
      title: 'quota_remain',
      total: 'ceca_remain',
      remain: 'ceca_remain',
      transactionType: 'T'
    }
  ],
  O: [
    {
      title: 'quota_remain',
      total: 'ocr_id_total_quota',
      remain: 'ocr_id_remain',
      transactionType: 'T'
    }
  ],
  F: [
    {
      title: 'quota_remain',
      total: 'ekyc_total_quota',
      remain: 'ekyc_remain',
      transactionType: 'T'
    }
  ],
  L: [
    {
      title: 'quota_remain',
      total: 'liveness_total_quota',
      remain: 'liveness_remain',
      transactionType: 'T'
    }
  ],
  EL: [
    {
      title: 'quota_remain',
      total: 'emotion_liveness_total_quota',
      remain: 'emotion_liveness_remain',
      transactionType: 'T'
    }
  ],
  DC: [
    {
      title: 'transaction-quota',
      total: 'decode_chip_transaction_quota_total',
      remain: 'decode_chip_transaction_quota_remain',
      transactionType: 'T'
    }
  ],
  GV: [
    {
      title: 'quota_remain',
      total: 'gtin_verify_transaction_quota_total',
      remain: 'gtin_verify_transaction_quota_remain',
      transactionType: 'T'
    }
  ],
  T: [
    {
      title: 'quota_remain',
      total: 'tax_code_total_quota',
      remain: 'tax_code_remain',
      transactionType: 'T'
    }
  ],
  DC_V: [
    {
      title: 'quota_remain',
      total: 'decode_chip_verify_transaction_quota_total',
      remain: 'decode_chip_verify_transaction_quota_remain',
      transactionType: 'T'
    }
  ],
  GD: [
    {
      title: 'quota_remain',
      total: 'gtin_detail_total_quota',
      remain: 'gtin_detail_remain',
      transactionType: 'T'
    }
  ],
  TC_ADV: [
    {
      title: 'quota_remain',
      total: 'tax_code_adv_total_quota',
      remain: 'tax_code_adv_remain',
      transactionType: 'T'
    }
  ],
  TC_BASIC: [
    {
      title: 'quota_remain',
      total: 'tax_code_basic_total_quota',
      remain: 'tax_code_basic_remain',
      transactionType: 'T'
    }
  ],
  OX: [
    {
      title: 'quota_remain',
      total: 'ocrx_total_quota',
      remain: 'ocrx_remain',
      transactionType: 'T'
    }
  ],
  SA: [
    {
      title: 'quota_remain',
      total: 'ssn_advanced_total_quota',
      remain: 'ssn_advanced_remain',
      transactionType: 'T'
    }
  ],
  SB: [
    {
      title: 'quota_remain',
      total: 'ssn_basic_total_quota',
      remain: 'ssn_basic_remain',
      transactionType: 'T'
    }
  ]
};
