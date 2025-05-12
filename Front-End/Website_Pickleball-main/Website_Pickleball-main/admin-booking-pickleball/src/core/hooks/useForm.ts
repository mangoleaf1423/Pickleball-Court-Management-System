import Form, { FormInstance, FormListFieldData } from 'antd/lib/form';
import { t } from 'i18next';
import { isEqual } from 'lodash';
import { FieldData } from 'rc-field-form/lib/interface';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';

import { CommonHelper } from '@/utils/helpers';

type UseFormProps<T extends Yup.AnyObject> = {
  form?: FormInstance<T>;
  schema: Yup.ObjectSchema<T> | null;
  onSubmit: (data: T | null, error: FormListFieldData | null) => void | Promise<void>;
  validationOnChange?: boolean;
};

type UseFormTypes<T> = {
  formField: {
    form: FormInstance<T>;
    onFinish: (values: T) => void | Promise<void>;
    onFieldsChange: (changedFields: FieldData[]) => void;
  };
};

const generateError = (item: any) => {
  const { key, label, value, type } = item;
  if (!key) return item;
  let errorStr = '';
  if (label) {
    errorStr += label;
  }
  errorStr = `${errorStr} ${t(key, { value, type })}`;
  return errorStr?.trim();
};

export default function useForm<T extends Record<string, any>>({
  form: propsForm,
  schema,
  onSubmit,
  validationOnChange = true
}: UseFormProps<T>): UseFormTypes<T> {
  const [form] = Form.useForm<T>(propsForm);
  const { getFieldsValue } = form;
  const { t } = useTranslation();

  const [filedName, setFieldName] = useState<string[][]>([]);
  const [validateAgain, setValidateAgain] = useState(false);
  const [validated, setValidated] = useState(false);

  const onFieldsChange = useCallback(
    (changedFields: FieldData[]) => {
      if (!validationOnChange) return;
      changedFields.forEach(({ name }) => {
        const fieldName = CommonHelper.fieldArrayToString(name as (string | number)[]);
        schema
          ?.validateAt(fieldName, getFieldsValue())
          .then(() => {
            form.setFields([{ name, errors: [] }]);
            setFieldName(filedName.filter((item) => !isEqual(item, name)));
          })
          .catch((e) => {
            form.setFields([
              {
                name: e.path,
                errors: e.errors?.map((item: any) => {
                  return generateError(item);
                })
              }
            ]);
            setFieldName((preFieldName) => [...preFieldName, [e.path]]);
          });
      });
    },
    [filedName, getFieldsValue, schema, validationOnChange, form]
  );

  const validateMapErrorToFields = useCallback((e: any) => {
    const fieldNames: string[][] = [];
    const res = e?.inner?.map(({ path, errors }: { path: any; errors: any[] }) => {
      const name = path
        .replace(/[[]/g, '.')
        .replace(/[\]]/g, '')
        .split('.')
        .map((p: string) => (/^\d+$/.test(p) ? Number(p) : p));
      fieldNames.push(name);
      return {
        name,
        errors: errors.map((item) => {
          return generateError(item);
        })
      };
    }) ?? [{ errors: [e?.message] }];
    setFieldName(fieldNames);
    return res;
  }, []);

  useEffect(() => {
    if (validateAgain && !validated) {
      filedName.forEach((field) => {
        const fieldNameString = CommonHelper.fieldArrayToString(field);
        schema?.validateAt(fieldNameString, getFieldsValue()).catch((e) => {
          form.setFields([{ name: field, errors: e.errors.map((item: any) => generateError(item)) }]);
        });
      });
      setValidated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filedName, schema, form, getFieldsValue, validateAgain, validated]);

  useEffect(() => {
    setValidateAgain(true);
    setValidated(false);
  }, [t]);

  const onFinish = useCallback(
    (data: T) => {
      if (!schema) return onSubmit(data, null);

      schema
        .validate(data, { abortEarly: false })
        .then(() => onSubmit(data, null))
        .catch((e) => {
          const fields = validateMapErrorToFields(e);
          form.setFields(fields);
          onSubmit(null, e);
        });
    },
    [onSubmit, schema, form, validateMapErrorToFields]
  );

  return {
    formField: { form, onFinish, onFieldsChange }
  };
}
