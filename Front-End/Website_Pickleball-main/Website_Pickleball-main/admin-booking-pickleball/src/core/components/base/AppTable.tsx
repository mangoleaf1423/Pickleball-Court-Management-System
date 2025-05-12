import { Table, TableProps } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Pagination } from '@/core/types';
import AppPagination from './AppPagination';

interface AppTableProps extends TableProps<any> {
  page?: number;
  pageSize?: number;
  total?: number;
  onChangePagination?: (payload: Pagination) => void;
  showPagination?: boolean;
}

const AppTable: React.FC<AppTableProps> = ({
  page = 1,
  pageSize = 10,
  total = 0,
  onChangePagination,
  showPagination = true,
  columns,
  ...props
}) => {
  const { t } = useTranslation(['common']);
  const [scrollY, setScrollY] = useState(false);
  const [widthTable] = useState(700);
  const [heightTable] = useState(500);

  useEffect(() => {
    if (props?.dataSource && props.dataSource?.length > 10) {
      setScrollY(true);
    } else {
      setScrollY(false);
    }
  }, [props?.dataSource]);

  const _columns = useMemo<ColumnsType<any>>(
    () => [
      {
        title: t(['common:no.']),
        key: 'stt',
        render(_value, _, index) {
          return (page - 1) * pageSize + index + 1;
        },
        width: 80,
        align: 'center',
        ellipsis: true
      },
      ...(columns ?? []).map((item) => ({ ...item, title: t([item.title as any]) }))
    ],
    [columns, t, page, pageSize]
  );

  return (
    <div className="flex flex-col gap-y-4">
      <Table
        rowKey={'id'}
        columns={_columns}
        {...props}
        pagination={false}
        scroll={scrollY ? { y: heightTable, x: widthTable } : { x: widthTable }}
      />
      {showPagination && (
        <AppPagination
          pageSize={pageSize}
          current={page}
          total={total}
          pageSizeOptions={[10, 20, 30]}
          showSizeChanger
          onChange={(page, size) => {
            onChangePagination && onChangePagination({ page, size });
          }}
          onShowSizeChange={(page, size) => {
            onChangePagination && onChangePagination({ page, size });
          }}
        />
      )}
    </div>
  );
};

export default AppTable;
