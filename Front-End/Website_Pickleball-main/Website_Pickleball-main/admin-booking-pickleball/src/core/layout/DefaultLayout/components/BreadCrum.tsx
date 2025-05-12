import { Breadcrumb } from 'antd';
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { PathKeyEnum, PathLabelEnum } from '@/utils/enums';
import { ItemType } from 'antd/es/breadcrumb/Breadcrumb';

const BreadCrumb = () => {
  const location = useLocation();
  const items = useMemo(() => {
    const { pathname } = location;
    const pathnames = pathname.split('/').filter((item) => item);
    const result: ItemType[] = [];
    if (pathnames?.length === 0) {
      result.push({
        title: <span className="text-base capitalize">{'Dashboard'}</span>
      });
    } else {
      pathnames.forEach((name, index) => {
        if (name === 'edit') {
          return;
        }
        if (index === 0 && name !== PathKeyEnum.Dashboard) {
          result.push({
            title: (
              <Link to={`/${PathKeyEnum.Dashboard}`} className="text-base capitalize">
                {PathKeyEnum.Dashboard}
              </Link>
            )
          });
        }
        if (index === pathnames.length - 1) {
          result.push({
            title: (
              <span className="text-base capitalize">{PathLabelEnum[name as keyof typeof PathLabelEnum] || name}</span>
            )
          });
        } else {
          result.push({
            title: (
              <Link to={`/${pathnames.slice(0, index + 1).join('/')}`} className="text-base capitalize">
                {name}
              </Link>
            )
          });
        }
      });
    }
    return result;
  }, [location]);

  return <Breadcrumb items={items}></Breadcrumb>;
};

export default BreadCrumb;
