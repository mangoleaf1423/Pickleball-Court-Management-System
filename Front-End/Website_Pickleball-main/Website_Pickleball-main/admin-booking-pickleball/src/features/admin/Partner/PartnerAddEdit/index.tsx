import { Button, Card, Col, DatePicker, Form, Input, Row, Select, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { AppPageHeader } from '@/core/components';
import { UserService } from '@/core/services';
import axios from 'axios';
import { useApp } from '@/store';
import dayjs from 'dayjs';

// Định nghĩa các regex pattern
const PASSWORD_PATTERN = "^(?=.{6,}$)(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};':\"\\\|,.<>/?]+$";
const USERNAME_PATTERN = "^[a-zA-Z0-9]{4,}$";
const PHONE_PATTERN = "^(\\+84|0)(3|5|7|8|9)[0-9]{8}$";

type PartnerFormValues = {
  username: string;
  email: string;
  formType?: string;
  roles: string;
  password?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dob: dayjs.Dayjs;
  courtIds: string[];
  gender?: string | null;
};

type UserResponse = {
  result: {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dob: string;
    gender: string;
    roles: Array<{ name: string }>;
    courtNames: string[];
    active?: boolean;
  }
};

const PartnerAddEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation(['partner', 'common', 'errors', 'placeholder']);
  const [form] = Form.useForm<PartnerFormValues>();
  
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [rolesList, setRolesList] = useState<{ name: string; description: string }[]>([]);
  const [courtsList, setCourtsList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useApp();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const formType = useMemo(() => (!id ? 'add' : 'edit'), [id]);

  const onFinish = async (values: PartnerFormValues) => {
    setSubmitting(true);

    try {
      const formValues = form.getFieldsValue(true);
      const payload = {
        ...formValues,
        dob: dayjs(formValues.dob).format('YYYY-MM-DD'),
        roles: [formValues.roles],
        gender: formValues.gender,
        courtIds: ['USER', 'STUDENT'].includes(formValues.roles) ? [] : formValues.courtIds
      };

      if (!id) {
        await UserService.createUser(payload);
        toast.success(t('common:message.success'));
        navigate('/partners');
      } else {
        const updatePayload = {
          id,
          username: formValues.username,
          password: formValues.password,
          firstName: formValues.firstName,
          lastName: formValues.lastName,
          dob: dayjs(formValues.dob).format('YYYY-MM-DD'),
          roles: [formValues.roles],
          email: formValues.email,
          phoneNumber: formValues.phoneNumber,
          gender: formValues.gender || null,
          courtIds: ['USER', 'STUDENT'].includes(formValues.roles) ? [] : formValues.courtIds,
          active: true
        };
        console.log("PAYLOAD", updatePayload);
        await UserService.updateUser(updatePayload);
        toast.success(t('common:message.success'));
        navigate('/partners');
      }
    } catch (error) {
      console.error('Operation failed:', error);
      toast.error(t('common:message.error'));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get('https://picklecourt.id.vn/api/identity/roles', {
          headers: { Authorization: `Bearer ${user?.result.token}` }
        });
        setRolesList(res.data.result);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error(t('common:message.error'));
      }
    };
    fetchRoles();
  }, [user, t]);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const res = await axios.get('https://picklecourt.id.vn/api/court/public/getAll', {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        });
        
        // Lọc sân theo courtNames của user nếu user có role MANAGER
        let filteredCourts = res.data;
        if (user?.result.user.roles.some((role: any) => role.name === 'MANAGER') && user?.result.user.courtNames) {
          filteredCourts = res.data.filter((court: any) => 
            user.result.user.courtNames?.includes(court.name)
          );
        }
        
        setCourtsList(filteredCourts);
      } catch (error) {
        console.error('Error fetching courts:', error);
        toast.error(t('common:message.error'));
      }
    };
    fetchCourts();
  }, [user, t]);

  useEffect(() => {
    const fetchUserData = async (userId: string) => {
      try {
        setIsLoadingData(true);
        const res = (await UserService.getUserById(userId) as unknown) as UserResponse;
        
        if (res?.result) {
          const userRole = res.result.roles?.length > 0 ? res.result.roles[0].name : '';
          setSelectedRole(userRole);
          
          form.setFieldsValue({
            ...res.result,
            roles: userRole,
            dob: res.result.dob ? dayjs(res.result.dob) : undefined,
            gender: res.result.gender,
            courtIds: (res.result.courtNames || []).map((name) => {
              const court = courtsList.find(c => c.name === name);
              return court?.id;
            }).filter(Boolean)
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error(t('common:message.error'));
      } finally {
        setIsLoadingData(false);
      }
    };
    
    if (id && courtsList.length > 0) {
      fetchUserData(id);
    }
  }, [id, form, courtsList, t]);

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    
    if (['USER', 'STUDENT'].includes(value)) {
      form.setFieldValue('courtIds', []);
    }
  };

  const labelButton = useMemo(() =>
    id ? t('common:button.save') : t('common:button.add'),
    [id, t]);

  const onBack = () => navigate('/partners');

  return (
    <div className="relative z-10 flex flex-col gap-y-4">
      <AppPageHeader className="mb-2" onBack={onBack}>
        <span className="text-xl font-semibold">{id ? t('edit_partner') : t('add_partner')}</span>
      </AppPageHeader>
      <Form
        form={form}
        layout="vertical"
        size="middle"
        disabled={isLoadingData}
        labelAlign="left"
        colon={false}
        onFinish={onFinish}
      >
        <Row gutter={[12, 12]}>
          <Col xl={8} sm={24} xs={24}>
            <Card title={t('partner:title_partner')}>
              <Form.Item name="formType" hidden>
                <Input disabled />
              </Form.Item>

              <Form.Item 
                label={t('user_name')} 
                name="username" 
                rules={[
                  { required: true, message: 'Vui lòng nhập tên người dùng!' },
                  { pattern: new RegExp(USERNAME_PATTERN), message: 'Tên người dùng phải có ít nhất 4 ký tự và chỉ chứa chữ cái và số.' }
                ]}
              >
                <Input disabled={!!id} />
              </Form.Item>

              <Form.Item 
                label={t('email')} 
                name="email" 
                rules={[
                  { 
                    type: 'email',
                    message: 'Email không hợp lệ!'
                  },
                  { 
                    required: true, 
                    message: 'Vui lòng nhập email!' 
                  }
                ]}
              >
                <Input disabled={!!id} />
              </Form.Item>

              <Form.Item 
                label={t('password')} 
                name="password" 
                hidden={formType === 'edit'}
                rules={[
                  { 
                    required: formType !== 'edit', 
                    message: 'Vui lòng nhập mật khẩu!' 
                  },
                  {
                    pattern: new RegExp(PASSWORD_PATTERN),
                    message: 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái và số!'
                  }
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>

              <Form.Item 
                label={t('roles')} 
                name="roles" 
                rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  placeholder={t('placeholder:select_roles')}
                  onChange={handleRoleChange}
                >
                  {rolesList.map(role => (
                    <Select.Option
                      key={role.name}
                      value={role.name}
                      label={role.name}
                    >
                      {role.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {/* <Form.Item label={t('status')} name="active" hidden={formType === 'add'}>
                <Radio.Group size="large" buttonStyle="solid">
                  <Radio.Button value="true">Active</Radio.Button>
                  <Radio.Button value="false">InActive</Radio.Button>
                </Radio.Group>
              </Form.Item> */}
            </Card>
          </Col>

          <Col xl={16} sm={24} xs={24}>
            <Card title={t('partner:title_company')}>
              <Row gutter={[12, 6]}>
                <Col span={12}>
                  <Form.Item 
                    label={t('partner:first_name')} 
                    name="firstName" 
                    rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                  >
                    <Input disabled={!!id} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item 
                    label={t('partner:last_name')} 
                    name="lastName" 
                    rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}
                  >
                    <Input disabled={!!id} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item 
                    label={t('partner:phone_number')} 
                    name="phoneNumber" 
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại!' },
                      { pattern: new RegExp(PHONE_PATTERN), message: 'Số điện thoại không hợp lệ! Phải bắt đầu bằng +84 hoặc 0, tiếp theo là 3, 5, 7, 8 hoặc 9 và 8 chữ số.' }
                    ]}
                  >
                    <Input disabled={!!id} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item 
                    label={t('partner:date_of_birth')} 
                    name="dob" 
                    rules={[
                      { required: true, message: 'Vui lòng chọn ngày sinh!' },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();
                          const age = dayjs().diff(value, 'year');
                          return age >= 18 
                            ? Promise.resolve() 
                            : Promise.reject('Người dùng phải từ 18 tuổi trở lên!');
                        }
                      }
                    ]}
                  >
                    <DatePicker format="DD/MM/YYYY" disabled={!!id} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label={t('partner:gender')} name="gender">
                    <Select placeholder={t('placeholder:select_gender')} disabled={!!id}>
                      <Select.Option value="MALE">Nam</Select.Option>
                      <Select.Option value="FEMALE">Nữ</Select.Option>
                      <Select.Option value="OTHER">Khác</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item 
                    label={t('partner:court_id')} 
                    name="courtIds" 
                    rules={[{ 
                      required: !!selectedRole && !['USER', 'STUDENT'].includes(selectedRole), 
                      message: 'Vui lòng chọn sân!' 
                    }]}
                    hidden={!!selectedRole && ['USER', 'STUDENT'].includes(selectedRole)}
                    tooltip={!selectedRole ? "Vui lòng chọn quyền trước khi chọn sân" : ""}
                  >
                    <Select
                      mode="multiple"
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      placeholder={!selectedRole ? "Vui lòng chọn quyền trước" : "Chọn các sân"}
                      disabled={!selectedRole || (!!selectedRole && ['USER', 'STUDENT'].includes(selectedRole))}
                      tagRender={(props) => {
                        const courtName = String(props.label) || '';
                        return (
                          <Tag closable={props.closable} onClose={props.onClose}>
                            {courtName}
                          </Tag>
                        );
                      }}
                    >
                      {courtsList.map(court => (
                        <Select.Option
                          key={court.id}
                          value={court.id}
                          label={court.name}
                        >
                          {court.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <div className="mt-2 flex justify-end gap-x-4">
                <Button size="middle" type="text" onClick={onBack}>
                  {t('common:button.cancel')}
                </Button>
                <Button size="middle" type="primary" htmlType="submit" loading={submitting}>
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

export default PartnerAddEdit;
