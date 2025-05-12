import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
// don't want to use this?
// have a look at the Quick start guide
// for passing in lng and translations on init

import SIDEBAR_EN from '@/locales/en/sidebar.json';
import COMMON_EN from '@/locales/en/common.json';
import DASHBOARD_EN from '@/locales/en/dashboard.json';
import AUTH_EN from '@/locales/en/auth.json';
import ERRORS_EN from '@/locales/en/errors.json';
import PLACEHOLDER_EN from '@/locales/en/placeholder.json';
import SETTING_EN from '@/locales/en/setting.json';
import STATUS_EN from '@/locales/en/status.json';
import OPTION_EN from '@/locales/en/option.json';
import VALIDATION_EN from '@/locales/en/validation.json';
import BUTTON_EN from '@/locales/en/button.json';
import PARTNER_EN from '@/locales/en/partner.json';
import COURT_PRICES_EN from '@/locales/en/court_prices.json';
import ADMIN_EN from '@/locales/en/admin.json';
import ROLE_EN from '@/locales/en/role.json';

import SIDEBAR_VI from '@/locales/vi/sidebar.json';
import COMMON_VI from '@/locales/vi/common.json';
import DASHBOARD_VI from '@/locales/vi/dashboard.json';
import AUTH_VI from '@/locales/vi/auth.json';
import ERRORS_VI from '@/locales/vi/errors.json';
import PLACEHOLDER_VI from '@/locales/vi/placeholder.json';
import SETTING_VI from '@/locales/vi/setting.json';
import STATUS_VI from '@/locales/vi/status.json';
import OPTION_VI from '@/locales/vi/option.json';
import VALIDATION_VI from '@/locales/vi/validation.json';
import BUTTON_VI from '@/locales/vi/button.json';
import PARTNER_VI from '@/locales/vi/partner.json';
import COURT_PRICES_VI from '@/locales/vi/court_prices.json';
import ADMIN_VI from '@/locales/vi/admin.json';
import ROLE_VI from '@/locales/vi/role.json';


export const resources = {
  en: {
    sidebar: SIDEBAR_EN,
    common: COMMON_EN,
    dashboard: DASHBOARD_EN,
    auth: AUTH_EN,
    errors: ERRORS_EN,
    placeholder: PLACEHOLDER_EN,
    setting: SETTING_EN,
    status: STATUS_EN,
    option: OPTION_EN,
    validation: VALIDATION_EN,
    button: BUTTON_EN,
    partner: PARTNER_EN,
    court_prices: COURT_PRICES_EN,
    admin: ADMIN_EN,
    role: ROLE_EN
  },
  vi: {
    sidebar: SIDEBAR_VI,
    common: COMMON_VI,
    dashboard: DASHBOARD_VI,
    auth: AUTH_VI,
    errors: ERRORS_VI,
    placeholder: PLACEHOLDER_VI,
    setting: SETTING_VI,
    status: STATUS_VI,
    option: OPTION_VI,
    validation: VALIDATION_VI,
    button: BUTTON_VI,
    partner: PARTNER_VI,
    court_prices: COURT_PRICES_VI,
    admin: ADMIN_VI,  
    role: ROLE_VI
  }
} as const;

export const defaultNS = 'sidebar';

i18n
  // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  // learn more: https://github.com/i18next/i18next-http-backend
  // want your translations to be loaded from a professional CDN? => https://github.com/locize/react-tutorial#step-2---use-the-locize-cdn
  .use(Backend)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  .init({
    resources,
    ns: [
      'sidebar',
      'common',
      'dashboard',
      'auth',
      'errors',
      'placeholder',
      'setting',
    ],
    fallbackLng: 'en',
    defaultNS,
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    }
  });

export default i18n;
