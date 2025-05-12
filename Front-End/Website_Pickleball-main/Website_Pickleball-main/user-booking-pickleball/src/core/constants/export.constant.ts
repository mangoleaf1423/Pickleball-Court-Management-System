import { ExportType } from '../enums';
import { SelectType } from '../types';

const EXPORT_TYPES_FORM: SelectType<ExportType>[] = [
  {
    label: 'Daily',
    value: ExportType.DAILY
  },
  {
    label: 'Monthly',
    value: ExportType.MONTHLY
  },
  {
    label: 'Yearly',
    value: ExportType.YEARLY
  }
];

const EXPORT_TYPES: SelectType<ExportType>[] = [
  {
    label: 'Manual',
    value: ExportType.MANUAL
  },
  ...EXPORT_TYPES_FORM
];

export { EXPORT_TYPES, EXPORT_TYPES_FORM };
