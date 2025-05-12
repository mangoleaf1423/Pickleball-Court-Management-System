// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck (to ignore typechecking on validation function parameters)

import { LocaleObject } from 'yup';

export const yupLocale: LocaleObject = {
  mixed: {
    default: {
      key: 'validation:invalid'
    },
    required: {
      key: 'validation:required'
    },
    notType: ({ type }) => ({
      key: 'validation:invalidType',
      type
    })
  },
  string: {
    email: {
      key: 'validation:email'
    },

    min: ({ min, label }) => ({
      key: 'validation:stringMin',
      value: min,
      label
    }),
    max: ({ max, label }) => ({
      key: 'validation:stringMax',
      value: max,
      label
    }),
    matches({ label }) {
      return { key: 'validation:invalid', label };
    }
  },
  number: {
    integer: () => ({ key: 'validation:invalidType', type: 'integer' }),
    min: ({ min }) => ({
      key: 'validation:numberMin',
      value: min
    }),
    max: ({ max }) => ({
      key: 'validation:numberMin',
      value: max
    })
  },
  boolean: {}
};
