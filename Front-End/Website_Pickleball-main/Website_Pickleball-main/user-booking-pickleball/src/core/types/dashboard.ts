export interface MonthlyChart {
  year_number: number;
  month_number: number;
  total_success_transaction: number;
  total_fail_transaction: number;
  total_revenue: number;
}

export interface DashboardKPI {
  total_transaction: number;
  total_last_transaction: number;
  total_success_transaction: number;
  total_last_success_transaction: number;
  total_fail_transaction: number;
  total_last_fail_transaction: number;
  total_revenue: number;
  total_last_revenue: number;
  quota: number;
  remain: number;
  used: number;
}

export type DashboardChart = MonthlyChart[];

export interface DashboardTopRevenue {
  partner_id: number;
  partner_name: string;
  email: string;
  phone_number: string;
  total_revenue: number;
  total_success_transaction: number;
}

export interface Dashboard extends DashboardKPI {
  monthly_charts: MonthlyChart[];
  top_revenues: DashboardTopRevenue[];
}
