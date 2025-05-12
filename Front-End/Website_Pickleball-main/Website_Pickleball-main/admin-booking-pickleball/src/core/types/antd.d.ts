import 'antd';

declare module 'antd/es/menu/interface' {
  export interface MenuItemType {
    show?: boolean;
    roles?: any;
  }
  export interface SubMenuType {
    show?: boolean;
  }
  export interface MenuItemGroupType {
    show?: boolean;
  }
}
