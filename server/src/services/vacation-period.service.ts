import { getDb } from '../config/db';
import { getDaysGrantedByYear, calculateEntitlement } from '../utils/lft';
import { VacationSummary, User } from '../types';

export class VacationPeriodService {
  async syncEmployeePeriods(employeeId: number): Promise<void> {
    const db = await getDb();
    const [rows] = await db.query<any[]>('SELECT hire_date FROM employees WHERE id = ?', [employeeId]);
    if (!rows.length) throw new Error(`Empleado ${employeeId} no encontrado`);

    const hireDate = new Date(rows[0].hire_date);
    const today = new Date();
    let yearsCompleted = today.getFullYear() - hireDate.getFullYear();
    const monthDiff = today.getMonth() - hireDate.getMonth();
    const dayDiff = today.getDate() - hireDate.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) yearsCompleted--;

    if (yearsCompleted < 1) {
      await this.syncProporcionalPeriod(employeeId, hireDate, today);
      return;
    }

    for (let year = 1; year <= yearsCompleted; year++) {
      const daysGranted = getDaysGrantedByYear(year);
      const anniversary = new Date(hireDate);
      anniversary.setFullYear(anniversary.getFullYear() + year);
      const startDate = new Date(anniversary);
      startDate.setFullYear(startDate.getFullYear() - 1);
      const expiryDate = new Date(anniversary);

      await db.query(
        `INSERT INTO vacation_periods (employee_id, period_year, start_date, end_date, expiry_date, days_granted)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE days_granted = VALUES(days_granted)`,
        [employeeId, year, startDate.toISOString().split('T')[0], anniversary.toISOString().split('T')[0], expiryDate.toISOString().split('T')[0], daysGranted]
      );
    }
  }

  private async syncProporcionalPeriod(employeeId: number, hireDate: Date, today: Date): Promise<void> {
    const db = await getDb();
    const monthsWorked =
      (today.getFullYear() - hireDate.getFullYear()) * 12 + (today.getMonth() - hireDate.getMonth()) +
      (today.getDate() >= hireDate.getDate() ? 0 : -1);
    if (monthsWorked <= 0) return;

    const daysGranted = Math.round(12 * monthsWorked / 12);
    const nextAnniversary = new Date(hireDate);
    nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);

    await db.query(
      `INSERT INTO vacation_periods (employee_id, period_year, start_date, end_date, expiry_date, days_granted)
       VALUES (?, 0, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE days_granted = VALUES(days_granted)`,
      [
        employeeId,
        hireDate.toISOString().split('T')[0],
        nextAnniversary.toISOString().split('T')[0],
        nextAnniversary.toISOString().split('T')[0],
        daysGranted,
      ]
    );
  }

  async getEmployeeVacationSummary(employeeId: number): Promise<VacationSummary> {
    const db = await getDb();

    let [periods] = await db.query<any[]>(
      `SELECT * FROM vacation_periods WHERE employee_id = ? ORDER BY period_year DESC, start_date DESC LIMIT 1`,
      [employeeId]
    );

    if (!periods.length) {
      await this.syncEmployeePeriods(employeeId);
      const [secondTry] = await db.query<any[]>(
        `SELECT * FROM vacation_periods WHERE employee_id = ? ORDER BY period_year DESC, start_date DESC LIMIT 1`,
        [employeeId]
      );
      if (!secondTry.length) throw new Error('No se pudieron generar períodos');
      periods = secondTry;
    }

    const currentPeriod = periods[0];
    const [requestRows] = await db.query<any[]>(
      'SELECT SUM(days_requested) as total_requested FROM vacation_requests WHERE employee_id = ? AND status != "REJECTED"',
      [employeeId]
    );
    const historicTaken = parseFloat(requestRows[0]?.total_requested || 0);
    const finalAvailable = Math.max(0, parseFloat(currentPeriod.days_granted) - historicTaken);

    const [empRows] = await db.query<any[]>(
      'SELECT name, hire_date, work_days_per_week, es_arquitecto FROM employees WHERE id = ?',
      [employeeId]
    );
    if (!empRows.length) throw new Error('Empleado no encontrado');
    const emp = empRows[0];

    const now = new Date();
    const [restRows] = await db.query<any[]>(
      `SELECT SUM(days_requested) as total_rest FROM vacation_requests
       WHERE employee_id = ? AND type = 'REST_DAY'
       AND MONTH(start_date) = ? AND YEAR(start_date) = ?
       AND status != 'REJECTED'`,
      [employeeId, now.getMonth() + 1, now.getFullYear()]
    );
    const restDaysUsed = parseFloat(restRows[0]?.total_rest || 0);

    return {
      name: emp.name,
      hire_date: emp.hire_date,
      work_days_per_week: emp.work_days_per_week,
      es_arquitecto: !!emp.es_arquitecto,
      rest_days_used: restDaysUsed,
      total_days_available: finalAvailable,
      entitlement_days: currentPeriod.days_granted,
      total_days_used: historicTaken,
      periods: [currentPeriod],
    };
  }

  async getExpiringVacationsAlert(daysThreshold = 30) {
    const db = await getDb();
    const [rows] = await db.query<any[]>(
      `SELECT e.id AS employee_id, e.name AS employee_name, e.department,
              vp.id AS period_id, vp.period_year, vp.days_remaining, vp.expiry_date,
              DATEDIFF(vp.expiry_date, CURDATE()) AS days_until_expiry,
              CASE
                WHEN DATEDIFF(vp.expiry_date, CURDATE()) <= 7 THEN 'critical'
                WHEN DATEDIFF(vp.expiry_date, CURDATE()) <= 15 THEN 'urgent'
                WHEN DATEDIFF(vp.expiry_date, CURDATE()) <= 30 THEN 'warning'
                ELSE 'info'
              END AS alert_level
       FROM vacation_periods vp
       JOIN employees e ON e.id = vp.employee_id
       WHERE vp.status = 'active' AND vp.days_remaining > 0
         AND DATEDIFF(vp.expiry_date, CURDATE()) BETWEEN 0 AND ?
       ORDER BY days_until_expiry ASC, vp.days_remaining DESC`,
      [daysThreshold]
    );
    return rows;
  }

  async recordVacationTaken(
    employeeId: number,
    daysRequested: number,
    referenceDate: string,
    notes = '',
    createdBy: number | null = null
  ) {
    const db = await getDb();
    const [activePeriods] = await db.query<any[]>(
      `SELECT id, days_remaining FROM vacation_periods
       WHERE employee_id = ? AND status = 'active' AND days_remaining > 0
       ORDER BY start_date ASC`,
      [employeeId]
    );

    let remaining = daysRequested;
    for (const period of activePeriods) {
      if (remaining <= 0) break;
      const toDeduct = Math.min(remaining, parseFloat(period.days_remaining));

      await db.query('UPDATE vacation_periods SET days_taken = days_taken + ? WHERE id = ?', [toDeduct, period.id]);
      await db.query(
        `INSERT INTO vacation_movements (period_id, employee_id, movement_type, days, reference_date, notes, created_by)
         VALUES (?, ?, 'take', ?, ?, ?, ?)`,
        [period.id, employeeId, toDeduct, referenceDate, notes, createdBy]
      );
      await db.query(
        `UPDATE vacation_periods SET status = 'exhausted' WHERE id = ? AND days_remaining = 0`,
        [period.id]
      );
      remaining -= toDeduct;
    }

    if (remaining > 0) throw new Error(`Días insuficientes: faltan ${remaining} días`);
    return { success: true };
  }

  async expireOldPeriods() {
    const db = await getDb();
    await db.query('CALL sp_expire_vacation_periods()');
    const [expired] = await db.query<any[]>(
      `SELECT COUNT(*) AS total, SUM(days_remaining) AS days_lost
       FROM vacation_periods WHERE status = 'expired' AND expiry_date = CURDATE()`
    );
    return expired[0];
  }

  async markNotificationSent(periodId: number, notificationType: string) {
    const db = await getDb();
    await db.query(
      `INSERT IGNORE INTO vacation_expiry_notifications (period_id, employee_id, notification_type)
       SELECT ?, employee_id, ? FROM vacation_periods WHERE id = ?`,
      [periodId, notificationType, periodId]
    );
  }

  async getPendingNotifications() {
    const db = await getDb();
    const [rows] = await db.query<any[]>(
      `SELECT vp.id AS period_id, vp.employee_id, e.name AS employee_name, e.email,
              vp.days_remaining, vp.expiry_date,
              DATEDIFF(vp.expiry_date, CURDATE()) AS days_until_expiry
       FROM vacation_periods vp
       JOIN employees e ON e.id = vp.employee_id
       WHERE vp.status = 'active' AND vp.days_remaining > 0
         AND (
           (DATEDIFF(vp.expiry_date, CURDATE()) <= 30 AND NOT EXISTS (
             SELECT 1 FROM vacation_expiry_notifications ven WHERE ven.period_id = vp.id AND ven.notification_type = '30_days'))
           OR
           (DATEDIFF(vp.expiry_date, CURDATE()) <= 15 AND NOT EXISTS (
             SELECT 1 FROM vacation_expiry_notifications ven WHERE ven.period_id = vp.id AND ven.notification_type = '15_days'))
           OR
           (DATEDIFF(vp.expiry_date, CURDATE()) <= 7 AND NOT EXISTS (
             SELECT 1 FROM vacation_expiry_notifications ven WHERE ven.period_id = vp.id AND ven.notification_type = '7_days'))
         )
       ORDER BY days_until_expiry ASC`
    );
    return rows;
  }
}

export const vacationPeriodService = new VacationPeriodService();
