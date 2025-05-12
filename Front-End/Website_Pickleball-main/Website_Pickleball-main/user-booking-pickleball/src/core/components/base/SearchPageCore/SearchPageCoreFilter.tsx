import { Col, DatePicker, Form, FormInstance, Input, Row } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FilterItem, SelectType } from '@/core/types';
import { DateFormat } from '@/utils/enums';
import AppButton from '../AppButton';
import AppSelect from '../AppSelect';
import DropdownItem from '../DropdownItem';

type SearchPageCoreFilterProps = {
  form: FormInstance<any>;
  items: FilterItem[];
  onFilter: (params: any) => void;
};

type OptionSelectType = {
  [key: string]: SelectType<any>[];
};

type LoadingSelectType = {
  [key: string]: boolean;
};

const { RangePicker } = DatePicker;

const SearchPageCoreFilter: React.FC<SearchPageCoreFilterProps> = ({ items, onFilter, form }) => {
  const { t } = useTranslation(['common', 'placeholder']);
  const [itemsShow, setItemsShow] = useState<FilterItem[]>([]);
  const [optionsSelect, setOptionsSelect] = useState<OptionSelectType>({});
  const [loadingSelect, setLoadingSelect] = useState<LoadingSelectType>({});

  const fetchOptions = useCallback(
    (items: FilterItem[]) => {
      items.forEach(async (item) => {
        if (optionsSelect[item.name]) return;
        if (item.type === 'select' && item.selectType === 'api') {
          setLoadingSelect((pre) => ({ ...pre, [item.name]: true }));
          try {
            const res: any = await item.fetchData?.();
            if (res && res?.success) {
              setOptionsSelect((pre) => ({ ...pre, [item.name]: res.data ?? [] }));
            }
          } finally {
            setLoadingSelect((pre) => ({ ...pre, [item.name]: false }));
          }
        }
      });
    },
    [optionsSelect]
  );

  const updateItems = useCallback(() => {
    const itemsFinal: FilterItem[] = [];
    items.forEach((item) => {
      if (!item.conditionDisplay) return itemsFinal.push(item);
      const keys = Object.keys(item.conditionDisplay);
      let isValid = false;

      for (const key of keys) {
        isValid = item.conditionDisplay[key] === form.getFieldValue(key);
        if (!isValid) break;
      }
      if (isValid) {
        itemsFinal.push(item);
      }
    });
    fetchOptions(itemsFinal);
    setItemsShow(itemsFinal);
  }, [form, items, fetchOptions]);

  useEffect(() => {
    updateItems();
  }, [updateItems]);

  const generateItem = useCallback(
    (item: FilterItem) => {
      switch (item.type) {
        case 'input':
          return <Input placeholder={t([item.placeholder as any])} allowClear={item.allowClear ?? true} />;
        case 'select': {
          const { options, fieldNames, optionAll, showSearch, optionFilterProp } = item;
          return (
            <AppSelect
              placeholder={t([item.placeholder as any])}
              options={
                options
                  ? options
                      .filter((item) => item.show === undefined || item.show === true)
                      .map((item) => ({ ...item, label: t([item.label as any]) as string })) ?? []
                  : optionsSelect[item.name] ?? []
              }
              optionAll={optionAll}
              allowClear={item.allowClear ?? true}
              className="w-full"
              fieldNames={fieldNames}
              loading={loadingSelect[item.name] ?? false}
              showSearch={showSearch}
              optionFilterProp={optionFilterProp}
            />
          );
        }
        case 'date':
          return (
            <DatePicker
              placeholder={t([item.placeholder as any])}
              className="w-full"
              picker={item.mode}
              allowClear={item.allowClear ?? true}
            />
          );
        case 'range-date':
          return (
            <RangePicker
              placeholder={(item.placeholder as [string, string]).map((el) => t([el as any])) as [string, string]}
              showTime
              format={DateFormat.DDMMYYYYHHmm}
              allowClear={item.allowClear ?? true}
            />
          );
        case 'dropdown': {
          return (
            <DropdownItem
              menu={{
                items: item.items
              }}
              className="w-full"
              placeholder={item.placeholder as string}
              textRender={(value) => value && item?.enumMap?.[value]}
            />
          );
        }
        default:
          break;
      }
    },
    [t, optionsSelect, loadingSelect]
  );
  const handleFinish = (values: any) => {
    onFilter(values);
  };
  const initialValues = useMemo(() => {
    return items.reduce<any>((res, current) => {
      res[current.name] = current.defaultValue;
      return res;
    }, {});
  }, [items]);
  return (
    <div>
      <Form
        name="form-filter"
        className="form-search"
        form={form}
        onFinish={handleFinish}
        initialValues={initialValues}
        onValuesChange={() => updateItems()}
      >
        <Row gutter={[12, 6]}>
          {itemsShow.map((item) => (
            <Col key={item.name} {...(item.size ?? { xl: 4, md: 5, sm: 6 })}>
              <Form.Item name={item.name}>{generateItem(item)}</Form.Item>
            </Col>
          ))}
          <Col>
            <AppButton type="primary" ghost iconType="search" htmlType="submit">
              button:search
            </AppButton>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default memo(SearchPageCoreFilter);
