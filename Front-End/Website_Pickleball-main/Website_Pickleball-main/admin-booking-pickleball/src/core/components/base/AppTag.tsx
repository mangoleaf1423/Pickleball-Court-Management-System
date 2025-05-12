import { Tag, TagProps } from 'antd';
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface AppTagProps extends TagProps {
  children: React.ReactNode;
  className?: string;
}

const AppTag: React.FC<AppTagProps> = ({ children, className, ...props }) => {
  return (
    <Tag
      {...props}
      className={twMerge('!inline-block min-w-[60px] !rounded-lg !px-2 !py-1 !text-center !text-sm', className)}
    >
      {children}
    </Tag>
  );
};

export default AppTag;
