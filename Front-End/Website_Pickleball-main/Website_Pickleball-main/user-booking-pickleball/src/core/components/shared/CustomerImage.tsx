import { Avatar, Image, Typography } from 'antd';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import AppImage from '../base/AppImage';

export type CustomerImageType = 'selfie' | 'avatar' | 'card';

type CustomerImageProps = {
  title?: string;
  className?: string;
  groupType?: CustomerImageType;
  previewItems?: string[];
  callback?: (url: string, index: number) => void;
  index: number;
  type?: CustomerImageType;
  src?: string;
};

const { Text } = Typography;

const CustomerImage: React.FC<CustomerImageProps> = ({
  title,
  className,
  groupType = 'selfie',
  previewItems,
  callback,
  index,
  type,
  src
}) => {
  const [current, setCurrent] = useState(0);
  const [localType, setLocalType] = useState<CustomerImageType>('selfie');

  const imageType = type ?? groupType;

  function getImageDimensions(base64String: string) {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = reject;
      img.src = base64String;
    });
  }
  useEffect(() => {
    if (src) {
      getImageDimensions(src) // Chuỗi base64 của bạn
        .then(({ width, height }: any) => {
          const ratio = width / height;
          console.log(`Tỉ lệ ảnh là: ${ratio}`);
          if (ratio > 1) {
            setLocalType('card');
          } else {
            setLocalType('selfie');
          }
        })
        .catch((error) => console.error('Có lỗi xảy ra:', error));
      callback?.(src, index);
    }
  }, [callback, index, src]);

  if (!src) return null;

  if (imageType === 'avatar') {
    if (!src) return null;
    return <Avatar src={src} />;
  }

  return (
    <div className="flex flex-col items-center gap-y-2">
      {!!title && (
        <Text strong ellipsis className="text-center">
          {title}
        </Text>
      )}

      {src ? (
        <div className="min-h-0 flex-1 rounded-md">
          <Image.PreviewGroup
            {...(previewItems ? { items: previewItems } : {})}
            preview={{ current, onChange: setCurrent }}
          >
            <AppImage
              src={src}
              alt={title}
              rootClassName="h-full"
              className={clsx(
                'shadow-[2px_3px_8px_rgb(0,0,0,0.2),-2px_-3px_8px_rgb(0,0,0,0.2)]',
                {
                  'aspect-3/4 !h-[132px] !w-[99px] rounded-md object-cover': localType === 'selfie',
                  'aspect-5/3 !h-[132px] !w-[200px] rounded-lg object-cover': localType === 'card'
                },
                className
              )}
              loading="lazy"
              onClick={() => setCurrent(index)}
            />
          </Image.PreviewGroup>
        </div>
      ) : null}
    </div>
  );
};

export default CustomerImage;
