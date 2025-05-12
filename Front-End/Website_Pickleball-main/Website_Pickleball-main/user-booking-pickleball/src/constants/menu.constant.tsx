import { MenuItem } from '@/core/types';
import PathURL from '@/core/class/PathURL';

const getItems: () => MenuItem[] = () => [
  {
    label: 'sidebar:map',
    key: PathURL.map,
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
    label: 'sidebar:highlight',
    key: PathURL.highlight,
    icon: <i className="fa-solid fa-star" />,
    show: true
  },
  {
    label: 'sidebar:account',
    key: PathURL.account,
    icon: <i className="fa-solid fa-user" />,
    show: true
  }
];

export default getItems;
