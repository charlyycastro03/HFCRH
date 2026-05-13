export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'hr' | 'User'
  photo_url?: string
  created_at?: string
}

export interface Employee {
  id: number
  name: string
  department: string | null
  hire_date: string | null
  birth_date: string | null
  vacation_days_available: number
  vacation_days_used: number
  es_arquitecto: boolean | number
  work_days_per_week: number
  user_id: number | null
}

export interface VacationRequest {
  id: number
  employee_name: string | null
  employee_id: number
  request_date: string
  start_date: string
  end_date: string
  days_requested: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  type: 'VACATION' | 'REST_DAY' | 'CASH_OUT'
  comments: string | null
  signed_file_path: string | null
  created_at: string
}

export interface VacationPeriod {
  id: number
  employee_id: number
  period_year: number
  start_date: string
  end_date: string
  expiry_date: string
  days_granted: number
  days_taken: number
  days_remaining: number
  status: 'active' | 'expired' | 'exhausted'
  alert_level?: string
  days_until_expiry?: number
}

export interface VacationSummary {
  name: string
  hire_date: string
  work_days_per_week: number
  es_arquitecto: boolean
  rest_days_used: number
  total_days_available: number
  entitlement_days: number
  total_days_used: number
  periods: VacationPeriod[]
}

export interface VacationAlert {
  employee_id: number
  employee_name: string
  department: string
  period_id: number
  period_year: number
  days_remaining: number
  expiry_date: string
  days_until_expiry: number
  alert_level: 'critical' | 'urgent' | 'warning' | 'info'
}

export interface DashboardStats {
  totalEmployees: number
  activeVacations: number
  pendingRequests: number
}

export interface CalendarEvent {
  id: number
  title: string
  start: string
  end: string
  color: string
  allDay: boolean
}
