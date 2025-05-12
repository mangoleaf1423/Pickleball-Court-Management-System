import { Partner } from '@/core/types';

export const calculatePercent = (current: number, lastCurrent: number): number => {
  if (!lastCurrent && !current) return 0;
  if (!lastCurrent) return 100;

  return Number((((current - lastCurrent) / lastCurrent) * 100).toFixed(1));
};

export const tryParseJson = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return { message: str };
  }
};

export const isEmpty = (obj: object) => {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }

  return true;
};

export const EnumToArrayObject = (enumConvert: { [key: number | string]: number | string }) => {
  return Object.keys(enumConvert).map((key) => {
    return {
      label: enumConvert[key as keyof typeof enumConvert],
      value: key
    };
  });
};

export const downloadFile = (data: any, fileName?: string, type?: string) => {
  const fileURL = URL.createObjectURL(
    new Blob([data], {
      type: type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
  );
  const fileLink = document.createElement('a');
  fileLink.href = fileURL;
  fileLink.setAttribute('download', fileName ?? 'File');
  document.body.appendChild(fileLink);
  fileLink.click();
};

export const formatNumber = (nb?: number | string) => {
  if (!nb || isNaN(Number(nb))) return 0;
  return new Intl.NumberFormat().format(Number(nb) || 0);
};

export const randomNumber = (min: number, max: number, nubDecimal = 0): number => {
  return Number((Math.random() * (max - min) + min).toFixed(nubDecimal));
};

export const generateRandomString = (length: number) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
};

export const getAddressPartner = (data: Partner) => {
  return `${data?.address ?? ''}, ${data?.ward_name ?? ''}, ${data?.district_name ?? ''}, ${data?.province_name ?? ''}`;
};
