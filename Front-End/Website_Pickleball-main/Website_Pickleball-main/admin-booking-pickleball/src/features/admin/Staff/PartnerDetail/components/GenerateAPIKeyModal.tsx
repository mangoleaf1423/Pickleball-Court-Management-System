import { Modal } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

type GenerateAPIKeyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onOk: (callback: () => void) => void | Promise<void>;
};

const GenerateAPIKeyModal: React.FC<GenerateAPIKeyModalProps> = ({ isOpen, onClose, onOk }) => {
  const { t } = useTranslation(['partner']);
  const [submitting, setSubmitting] = useState(false);

  const onCancel = () => {
    onClose();
    setSubmitting(false);
  };

  const onOkConfirm = () => {
    setSubmitting(true);
    onOk(onCancel);
  };
  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={t(['partner:confirm'])}
      confirmLoading={submitting}
      onOk={onOkConfirm}
    >
      <p>{t(['partner:confirm_content'])}</p>
    </Modal>
  );
};

export default GenerateAPIKeyModal;
