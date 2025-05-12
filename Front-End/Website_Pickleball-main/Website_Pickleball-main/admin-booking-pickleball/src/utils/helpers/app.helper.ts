import {
  DECODE_CHIP_SERVICES,
  SSN_SERVICES,
  EKYB_SERVICES,
  EKYC_SERVICES,
  QUOTA_ITEMS,
  SERVICES
} from '@/core/constants';
import { useApp } from '@/store';
import { ItemType, MenuDividerType, MenuItemType } from 'antd/es/menu/interface';
import { DefaultOptionType } from 'antd/es/select';

class AppHelper {
  static readonly decodeChipCodes: ServiceCode[] = ['DC', 'DC_V'];
  static readonly ekycCodes: ServiceCode[] = ['EL', 'F', 'L', 'O'];
  static readonly ekyc3TCodes: ServiceCode[] = ['EL', 'F', 'L', 'O'];
  static readonly ekybCodes: ServiceCode[] = ['GV', 'T', 'GD', 'TC_ADV', 'TC_BASIC'];
  static readonly eidCodes: ServiceCode[] = ['V', 'SA', 'SB'];
  static readonly ssnCodes: ServiceCode[] = ['SA', 'SB'];
  static readonly vngCodes: ServiceCode[] = ['SA', 'SB'];

  static getEKYCList(servicesEnable: ServiceEnableType) {
    return EKYC_SERVICES.filter((item) => servicesEnable[item.value].enable);
  }

  static getDefaultValueEKYC(servicesEnable: ServiceEnableType): ServiceCode {
    let _serviceCode: ServiceCode = 'F';
    for (const serviceCode of Object.keys(servicesEnable) as ServiceCode[]) {
      if (this.ekycCodes.includes(serviceCode) && servicesEnable[serviceCode]?.enable) {
        _serviceCode = serviceCode;
        break;
      }
    }
    return _serviceCode;
  }

  static getDecodeChipList(servicesEnable: ServiceEnableType) {
    return DECODE_CHIP_SERVICES!.filter((item) => servicesEnable[item.value as ServiceCode]?.enable);
  }

  static getDefaultValueDecodeChip(servicesEnable: ServiceEnableType): ServiceCode {
    let _serviceCode: ServiceCode = 'DC';
    for (const serviceCode of Object.keys(servicesEnable) as ServiceCode[]) {
      if (this.decodeChipCodes.includes(serviceCode) && servicesEnable[serviceCode]?.enable) {
        _serviceCode = serviceCode;
        break;
      }
    }
    return _serviceCode;
  }

  static getEKYBList(servicesEnable: ServiceEnableType) {
    console.log(EKYB_SERVICES.filter((item) => servicesEnable[item.value]?.enable))
    return EKYB_SERVICES.filter((item) => servicesEnable[item.value]?.enable);
  }

  static getDefaultValueEKYB(servicesEnable: ServiceEnableType): ServiceCode {
    let _serviceCode: ServiceCode = 'T';
    for (const serviceCode of Object.keys(servicesEnable) as ServiceCode[]) {
      if (this.ekybCodes.includes(serviceCode) && servicesEnable[serviceCode]?.enable) {
        _serviceCode = serviceCode;
        break;
      }
    }
    return _serviceCode;
  }

  static getSSNList(servicesEnable: ServiceEnableType) {
    return SSN_SERVICES.filter((item) => servicesEnable[item.value]?.enable);
  }

  static getDefaultValueSSN(servicesEnable: ServiceEnableType): ServiceCode {
    let _serviceCode: ServiceCode = 'SA';
    for (const serviceCode of Object.keys(servicesEnable) as ServiceCode[]) {
      if (this.ssnCodes.includes(serviceCode) && servicesEnable[serviceCode]?.enable) {
        _serviceCode = serviceCode;
        break;
      }
    }
    return _serviceCode;
  }

  static showEKYC(servicesEnable: ServiceEnableType) {
    return this.ekycCodes.some((item) => servicesEnable[item]?.enable);
  }
  static showEKYC3T(servicesEnable: ServiceEnableType) {
    return this.ekyc3TCodes.some((item) => servicesEnable[item]?.enable);
  }
  static showEID(servicesEnable: ServiceEnableType) {
    return servicesEnable.V?.enable;
  }

  static showEKYB(servicesEnable: ServiceEnableType) {
    return this.ekybCodes.some((item) => servicesEnable[item]?.enable);
  }

  static showSSN(servicesEnable: ServiceEnableType) {
    return this.ssnCodes.some((item) => servicesEnable[item]?.enable);
  }

  static showVNG(servicesEnable: ServiceEnableType) {
    return this.vngCodes.some((item) => servicesEnable[item]?.enable);
  }

  static getServiceEnable(servicesEnable: ServiceEnableType) {
    const services = SERVICES?.filter((item) => {
      if (item.options) {
        return {
          ...item,
          options: item.options.filter(
            (option: DefaultOptionType) => option?.value && servicesEnable?.[option.value as ServiceCode]?.enable
          )
        };
      }
      return item.value && servicesEnable[item.value as ServiceCode]?.enable;
    });
    return services;
  }
  static readonly isDividerMenu = (item: any): item is MenuDividerType => item.type === 'divider';
  static readonly isMenuItem = (item: any): item is MenuItemType => !item.children;

  static getQuotaItems() {
    const servicesEnable = useApp.getState().servicesEnable;
    const _items = QUOTA_ITEMS.reduce<ItemType[]>((result, current) => {
      if (!current || this.isDividerMenu(current)) {
        return result;
      }
      if (this.isMenuItem(current)) {
        servicesEnable[current.key as ServiceCode]?.enable && result.push(current);
      } else {
        const _item: ItemType = { ...current, children: [] };
        current.children?.forEach((child) => {
          servicesEnable[child?.key as ServiceCode]?.enable && _item.children?.push(child);
        });
        result.push(_item);
      }
      return result;
    }, []);
    return _items;
  }
}

export default AppHelper;
