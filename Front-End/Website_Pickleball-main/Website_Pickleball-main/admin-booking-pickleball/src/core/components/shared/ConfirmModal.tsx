import { Modal, ModalProps } from 'antd';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AppButton from '../base/AppButton';

type ConfirmModalProps = ModalProps & {
  onConfirm: (callback: () => void) => void | Promise<void>;
  onCancel: () => void;
  description?: React.ReactNode;
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, onCancel, onConfirm, description, ...props }) => {
  const { t } = useTranslation(['button']);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const callback = useCallback(() => {
    setConfirmLoading(false);
    onCancel();
  }, [onCancel]);

  const handleDelete = () => {
    setConfirmLoading(true);
    onConfirm(callback);
  };

  const afterClose = () => {
    setConfirmLoading(false);
  };
  return (
    <Modal open={open} onCancel={onCancel} footer={null} width={500} afterClose={afterClose} {...props}>
      <div className="flex flex-col items-center gap-x-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-200">
          <i className="fa-regular fa-triangle-exclamation fa-lg text-red-400" />
        </span>
        <h2 className="font-semibold text-gray-600">Are you sure?</h2>
        <p className="px-4 text-center">
          {description ?? 'This action cannot be undone. All values associated with this field will be lost.'}
        </p>
        <AppButton
          type="primary"
          danger
          block
          className="my-2"
          size="large"
          onClick={handleDelete}
          loading={confirmLoading}
        >
          {t(['delete'])}
        </AppButton>
        <AppButton block size="large" onClick={onCancel} className="font-semibold" disabled={confirmLoading}>
          {t(['cancel'])}
        </AppButton>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
