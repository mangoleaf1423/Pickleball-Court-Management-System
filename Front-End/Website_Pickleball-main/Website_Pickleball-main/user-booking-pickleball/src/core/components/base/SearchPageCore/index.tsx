import { Form, TableProps } from 'antd';
import { AxiosRequestConfig } from 'axios';
import { forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AppTable from '@/core/components/base/AppTable';
import { MainLayout } from '@/core/layout';
import {
  ColumnsTableType,
  ColumnsTableTypeExcludeNull,
  FilterItem,
  IResponseList,
  Pagination,
  SearchPageCoreRef,
  SearchParamsValue
} from '@/core/types';
import { useApp } from '@/store';
import { PAGINATION_DEFAULT } from '@/utils';
import SearchPageCoreFilter from './SearchPageCoreFilter';

type SearchPageCoreProps<T> = Omit<TableProps<any>, 'columns'> & {
  filterItems?: (FilterItem | null)[];
  columns: ColumnsTableType<T>;
  loadData: (params: SearchParamsValue, config?: AxiosRequestConfig) => Promise<IResponseList<T[]>>;
  onBeforeSearch?: (params: any) => void;
  header?: React.ReactNode;
  extra?: React.ReactNode;
};

function SearchPageCoreInner<T>(
  { filterItems, columns, loadData, onBeforeSearch, header, extra, ...props }: SearchPageCoreProps<T>,
  ref: Ref<SearchPageCoreRef<T>>
) {
  const { t } = useTranslation([]);

  const { loading: _loading } = useApp();
  const [pagination, setPagination] = useState<Pagination>(PAGINATION_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T[]>([]);
  const [filter, setFilter] = useState<Record<string, any>>({ page_number: 1, page_size: 10 });
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    fetchData,
    setLoading,
    form
  }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = { ...filter, ...form.getFieldsValue(true) };
    onBeforeSearch?.(params);
    try {
      const res = await loadData(params);
      if (res.success) {
        setData(res.data ?? []);
        setPagination((pre) => ({ ...pre, page_number: res.page_number, total_elements: res.total_elements }));
      }
    } catch (error) {
      console.log('Error fetchData: ', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadData, filter, onBeforeSearch, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangePagination = (data: Pagination) => {
    setPagination((pre) => ({ ...pre, ...data }));
    setFilter((pre) => ({ ...pre, ...data }));
  };

  const resetPageNumber = () => {
    setFilter((pre) => ({ ...pre, page_number: 1 }));
  };

  const handleFilter = useCallback(() => {
    resetPageNumber();
  }, []);

  const _filter = useMemo(() => {
    if (header) return header;
    if (filterItems && filterItems.length > 0)
      return <SearchPageCoreFilter items={filterItems.filter((item) => !!item)} onFilter={handleFilter} form={form} />;
    return null;
  }, [filterItems, header, form, handleFilter]);
  const _columns = useMemo(
    () =>
      (columns.filter((item) => Boolean(item)) as ColumnsTableTypeExcludeNull<T>).map((item) => ({
        ...item,
        title: t([item.title])
      })),
    [columns, t]
  );
  return (
    <MainLayout filter={_filter} extra={extra}>
      <AppTable
        columns={_columns}
        page={pagination.page_number}
        pageSize={pagination.page_size}
        total={pagination.total_elements}
        loading={loading || _loading}
        dataSource={data}
        onChangePagination={handleChangePagination}
        {...props}
      />
    </MainLayout>
  );
}
const SearchPageCore = forwardRef(SearchPageCoreInner) as <T>(
  props: SearchPageCoreProps<T> & { ref?: Ref<SearchPageCoreRef<T>> }
) => ReturnType<typeof SearchPageCoreInner>;

export default SearchPageCore;
