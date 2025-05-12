import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import PathURL from '@/core/class/PathURL';
import LoadingPage from '@/core/components/LoadingPage';
import DefaultLayout from '@/core/layout/DefaultLayout';
import LoginPage from '@/features/auth/Login';
import PageNotFound from '@/features/auth/PageNotFound';
import ServiceUnavailablePage from '@/features/admin/ServiceUnavailablePage ';
import About from '@/features/admin/About';
import DieuKhoan from '@/features/admin/DieuKhoan';
import CheckoutScheduleAuto from '@/features/admin/CheckoutScheduleAuto';

const Loadable = (Component: React.FC) => {
  const LoadableComponent = (props: any) => {
    return (
      <React.Suspense fallback={<LoadingPage />}>
        <Component {...props} />
      </React.Suspense>
    );
  };
  return LoadableComponent;
};

export default function Router() {
  return useRoutes([
    {
      path: PathURL.login,
      element: <LoginPage />
    },
    {
      path: PathURL.register,
      element: <Register />
    },
    {
      path: PathURL.register_student,
      element: <RegisterStudent />
    },
    {
      path: PathURL.schedule,
      element: <ScheduleGrid />
    },
    {
      path: PathURL.schedule_auto,
      element: <ScheduleAuto />
    },
    {
      path: PathURL.change_order,
      element: <ChangeSchedule />
    },
    {
      path: PathURL.checkout_change_order,
      element: <Checkout />
    },
    {
      path: PathURL.checkout,
      element: <Checkout />
    },
    {
      path: PathURL.payment,
      element: <Payment />
    },

    {
      path: PathURL.checkout_schedule_auto,
      element: <CheckoutScheduleAuto />
    },
    {
      path: PathURL.payment_schedule_auto,
      element: <PaymentScheduleAuto />
    },
    {
      path: '',
      element: <DefaultLayout />,
      children: [
        {
          path: PathURL.map,
          element: <Map />
        },
        {
          path: PathURL.list,
          element: <ListPickleBall />
        },
        {
          path: PathURL.highlight,
          element: <Highlight />
        },
        {
          path: PathURL.account,
          element: <Account />
        },
        {
          path: PathURL.home,
          element: <Home />
        },
        {
          path: PathURL.about,
          element: <About />
        },
        {
          path: PathURL.contact,
          element: <Contact />
        },
        {
          path: PathURL.policy,
          element: <Policy />
        },
        {
          path: PathURL.dieu_khoan,
          element: <DieuKhoan />
        },
        {
          path: PathURL.pickleball,
          element: <PlaceDetail />
        },
        {
          path: PathURL.history,
          element: <History />
        },
        {
          path: PathURL.upgrade_account,
          element: <UpgradeAccount />
        },
        {
          path: PathURL.notification,
          element: <Notification />
        }
      ]
    },
    {
      path: '404',
      element: <PageNotFound />
    },
    {
      path: '/service-unavailable',
      element: <ServiceUnavailablePage />
    },
    {
      path: '*',
      element: <Navigate to={`/${PathURL.pageNotFound}`} replace />
    }
  ]);
}

const Map = Loadable(React.lazy(() => import('@/features/admin/Map')));
const ListPickleBall = Loadable(React.lazy(() => import('@/features/admin/ListPickleBall')));
const Highlight = Loadable(React.lazy(() => import('@/features/admin/Highlight')));
const Account = Loadable(React.lazy(() => import('@/features/admin/Account')));
const Register = Loadable(React.lazy(() => import('@/features/auth/Register')));
const ScheduleGrid = Loadable(React.lazy(() => import('@/features/admin/ScheduleGrid')));
const ScheduleAuto = Loadable(React.lazy(() => import('@/features/admin/ScheduleAuto')));
const Home = Loadable(React.lazy(() => import('@/features/admin/Home')));
const Contact = Loadable(React.lazy(() => import('@/features/admin/Contact')));
const Policy = Loadable(React.lazy(() => import('@/features/admin/Policy')));
const PlaceDetail = Loadable(React.lazy(() => import('@/features/admin/PlaceDetail')));
const Checkout = Loadable(React.lazy(() => import('@/features/admin/Checkout')));
const Payment = Loadable(React.lazy(() => import('@/features/admin/Payment')));
const History = Loadable(React.lazy(() => import('@/features/admin/History')));
const UpgradeAccount = Loadable(React.lazy(() => import('@/features/admin/UpgradeAccount')));
const Notification = Loadable(React.lazy(() => import('@/features/admin/Notification')));
const RegisterStudent = Loadable(React.lazy(() => import('@/features/auth/RegisterStudent')));
const PaymentScheduleAuto = Loadable(React.lazy(() => import('@/features/admin/PaymentScheduleAuto')));
const ChangeSchedule = Loadable(React.lazy(() => import('@/features/admin/ChangeSchedule')));
