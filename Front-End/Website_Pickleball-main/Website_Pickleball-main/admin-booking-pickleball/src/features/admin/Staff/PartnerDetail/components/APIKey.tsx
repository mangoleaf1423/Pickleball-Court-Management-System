import { Button, Input, Tooltip } from 'antd';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { useRole } from '@/core/hooks';
import { PartnerService, UserService } from '@/core/services';
import { Partner } from '@/core/types';
import GenerateAPIKeyModal from './GenerateAPIKeyModal';

interface APIKeyProps {
  data: Partner | null;
}

type APIKeyInputType = 'text' | 'password';

const APIKey: React.FC<APIKeyProps> = ({ data }) => {
  const [type, setType] = useState<APIKeyInputType>('password');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKeyLocal, setAPIKeyLocal] = useState<string>(data?.api_key ?? '');
  const [openModalConfirm, setOpenModalConfirm] = useState(false);

  const { isAdmin } = useRole();

  const { t } = useTranslation(['partner', 'common']);

  const onCheck = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      toast.success(t('check_api_key'));
      setIsLoading(false);
    }, 2000);
  }, [t]);

  const onCopy = useCallback(() => {
    navigator.clipboard.writeText(apiKeyLocal);
    toast.success(t('common:message.success'));
  }, [apiKeyLocal, t]);

  const onUpdateAPIKey = async () => {
    if (!data) return;
    try {
      const res = await UserService.refreshAPIKey(data.id, true);
      if (res.apikey) {
        setAPIKeyLocal(res.apikey);
        if (isAdmin) {
          await PartnerService.updatePartner(data.id, { ...data, api_key: res.apikey });
        } else {
          await PartnerService.updateAPIKeyPartner({ api_key: res.apikey });
        }
      }
      toast.success(t('common:message.success'));
    } catch (error) {
      console.log('Error ', error);
    }
  };

  const onUpdate = () => {
    setOpenModalConfirm(true);
  };

  const onOkConfirm = async (callback: () => void) => {
    try {
      await onUpdateAPIKey();
    } finally {
      callback();
    }
  };

  return (
    <div className="flex gap-x-4 rounded-lg border border-slate-200 bg-white p-5">
      <div className="w-[180px] text-sm font-semibold">{t(['api_key'])}</div>
      <Input
        className="!w-[300px] !text-neutral-500 [&.ant-input-disabled]:!bg-gray-50"
        disabled
        value={apiKeyLocal}
        type={type}
      />
      <Tooltip title={type === 'password' ? t(['show']) : t(['hide'])}>
        <Button onClick={() => setType(type === 'password' ? 'text' : 'password')}>
          {type === 'password' && <i className="fa-solid fa-eye" />}
          {type === 'text' && <i className="fa-sharp fa-solid fa-eye-slash" />}
        </Button>
      </Tooltip>
      <Tooltip title="Copy">
        <Button onClick={onCopy}>
          <i className="fa-solid fa-copy" />
        </Button>
      </Tooltip>
      <Button type="primary" ghost loading={isLoading} onClick={onCheck}>
        {t(['test'])}
      </Button>
      <Button type="primary" ghost onClick={onUpdate}>
        Generate New API Key
      </Button>
      <GenerateAPIKeyModal isOpen={openModalConfirm} onClose={() => setOpenModalConfirm(false)} onOk={onOkConfirm} />
    </div>
  );
};

export default APIKey;
