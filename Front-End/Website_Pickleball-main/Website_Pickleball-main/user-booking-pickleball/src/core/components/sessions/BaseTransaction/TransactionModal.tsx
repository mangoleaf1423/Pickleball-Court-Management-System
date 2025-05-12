import { Col, Form, Modal, ModalProps, Row, Typography } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactJson from 'react-json-view';

import { FormLayoutItem, InfoItem, TTransaction, TTransactionEKYC, ViewTypeTransaction } from '@/core/types';
import { tryParseJson } from '@/utils';
import { FormatHelper } from '@/utils/helpers';
import CustomerImageGroup from '../../shared/CustomerImageGroup';
import BaseTransactionStatus from './BaseTransactionStatus';

type TransactionModalProps =
  | ModalProps & {
      viewType?: ViewTypeTransaction;
      showVerifyStatus?: boolean;
    } & (
        | {
            data?: TTransaction;
            transactionType: 'eid' | 'decode_chip' | 'ceca' | 'ekyb' | 'ssn';
          }
        | {
            transactionType: 'ekyc';
            data?: TTransactionEKYC;
          }
      );

const { Text } = Typography;

export default function TransactionModal({
  data,
  viewType,
  showVerifyStatus = false,
  transactionType,
  ...props
}: TransactionModalProps) {
  const { t } = useTranslation(['transaction']);
  const formItemLayout = useMemo<FormLayoutItem>(() => ({ labelCol: { span: 8 } }), []);

  const title = useMemo(() => {
    return (
      <div className="flex items-center gap-x-1">
        <span>Transaction Detail </span>
        <BaseTransactionStatus success={data?.status === 'success'} type="tag" />
        {showVerifyStatus && (
          <BaseTransactionStatus
            success={!!data?.is_valid_id_card || !!data?.is_matching}
            transactionType={transactionType === 'ekyc' ? 'ekyc' : 'authenticate'}
            type="tag"
          />
        )}
      </div>
    );
  }, [data?.is_matching, data?.is_valid_id_card, data?.status, showVerifyStatus, transactionType]);
  const styles = useMemo<React.CSSProperties>(
    () => ({
      overflow: 'auto',
      height: '300px',
      borderRadius: '4px',
      padding: '4px'
    }),
    []
  );
  const infosDetail = useMemo<InfoItem<TTransactionEKYC>[]>(
    () => [
      {
        label: t(['transaction:code']),
        dataIndex: 'code'
      },
      {
        label: t(['transaction:partner_name']),
        dataIndex: 'partner_name'
      },
      {
        label: t(['transaction:request_time']),
        dataIndex: 'request_time',
        render(data) {
          return FormatHelper.stringToDate(data.request_time);
        }
      },
      {
        label: t(['transaction:latency_time']),
        dataIndex: 'latency_time'
      }
    ],
    [t]
  );
  const responseTitle = useMemo(() => {
    return data?.status === 'success' ? 'Response body' : 'Exception';
  }, [data]);
  const requestBody = useMemo(() => data?.request_body && FormatHelper.tryParseJson(data.request_body), [data]);
  return (
    <Modal {...props} width={1000} footer={null} title={title} destroyOnClose>
      <div className="flex flex-col gap-y-4">
        {viewType === 'request' && (
          <>
            {transactionType === 'ekyc' && data && requestBody && (
              <div className="mt-2 flex gap-x-8">
                <CustomerImageGroup
                  items={[
                    {
                      title: t(['transaction:front_card_image']),
                      src: `data:image/png;base64,${requestBody.img1}`,
                      type: 'card',
                      show: data?.type === 'O' && requestBody.img1
                    },
                    {
                      title: t(['transaction:back_card_image']),
                      src: `data:image/png;base64,${requestBody.img2}`,
                      type: 'card',
                      show: data?.type === 'O' && requestBody.img2
                    },
                    {
                      title: t(['transaction:selfie_image']),
                      src: `data:image/png;base64,${requestBody.img1}`,
                      type: 'selfie',
                      show: data?.type === 'EL' && requestBody.img1
                    },
                    {
                      title: t(['transaction:selfie_image']),
                      src: `data:image/png;base64,${requestBody.img2}`,
                      type: 'selfie',
                      show: data?.type === 'F' && requestBody.img2
                    },
                    {
                      title: t(['transaction:chip_image']),
                      src: `data:image/png;base64,${requestBody.img1}`,
                      type: 'selfie',
                      show: data?.type === 'F' && requestBody.img1
                    },
                    {
                      title: t(['transaction:left_side_image']),
                      src: `data:image/png;base64,${requestBody.portrait_left}`,
                      type: 'selfie',
                      show: data?.type === 'L' && requestBody.portrait_left
                    },
                    {
                      title: t(['transaction:right_side_image']),
                      src: `data:image/png;base64,${requestBody.portrait_right}`,
                      type: 'selfie',
                      show: data?.type === 'L' && requestBody.portrait_right
                    },
                    {
                      title: t(['transaction:frontal_image']),
                      src: `data:image/png;base64,${requestBody.portrait_mid}`,
                      type: 'selfie',
                      show: data?.type === 'L' && requestBody.portrait_mid
                    }
                  ]}
                />
                <div className="flex-1">
                  <Form {...formItemLayout} labelAlign="left" labelWrap>
                    <Row>
                      {infosDetail.map(({ isHidden, dataIndex, label, render, size }) =>
                        isHidden ? null : (
                          <Col key={dataIndex as string} {...(size ?? { span: 24 })}>
                            <Form.Item
                              label={<Text className="!text-sm font-bold !text-gray-600">{label}</Text>}
                              className="!mb-2"
                            >
                              {((render ? render(data) : data[dataIndex]) ?? '') as string}
                            </Form.Item>
                          </Col>
                        )
                      )}
                    </Row>
                  </Form>
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 font-semibold">Request body</div>
              <ReactJson
                displayDataTypes={false}
                src={tryParseJson(data?.request_body ?? '')}
                name={false}
                theme={'flat'}
                style={styles}
              />
            </div>
            <div>
              <div className="mb-2 font-semibold">{responseTitle}</div>
              <ReactJson
                displayDataTypes={false}
                src={tryParseJson((data?.status === 'success' ? data?.response_body : data?.exception) || '')}
                name={false}
                theme={'flat'}
                style={styles}
              />
            </div>
          </>
        )}

        {viewType === 'signature' && (
          <div>
            <div className="mb-2 font-semibold">{t(['signature'])}</div>
            <ReactJson
              displayDataTypes={false}
              src={{ signature: data?.signature }}
              name={false}
              theme={'flat'}
              style={styles}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
