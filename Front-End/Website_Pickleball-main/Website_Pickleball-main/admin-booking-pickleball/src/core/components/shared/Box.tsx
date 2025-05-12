import React from 'react';
import { twMerge } from 'tailwind-merge';

interface BoxProps {
  children: React.ReactNode;
  className?: string;
}

const Box: React.FC<BoxProps> = ({ children, className }) => {
  return <div className={twMerge('w-full rounded-xl bg-white p-8 shadow-lg', className)}>{children}</div>;
};

export default Box;
