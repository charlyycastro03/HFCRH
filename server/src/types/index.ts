export interface User {
  id: number;
  name: string;
  email: string;
  photo_url: string | null;
  role: 'admin' | 'hr' | 'User';
  login_code: string | null;
  login_code_expires: Date | null;
  created_at: Date;
}

export interface Employee {
  id: number;
  name: string;
  department: string | null;
  birth_date: Date | null;
  hire_date: Date | null;
  vacation_days_available: number;
  vacation_days_used: number;
  es_arquitecto: boolean;
  work_days_per_week: number;
  user_id: number | null;
  last_accrual_date: Date | null;
}

export interface VacationRequest {
  id: number;
  employee_name: string | null;
  employee_id: number;
  request_date: Date;
  start_date: Date;
  end_date: Date;
  days_requested: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  type: 'VACATION' | 'REST_DAY' | 'CASH_OUT';
  comments: string | null;
  signed_file_path: string | null;
  created_at: Date;
}

export interface VacationPeriod {
  id: number;
  employee_id: number;
  period_year: number;
  start_date: Date;
  end_date: Date;
  expiry_date: Date;
  days_granted: number;
  days_taken: number;
  days_remaining: number;
  status: 'active' | 'expired' | 'exhausted';
}

export interface VacationMovement {
  id: number;
  period_id: number;
  employee_id: number;
  movement_type: 'grant' | 'take' | 'return' | 'expire';
  days: number;
  reference_date: Date;
  notes: string | null;
  created_by: number | null;
}

export interface JwtPayload {
  uid: number;
  role: string;
  email: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface VacationSummary {
  name: string;
  hire_date: Date;
  work_days_per_week: number;
  es_arquitecto: boolean;
  rest_days_used: number;
  total_days_available: number;
  entitlement_days: number;
  total_days_used: number;
  periods: VacationPeriod[];
}
