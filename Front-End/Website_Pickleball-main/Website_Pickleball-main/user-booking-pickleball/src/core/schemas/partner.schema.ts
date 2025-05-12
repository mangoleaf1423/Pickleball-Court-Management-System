export type ScheduleType = 'manual' | 'daily' | 'monthly' | 'yearly';

export type SchedulePartnerBody = {
  type: ScheduleType;
};
