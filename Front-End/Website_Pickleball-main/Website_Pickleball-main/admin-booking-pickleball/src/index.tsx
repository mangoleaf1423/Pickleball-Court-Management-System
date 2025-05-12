import { StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer, ToastContainerProps } from 'react-toastify';
import * as yup from 'yup';

import '@/app/i18n';
import App from './App';
yup.setLocale(yupLocale);

import 'dayjs/locale/vi';

import '@/assets/styles/font-awesome.css';
import 'react-toastify/dist/ReactToastify.css';

import '@/assets/styles/style.scss';
import 'index.scss';
import { yupLocale } from './core/configs/yupLocale';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const toastConfig: ToastContainerProps = {
  position: 'top-center',
  autoClose: 2000,
  hideProgressBar: true,
  newestOnTop: false,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: 'light'
};

const container = document.getElementById('root') as HTMLDivElement;
const root = createRoot(container);
root.render(
  <BrowserRouter>
    <ConfigProvider
      theme={{
        components: {
          Typography: {
            margin: 0
          },
          Layout: {
            headerBg: '#242527'
          },
          Menu: {
            itemSelectedBg: 'rgb(58,59,61)',
            itemSelectedColor: 'rgb(196,197,199)',
            itemColor: 'rgb(196,197,199)',
            itemBg: 'rgb(36,37,39)',
            itemHoverColor: 'rgb(196,197,199)',
            itemHoverBg: 'rgb(58,59,61)',
            subMenuItemBg: 'rgb(36,37,39)'
          }
        }
      }}
    >
      <StyleProvider hashPriority="high">
        <App />
        <ToastContainer {...toastConfig} />
      </StyleProvider>
    </ConfigProvider>
  </BrowserRouter>
);
