import clsx from 'clsx';
import { sortBy } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import CustomerImage, { CustomerImageType } from './CustomerImage';

type CustomerImageGroupItem = {
  title?: string;
  fileName?: string;
  type?: CustomerImageType;
  src?: string;
  show?: boolean;
};

type CustomerImageGroupProps = {
  items: CustomerImageGroupItem[];
  className?: string;
  containerClassName?: string;
  type?: CustomerImageType;
};

const CustomerImageGroup: React.FC<CustomerImageGroupProps> = ({
  items,
  className,
  containerClassName,
  type = 'selfie'
}) => {
  const [urls, setUrls] = useState<{ index: number; url: string }[]>([]);

  useEffect(() => {
    return () => {
      setUrls([]);
    };
  }, []);

  const urlSorts = useMemo(() => {
    return sortBy(urls, ['index']).map((item) => item.url);
  }, [urls]);

  const onSetUrl = useCallback((url: string, index: number) => {
    setUrls((pre) => [...pre, { index, url }]);
  }, []);
  return (
    <div className={clsx('flex flex-wrap gap-4', containerClassName)}>
      {items
        ?.filter((item) => item.show)
        .map((item, index) =>
          item.fileName || item.src ? (
            <CustomerImage
              key={index}
              {...item}
              callback={onSetUrl}
              previewItems={urlSorts}
              className={className}
              index={index}
              groupType={type}
            />
          ) : null
        )}
    </div>
  );
};

export default CustomerImageGroup;
