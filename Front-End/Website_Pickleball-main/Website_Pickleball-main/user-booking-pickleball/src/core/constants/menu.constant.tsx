import { MenuItem } from '@/core/types';
import PathURL from '../class/PathURL';

const getItems: () => MenuItem[] = () => [
  {
    label: 'sidebar:home',
    key: PathURL.home,
    icon: <i className="fa-solid fa-map" />,
    show: true
  },
  {
    label: 'sidebar:list',
    key: PathURL.list,
    icon: <i className="fa-solid fa-list" />,
    show: true
  },
  {
    label: 'sidebar:about',
    key: PathURL.about,
    icon: <i className="fa-solid fa-map" />,
    show: true
  },
  {
    label: 'sidebar:dieu_khoan',
    key: PathURL.dieu_khoan,
    icon: <i className="fa-solid fa-map" />,
    show: true
  },
  {
    label: 'sidebar:highlight',
    key: PathURL.highlight,
    icon: <i className="fa-solid fa-star" />,
    show: true
  },
  // {
  //   label: 'sidebar:policy',
  //   key: PathURL.policy,
  //   icon: <i className="fa-solid fa-map" />,
  //   show: true
  // },
  {
    label: 'sidebar:contact',
    key: PathURL.contact,
    icon: <i className="fa-solid fa-map" />,
    show: true
  }
];

export default getItems;
