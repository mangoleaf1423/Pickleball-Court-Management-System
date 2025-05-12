import 'react-i18next';

import { defaultNS, resources } from '@/app/i18n';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    returnNull: false;
    returnObjects: true;
    resources: (typeof resources)['en'];
  }
}
