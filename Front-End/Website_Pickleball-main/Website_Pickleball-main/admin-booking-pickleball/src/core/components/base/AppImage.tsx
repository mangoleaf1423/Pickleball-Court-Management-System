import { Image, ImageProps } from 'antd';
import React from 'react';

import { NO_IMAGE_BASE64 } from '@/core/constants';

type AppImageProps = ImageProps;

const AppImage: React.FC<AppImageProps> = ({ ...props }) => {
  return <Image fallback={NO_IMAGE_BASE64} {...props} />;
};

export default AppImage;
