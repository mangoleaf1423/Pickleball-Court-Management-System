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
  onSearchParamsChange?: (params: any) => void;
  header?: React.ReactNode;
  extra?: React.ReactNode;
};

function SearchPageCoreInner<T>(
  { filterItems, columns, loadData, onBeforeSearch, onSearchParamsChange, header, extra, ...props }: SearchPageCoreProps<T>,
  ref: Ref<SearchPageCoreRef<T>>
) {
  const { t } = useTranslation([]);

  const { loading: _loading } = useApp();
  const [pagination, setPagination] = useState<Pagination>(PAGINATION_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [data, setData] = useState<T[]>([]);
  const [filter, setFilter] = useState<Record<string, any>>({ page: 1, size: 10 });
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
    onSearchParamsChange?.(params);
    try {
      const res = await loadData(params);
      if (res) {
        if ('totalAmount' in res && 'refundAmount' in res && 'netAmount' in res) {
          console.log('Thông tin số tiền:', {
            totalAmount: res.totalAmount,
            refundAmount: res.refundAmount,
            netAmount: res.netAmount
          });
          setTotalAmount(res?.totalAmount as number);
          setRefundAmount(res?.refundAmount as number);
          setNetAmount(res?.netAmount as number);
        }

        // Xử lý dữ liệu nhận được
        console.log('res', res);
        if (res.data) {
          setData(res.data);
        } else if ('orders' in res) {
          setData(res.orders as unknown as T[]);
        } else if ('transactions' in res) {
          setData(res.transactions as unknown as T[]);
        } else if ('users' in res) {
          setData(res.users as unknown as T[]);
        } else if ('result' in res) {
          setData(res.result as unknown as T[]);
        } else if (res) {
          setData(res as unknown as T[]);
        }

        setPagination((pre) => ({ ...pre, page: params.page, totalElements: res.totalElements }));
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
    } finally {
      setLoading(false);
    }
  }, [loadData, filter, onBeforeSearch, onSearchParamsChange, form]);

  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      if (isMounted) {
        await fetchData();
      }
    };
    
    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, [filter]);

  const handleChangePagination = (data: Pagination) => {
    setPagination((pre) => ({ ...pre, ...data }));
    setFilter((pre) => ({ ...pre, ...data }));
  };

  const resetPageNumber = () => {
    setFilter((pre) => ({ ...pre, page: 1 }));
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
    <>
      {totalAmount !== 0 && refundAmount !== 0 && netAmount !== 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { value: totalAmount, label: "Tổng doanh thu", color: "green" },
            { value: refundAmount, label: "Hoàn tiền", color: "red" },
            { value: netAmount, label: "Doanh thu thực", color: "blue" },
          ].map((card, index) => (
            <div
              key={index}
              className={`bg-white p-6 rounded-lg shadow-sm border-l-4 border-${card.color}-500`}
            >
              <div className="text-gray-500 text-sm font-medium mb-2">{card.label}</div>
              <div className="text-2xl font-bold text-gray-900">
                {card.value.toLocaleString()}
                <span className="text-sm text-gray-500 ml-1">VND</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <MainLayout filter={_filter} extra={extra}>
        <AppTable
          columns={_columns}
          page={pagination.page}
          pageSize={pagination.size}
          total={pagination.totalElements}
          loading={loading}
          dataSource={data}
          onChangePagination={handleChangePagination}
          {...props}
        />
      </MainLayout>
    </>
  );
}
const SearchPageCore = forwardRef(SearchPageCoreInner) as <T>(
  props: SearchPageCoreProps<T> & { ref?: Ref<SearchPageCoreRef<T>> }
) => ReturnType<typeof SearchPageCoreInner>;

export default SearchPageCore;
