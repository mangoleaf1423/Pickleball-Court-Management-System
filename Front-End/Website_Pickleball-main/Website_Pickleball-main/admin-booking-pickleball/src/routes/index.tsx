import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import PathURL from '@/core/class/PathURL';
import LoadingPage from '@/core/components/LoadingPage';
import PrivateRoute from '@/core/components/PrivateRoute';
import DefaultLayout from '@/core/layout/DefaultLayout';
import LoginPage from '@/features/auth/Login';
import PageNotFound from '@/features/auth/PageNotFound';
import ServiceUnavailablePage from '@/features/admin/ServiceUnavailablePage ';
import { Role } from '@/core/enums';
import CourtImages from '@/features/admin/CourtImages';
import Sells from '@/features/admin/Sells';
import Analysis from '@/features/admin/Analysis';

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
      path: '',
      element: (
        <PrivateRoute roles={[Role.ADMIN, Role.MANAGER, Role.STAFF]}>
          <DefaultLayout />
        </PrivateRoute>
      ),
      children: [
        {
          path: PathURL.dashboard,
          element: <Dashboard />
        },
        {
          path: PathURL.partners,
          element: <Partner />
        },
        {
          path: PathURL.addPartners,
          element: <AddPartner />
        },
        {
          path: PathURL.editPartners,
          element: <EditPartner />
        },
        {
          path: PathURL.report,
          element: <Report />
        },
        {
          path: PathURL.statistic,
          element: <Statistic />
        },
        {
          path: PathURL.drinks,
          element: <Drinks />
        },
        {
          path: PathURL.balls,
          element: <Balls />
        },
        {
          path: PathURL.tournaments,
          element: <Tournaments />
        },
        {
          path: PathURL.schedules,
          element: <Schedules />
        },
        {
          path: PathURL.sportEquipments,
          element: <SportEquipments />
        },
        {
          path: PathURL.coaches,
          element: <Coaches />
        },
        {
          path: PathURL.rackets,
          element: <Rackets />
        },
        {
          path: PathURL.courtPrices,
          element: <CourtPrices />
        },
        {
          path: PathURL.courtPricesAddEdit,
          element: <CourtPricesAddEdit />
        },
        {
          path: PathURL.courtPricesEdit,
          element: <CourtPricesAddEdit />
        },
        {
          path: PathURL.courtStatus,
          element: <CourtStatus />
        },
        {
          path: PathURL.profile,
          element: <Profile />
        },
        {
          path: PathURL.orders,
          element: <Order />
        },
        {
          path: PathURL.transactions,
          element: <Transaction />
        },
        {
          path: PathURL.permission,
          element: <Permission />
        },
        {
          path: PathURL.role,
          element: <RoleComponent />
        },
        {
          path: PathURL.courtServices,
          element: <CourtServices />
        },
        {
          path: PathURL.courtImages,
          element: <CourtImages />
        },
        {
          path: PathURL.sells,
          element: <Sells />
        },
        {
          path: PathURL.analysis,
          element: <Analysis />
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
          path: PathURL.booking,
          element: <Booking />
        },
        {
          path: PathURL.staff_management,
          element: <StaffManagement />
        },
        {
          path: PathURL.staff_order_booking_date,
          element: <StaffOrderBookingDate />
        },
        {
          path: PathURL.addStaff,
          element: <AddStaff />
        },
        {
          path: PathURL.editStaff,
          element: <EditStaff />
        },
        {
          path: PathURL.staffOrder,
          element: <OrderStaff />
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

const Profile = Loadable(React.lazy(() => import('@/features/admin/Profile')));
const Dashboard = Loadable(React.lazy(() => import('@/features/admin/Dashboard')));
const Report = Loadable(React.lazy(() => import('@/features/admin/Report')));
const Statistic = Loadable(React.lazy(() => import('@/features/admin/Statistic')));
const Drinks = Loadable(React.lazy(() => import('@/features/admin/Drinks')));
const Balls = Loadable(React.lazy(() => import('@/features/admin/Balls')));
const Tournaments = Loadable(React.lazy(() => import('@/features/admin/Tournaments')));
const Schedules = Loadable(React.lazy(() => import('@/features/admin/Schedules')));
const SportEquipments = Loadable(React.lazy(() => import('@/features/admin/SportEquipments')));
const Coaches = Loadable(React.lazy(() => import('@/features/admin/Coaches')));
const Rackets = Loadable(React.lazy(() => import('@/features/admin/Rackets')));
const CourtPrices = Loadable(React.lazy(() => import('@/features/admin/CourtPrices/CourtPricesManage')));
const CourtStatus = Loadable(React.lazy(() => import('@/features/admin/CourtStatus')));
const Partner = Loadable(React.lazy(() => import('@/features/admin/Partner/PartnerManage')));
const AddPartner = Loadable(React.lazy(() => import('@/features/admin/Partner/PartnerAddEdit')));
const EditPartner = Loadable(React.lazy(() => import('@/features/admin/Partner/PartnerAddEdit')));
const CourtPricesAddEdit = Loadable(React.lazy(() => import('@/features/admin/CourtPrices/CourtPricesAddEdit')));
const Order = Loadable(React.lazy(() => import('@/features/admin/Order/OrderManage')));
const Transaction = Loadable(React.lazy(() => import('@/features/admin/Transaction/TransactionManage')));
const Permission = Loadable(React.lazy(() => import('@/features/admin/Permission')));
const RoleComponent = Loadable(React.lazy(() => import('@/features/admin/Role')));
const CourtServices = Loadable(React.lazy(() => import('@/features/admin/CourtServices')));
const ScheduleGrid = Loadable(React.lazy(() => import('@/features/admin/Booking/ScheduleGrid')));
const ScheduleAuto = Loadable(React.lazy(() => import('@/features/admin/Booking/ScheduleAuto')));
const Checkout = Loadable(React.lazy(() => import('@/features/admin/Booking/Checkout')));
const Payment = Loadable(React.lazy(() => import('@/features/admin/Booking/Payment')));
const CheckoutScheduleAuto = Loadable(React.lazy(() => import('@/features/admin/Booking/CheckoutScheduleAuto')));
const PaymentScheduleAuto = Loadable(React.lazy(() => import('@/features/admin/Booking/PaymentScheduleAuto')));
const Booking = Loadable(React.lazy(() => import('@/features/admin/Booking')));
const StaffManagement = Loadable(React.lazy(() => import('@/features/admin/Staff/PartnerManage')));
const StaffOrderBookingDate = Loadable(React.lazy(() => import('@/features/admin/StaffOrderBookingDate')));
const AddStaff = Loadable(React.lazy(() => import('@/features/admin/Staff/PartnerAddEdit')));
const EditStaff = Loadable(React.lazy(() => import('@/features/admin/Staff/PartnerAddEdit')));
const OrderStaff = Loadable(React.lazy(() => import('@/features/admin/StaffOder')));

