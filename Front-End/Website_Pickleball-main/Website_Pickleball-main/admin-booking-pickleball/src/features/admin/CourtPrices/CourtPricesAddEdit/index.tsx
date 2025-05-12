import { useForm } from '@/core/hooks';
import { Button, Card, Col, Form, Input, Radio, Row, Select } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as yup from 'yup';

import { AppPageHeader } from '@/core/components';
import { CommonService, CourtService } from '@/core/services';
import { District, Province, Ward } from '@/core/types';
import axios from 'axios';
import { CourtManage, CreateCourtManage } from '@/core/types/court';

const schema = yup.object({
  name: yup.string().required('Tên sân không được để trống'),
  address: yup.string().required('Địa chỉ không được để trống'),
  phone: yup
    .string()
    .max(11, 'Số điện thoại chỉ có 11 số.')
    .matches(/^\+?([0-9]{1,4})?[-. ]?([0-9]{3})[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Số điện thoại không hợp lệ')
    .required('Số điện thoại không được để trống'),
  openTime: yup.string().required('Thời gian mở cửa không được để trống'),
  email: yup.string().email('Email không hợp lệ').required('Email không được để trống'),
  link: yup.string().url('Link website không hợp lệ').required('Link website không được để trống'),
  active: yup.boolean().required('Trạng thái không được để trống')
});

type CourtForm = yup.InferType<typeof schema>;

const CourtPricesAddEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation(['court_prices', 'common', 'errors', 'placeholder']);
  const {
    formField: { form, ...formProps }
  } = useForm<CourtForm>({
    schema,
    async onSubmit(values) {
      setSubmitting(true);
      try {
        const payload : CreateCourtManage = {
          name: values.name,
          address: values.address,
          phone: values.phone,
          openTime: values.openTime,
          email: values.email,
          link: values.link,
          isActive: values.active,
          managerId: null
        };

        const payload2 : CourtManage = {
          id: id || "",
          name: values.name,
          address: values.address,
          phone: values.phone,
          openTime: values.openTime,
          email: values.email,
          link: values.link,
          active: values.active
        };

        let result;
        if (!id) {
          result = await CourtService.createCourt(payload);
        } else {
          result = await CourtService.updateCourt(payload2);
        }

        if (result) {
          toast.success(t(['common:message.success']));
          navigate('/court-prices');
        } else {
          toast.error(t(['common:message.error']));
        }
      } catch (error: any) {
        console.error(error);
        toast.error(error.response?.data?.message || t(['common:message.error']));
      } finally {
        setSubmitting(false);
      }
    }
  });

  const [isLoadingData, setIsLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getCourt = useCallback(async (courtId: string) => {
    try {
      setIsLoadingData(true);
      const res = await CourtService.getCourtById(courtId);
      console.log(res)
      if (res) {
        const court = res;
        form.setFieldsValue({
          name: court.name,
          address: court.address,
          phone: court.phone,
          openTime: court.openTime,
          email: court.email,
          link: court.link,
          active: court.active
        });
      }
    } catch (error) {
      toast.error('Lỗi khi lấy thông tin sân');
    } finally {
      setIsLoadingData(false);
    }
  }, [form]);

  useEffect(() => {
    if (id) {
      getCourt(id);
    }
  }, [id, getCourt]);

  const labelButton = useMemo(() => {
    return id ? t(['common:button.save']) : t(['common:button.add']);
  }, [id, t]);

  const onBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/court-prices');
    }
  };

  return (
    <div className="relative z-10 flex flex-col gap-y-4">
      <AppPageHeader className="mb-2" onBack={onBack}>
        <span className="text-xl font-semibold">{id ? t(['edit_court_prices']) : t(['add_court_prices'])}</span>
      </AppPageHeader>
      <Form
        form={form}
        layout="vertical"
        size="middle"
        disabled={isLoadingData}
        initialValues={{
          active: true,
          openTime: '08:00'
        }}
        labelAlign="left"
        colon={false}
        {...formProps}
      >
        <Row gutter={[12, 12]}>
          <Col xl={24} sm={24} xs={24}>
            <Card title={t(['court_prices:title_court_prices'])}>
              <Row gutter={[12, 6]}>
                <Col span={12}>
                  <Form.Item label={t(['court_name'])} name="name" rules={[{ required: true }]}>
                    <Input placeholder={t(['placeholder:court_prices.court_name'])} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={t(['phone_number'])} name="phone" rules={[{ required: true }]}>
                    <Input placeholder={t(['placeholder:court_prices.phone_number'])} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label={t(['open_time'])} name="openTime" rules={[{ required: true }]}>
                    <Input placeholder={t(['placeholder:court_prices.open_time'])} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={t(['link_website'])} name="link" rules={[{ required: true }]}>
                    <Input placeholder={t(['placeholder:court_prices.link_website'])} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="Nhập email" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Trạng thái" name="active" rules={[{ required: true }]}>
                    <Radio.Group>
                      <Radio value={true}>Hoạt động</Radio>
                      <Radio value={false}>Không hoạt động</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label={t(['address'])} name="address" rules={[{ required: true }]}>
                    <Input placeholder={t(['placeholder:court_prices.address'])} />
                  </Form.Item>
                </Col>  
              </Row>
              <div className="mt-2 flex justify-end gap-x-4">
                <Button size="middle" type="text" onClick={onBack}>
                  {t(['common:button.cancel'])}
                </Button>
                <Button size="middle" type="primary" htmlType="submit" loading={submitting} disabled={isLoadingData}>
                  {labelButton}
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CourtPricesAddEdit;
