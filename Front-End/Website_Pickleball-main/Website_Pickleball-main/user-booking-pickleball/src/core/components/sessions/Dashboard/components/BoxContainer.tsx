import React from 'react';
import { twMerge } from 'tailwind-merge';

interface BoxContainerProps {
  children: React.ReactNode;
  className?: string;
}

const BoxContainer: React.FC<BoxContainerProps> = ({ children, className }) => {
  return (
    <div className={twMerge('rounded-lg  bg-white px-4 py-6 shadow-[0_0_20px_rgba(8,21,66,0.05)]', className)}>
      {children}
    </div>
  );
};

export default BoxContainer;
