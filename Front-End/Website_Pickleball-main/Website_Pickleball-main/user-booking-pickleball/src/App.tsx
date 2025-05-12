import { ConfigProvider } from 'antd';
import { Locale } from 'antd/es/locale';
import * as Chart from 'chart.js';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import Route from './routes';
import { useApp } from './store';

import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';

Chart.defaults.font.family = "'Open Sans'";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [locale, setLocale] = useState<Locale>(viVN);
  const colorPrimary = process.env.REACT_APP_COLOR_PRIMARY;

  const { setUser,  language } = useApp();

  const { t } = useTranslation(['common']);
  const { pathname } = useLocation();


  useEffect(() => {
    if (language === 'en') {
      setLocale(enUS);
      dayjs.locale('en');
    } else if (language === 'vi') {
      setLocale(viVN);
      dayjs.locale('vi');
    }
  }, [language]);

  // check internet
  useEffect(() => {
    // logout when internet offline
    const handleOffline = () => {
      if (pathname.includes('login')) return;
      setUser();
      toast.info(t(['common:message.Internet Offline']));
    };

    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, [setUser, t, pathname]);

  return (
    <ConfigProvider
      locale={locale}
      theme={{
        token: {
          fontSize: 17,
          fontFamily:
            "'Open Sans', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
          colorPrimary
        }
      }}
    >
      <div className="h-screen w-screen">
        <Route />
      </div>
    </ConfigProvider>
  );
}

export default App;
