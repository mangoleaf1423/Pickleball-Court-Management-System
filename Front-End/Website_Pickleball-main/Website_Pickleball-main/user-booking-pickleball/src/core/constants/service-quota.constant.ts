import { SelectProps } from 'antd';
import { ItemType } from 'antd/es/menu/interface';

import { SelectType } from '../types';

export const EKYC_SERVICES: SelectType<EKYCType>[] = [
  {
    label: 'Face Matching',
    value: 'F'
  },
  {
    label: 'OCR',
    value: 'O'
  },
  {
    label: 'Liveness Detection',
    value: 'L'
  },
  {
    label: 'Emotion Liveness',
    value: 'EL'
  }
];
export const EKYB_SERVICES: SelectType<EKYBType>[] = [
  {
    label: 'Tax Code Verify',
    value: 'T'
  },
  {
    label: 'Gtin Verify',
    value: 'GV'
  },
  {
    label: 'Gtin Detail',
    value: 'GD'
  },
  {
    label: 'Tax Code Advanced',
    value: 'TC_ADV'
  },
  {
    label: 'Tax Code Basic',
    value: 'TC_BASIC'
  },
  {
    label: 'OCRX',
    value: 'OX'
  }
];

export const SSN_SERVICES: SelectType<EIDType>[] = [
  {
    label: 'VSS Advanced',
    value: 'SA'
  },
  {
    label: 'VSS Basic',
    value: 'SB'
  }
];

export const DECODE_CHIP_SERVICES: SelectProps['options'] = [
  {
    label: 'Decode Chip',
    value: 'DC'
  },
  {
    label: 'Decode Chip Verify',
    value: 'DC_V'
  }
];

export const SERVICES: SelectProps['options'] = [
  {
    label: 'EID Verify',
    value: 'V'
  },
  {
    label: 'Ceca',
    value: 'C'
  },
  {
    label: 'Decode Chip',
    options: [...DECODE_CHIP_SERVICES]
  },
  {
    label: 'EKYC',
    options: [...EKYC_SERVICES]
  },
  {
    label: 'EKYB',
    options: [...EKYB_SERVICES]
  }
];

export const QUOTA_ITEMS: ItemType[] = [
  {
    key: 'V',
    label: 'EID Verify'
  },
  {
    key: 'ssn',
    label: 'VSS',
    children: [
      {
        key: 'SA',
        label: 'VSS Advanced'
      },
      {
        key: 'SB',
        label: 'VSS Basic'
      }
    ]
  },
  {
    key: 'C',
    label: 'Ceca'
  },
  {
    key: 'decode_chip',
    label: 'Decode Chip',
    children: [
      {
        key: 'DC',
        label: 'Decode Chip'
      },
      {
        key: 'DC_V',
        label: 'Decode Chip Verify'
      }
    ]
  },
  {
    key: 'ekyc',
    label: 'EKYC',
    children: [
      {
        key: 'F',
        label: 'Face Matching'
      },
      {
        key: 'O',
        label: 'OCR'
      },
      {
        key: 'L',
        label: 'Liveness Detection'
      },
      {
        key: 'EL',
        label: 'Emotion Liveness'
      }
    ]
  },
  {
    key: 'ekyb',
    label: 'EKYB',
    children: [
      {
        label: 'Tax Code Verify',
        key: 'T'
      },
      {
        label: 'Gtin Verify',
        key: 'GV'
      },
      {
        label: 'Gtin Detail',
        key: 'GD'
      },
      {
        label: 'Tax Code Advanced',
        key: 'TC_ADV'
      },
      {
        label: 'Tax Code Basic',
        key: 'TC_BASIC'
      },
      {
        label: 'OCRX',
        key: 'OX'
      }
    ]
  }
];
