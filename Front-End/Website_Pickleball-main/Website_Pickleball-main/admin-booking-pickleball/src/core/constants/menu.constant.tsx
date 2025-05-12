import { MenuItem } from '@/core/types';
import PathURL from '../class/PathURL';

const getItems: () => MenuItem[] = () => [
  {
    label: 'sidebar:dashboard',
    key: PathURL.dashboard,
    icon: <i className="fa-solid fa-gauge" />,
    children: [
      {
        label: 'sidebar:statistic', 
        key: PathURL.statistic,
        icon: <i className="fa-solid fa-chart-line" />,
        show: true,
        roles: ['ADMIN', 'MANAGER']
      },
      {
        label: 'sidebar:analysis',
        key: PathURL.analysis,
        icon: <i className="fas fa-analytics"></i>,
        show: true,
        roles: ['ADMIN', 'MANAGER']
      },
      {
        label: 'sidebar:orders',
        key: PathURL.orders,
        icon: <i className="fa-solid fa-cart-shopping" />,
        show: true,
        roles: ['ADMIN', 'MANAGER']
      },
      {
        label: 'sidebar:transactions',
        key: PathURL.transactions,
        icon: <i className="fa-solid fa-money-bill" />,
        show: true,
        roles: ['ADMIN', 'MANAGER']
      },
    ]
  },
  {
    label: 'sidebar:partner',
    key: PathURL.partners,
    icon: <i className="fa-solid fa-user-group" />,
    show: true,
    roles: ['ADMIN']
  },
  {
    label: 'sidebar:staff_management',
    key: PathURL.staff_management,
    icon: <i className="fa-solid fa-user-group" />,
    show: true,
    roles: ['MANAGER']
  },
  {
    label: 'sidebar:court_prices',
    key: PathURL.courtPrices,
    icon: <i className="fa-solid fa-money-bill" />,
    show: true,
    roles: ['ADMIN']
  },
  {
    label: 'sidebar:court_status',
    key: PathURL.courtStatus,
    icon: <i className="fa-solid fa-circle-info" />,
    show: true,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    label: 'sidebar:court_services',
    key: PathURL.courtServices,
    icon: <i className="fa-solid fa-scissors" />,
    show: true,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    label: 'sidebar:sells',
    key: PathURL.sells,
    icon: <i className="fa-solid fa-cart-shopping" />,
    show: true,
    roles: ['STAFF']
  },
  {
    label: 'sidebar:booking',
    key: PathURL.booking,
    icon: <i className="fa-solid fa-calendar-days" />,
    show: true,
    roles: ['STAFF']
  },
  {
    label: 'sidebar:court_images',
    key: PathURL.courtImages,
    icon: <i className="fa-solid fa-image" />,
    show: true,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    label: 'sidebar:rackets',
    key: PathURL.rackets,
    icon: <i className="fa-solid fa-table-tennis-paddle-ball" />,
    show: true,
    roles: ['ADMIN', 'MANAGER']
  },
  {
    label: 'sidebar:role',
    key: PathURL.role,
    icon: <i className="fa-solid fa-user-tag" />,
    show: true,
    roles: ['ADMIN']
  },
  // {
  //   label: 'sidebar:permission',
  //   key: PathURL.permission,
  //   icon: <i className="fa-solid fa-user-shield" />,
  //   show: true,
  //   roles: ['ADMIN']
  // },
  {
    label: 'sidebar:staff_order_booking_date',
    key: PathURL.staff_order_booking_date,
    icon: <i className="fa-solid fa-calendar-days" />,
    show: true,
    roles: ['STAFF']
  },
  {
    label: 'sidebar:staff_order_service',
    key: PathURL.staffOrder,
    icon: <i className="fa-solid fa-cart-shopping" />,
    show: true,
    roles: ['STAFF']
  }
];

export default getItems;
