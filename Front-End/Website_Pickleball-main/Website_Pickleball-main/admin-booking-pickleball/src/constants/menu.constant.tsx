import { MenuItem } from '@/core/types';
import PathURL from '../core/class/PathURL';

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
        show: true
      },
      {
        label: 'sidebar:report',
        key: PathURL.report,
        icon: <i className="fa-solid fa-file-lines" />,
        show: true
      }
    ]
  },
  {
    label: 'sidebar:partner',
    key: "",
    icon: <i className="fa-solid fa-user-group" />,
    show: true,
    children: [
      {
        label: 'sidebar:tournaments',
        key: PathURL.tournaments,
        icon: <i className="fa-solid fa-trophy" />,
        show: true
      },
      {
        label: 'sidebar:schedules',
        key: PathURL.schedules,
        icon: <i className="fa-solid fa-calendar" />,
        show: true
      },
      {
        label: 'sidebar:court_prices',
        key: PathURL.courtPrices,
        icon: <i className="fa-solid fa-money-bill" />,
        show: true
      },
      {
        label: 'sidebar:court_status',
        key: PathURL.courtStatus,
        icon: <i className="fa-solid fa-circle-info" />,
        show: true
      },
      {
        label: 'sidebar:drinks',
        key: PathURL.drinks,
        icon: <i className="fa-solid fa-wine-glass" />,
        show: true
      },
      {
        label: 'sidebar:balls',
        key: PathURL.balls,
        icon: <i className="fa-solid fa-baseball" />,
        show: true
      },
      {
        label: 'sidebar:sport_equipments',
        key: PathURL.sportEquipments,
        icon: <i className="fa-solid fa-volleyball" />,
        show: true
      },
      {
        label: 'sidebar:coaches',
        key: PathURL.coaches,
        icon: <i className="fa-solid fa-chalkboard-user" />,
        show: true
      },
      {
        label: 'sidebar:rackets',
        key: PathURL.rackets,
        icon: <i className="fa-solid fa-table-tennis-paddle-ball" />,
        show: true
      }
    ]
  },
  {
    label: 'sidebar:profile',
    key: PathURL.profile,
    icon: <i className="fa-solid fa-address-card" />,
    show: true,
    roles: ['partner']
  }
];

export default getItems;
