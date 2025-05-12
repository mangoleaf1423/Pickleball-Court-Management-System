import React from 'react';

type MainLayoutProps = {
  children?: React.ReactNode;
  filter?: React.ReactNode;
  extra?: React.ReactNode;
  title?: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, filter, extra, title }) => {
  return (
    <div className="flex flex-col gap-y-4">
      {title && <h1 className="xs:text-xl text-skin-base font-bold sm:text-2xl">{title}</h1>}
      {(filter || extra) && (
        <div className="flex items-center justify-between gap-x-2">
          <div className="flex-1">{filter}</div>
          {extra}
        </div>
      )}
      {children}
    </div>
  );
};

export default MainLayout;
