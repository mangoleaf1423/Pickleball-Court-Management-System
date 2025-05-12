import { Select, SelectProps } from 'antd';
import React from 'react';

type AppSelectProps = SelectProps & {
  optionAll?: any;
};

const AppSelect: React.FC<AppSelectProps> = ({ options, optionAll, ...props }) => {
  return <Select options={optionAll ? [optionAll, ...(options ?? [])] : options} {...props} />;
};

export default AppSelect;
