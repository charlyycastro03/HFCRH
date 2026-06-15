import { Request, Response } from 'express';
import { getDb } from '../config/db';
import { calculateReturnDate } from '../utils/holidays';
import { vacationPeriodService } from '../services/vacation-period.service';

export async function getMyVacations(req: Request, res: Response): Promise<void> {
  try {
    const email = req.user!.email;
    const db = await getDb();

    const [employees] = await db.query<any[]>(
      `SELECT * FROM employees
       WHERE user_id = ? OR name = (SELECT name FROM users WHERE email = ? LIMIT 1)`,
      [req.user!.uid, email]
    );

    if (!employees.length) {
      res.status(404).json({ message: 'Empleado no encontrado' });
      return;
    }

    const employee = employees[0];
    const [history] = await db.query<any[]>(
      `SELECT *, type as RequestType FROM vacation_requests
       WHERE employee_id = ? ORDER BY request_date DESC`,
      [employee.id]
    );

    res.json({
      stats: {
        EmployeeID: employee.id,
        FullName: employee.name,
        Department: employee.department,
        BalanceCurrentPeriod: employee.vacation_days_available,
        BalancePreviousPeriod: 0,
      },
      history,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

export async function requestTimeOff(req: Request, res: Response): Promise<void> {
  const userEmail = req.user!.email;
  try {
    const db = await getDb();
    const [employees] = await db.query<any[]>(
      `SELECT * FROM employees WHERE name = (SELECT name FROM users WHERE email = ? LIMIT 1)`,
      [userEmail]
    );
    if (!employees.length) {
      res.status(400).json({ message: 'Perfil no encontrado' });
      return;
    }

    const employee = employees[0];
    const { type, startDate, endDate, reason } = req.body;

    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
    const [eYear, eMonth, eDay] = endDate.split('-').map(Number);

    let workDays = employee.work_days_per_week ?? (employee.es_arquitecto ? 5 : 6);
    let daysQuantity = 0;
    let currentDate = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const finalEndDate = new Date(Date.UTC(eYear, eMonth - 1, eDay));

    while (currentDate <= finalEndDate) {
      const dayOfWeek = currentDate.getUTCDay();
      let isWorkDay = true;
      if (workDays <= 6 && dayOfWeek === 0) isWorkDay = false;
      else if (workDays <= 5 && dayOfWeek === 6) isWorkDay = false;
      if (isWorkDay) daysQuantity++;
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    const retDate = calculateReturnDate(endDate, workDays);
    const retDateStr = retDate.toISOString().split('T')[0];
    await db.query(
      `INSERT INTO vacation_requests (employee_id, employee_name, request_date, start_date, end_date, days_requested, return_date, status, comments, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee.id, employee.name, new Date(), startDate, endDate, daysQuantity, retDateStr, 'PENDING', reason, type || 'VACATION']
    );

    res.json({ success: true, message: 'Solicitud enviada' });
  } catch (error: any) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

export async function getAuthorizationDashboard(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const [results] = await db.query<any[]>(
      `SELECT vr.*, e.department, e.name as EmployeeName, vr.type as RequestType
       FROM vacation_requests vr JOIN employees e ON vr.employee_id = e.id
       WHERE vr.status = 'PENDING'
       ORDER BY vr.request_date DESC`
    );
    res.json(results);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
}

export async function processAuthorizationAction(req: Request, res: Response): Promise<void> {
  const { requestId, action } = req.body;
  try {
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const db = await getDb();
    await db.query('UPDATE vacation_requests SET status = ? WHERE id = ?', [newStatus, requestId]);

    if (newStatus === 'APPROVED') {
      const [requests] = await db.query<any[]>('SELECT * FROM vacation_requests WHERE id = ?', [requestId]);
      if (requests.length > 0) {
        const reqData = requests[0];
        if (reqData.type === 'VACATION') {
          await vacationPeriodService.recordVacationTaken(reqData.employee_id, reqData.days_requested, reqData.start_date, `Aprobación solicitud #${reqData.id}`);
          await db.query(
            'UPDATE employees SET vacation_days_available = vacation_days_available - ?, vacation_days_used = vacation_days_used + ? WHERE id = ?',
            [reqData.days_requested, reqData.days_requested, reqData.employee_id]
          );
        }
      }
    }

    res.json({ success: true, newStatus });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
}

export async function getAbsenceCalendar(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const [results] = await db.query<any[]>(
      `SELECT vr.*, e.name as employee_name, e.department, vr.type as RequestType
       FROM vacation_requests vr JOIN employees e ON vr.employee_id = e.id
       WHERE vr.status = 'APPROVED'
       ORDER BY vr.start_date`
    );
    res.json(results);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
}

export async function getEmployeesList(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const [results] = await db.query<any[]>('SELECT id as EmployeeID, name as FullName FROM employees ORDER BY name');
    res.json(results);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
}

export async function generateReport(req: Request, res: Response): Promise<void> {
  const { requestType, employeeId, startDate, endDate, pdfStatus } = req.body;
  try {
    const db = await getDb();
    let query = `SELECT vr.id as RequestID, vr.employee_name as FullName, e.department as Department,
                        vr.type as RequestType, vr.days_requested as DaysQuantity,
                        vr.start_date as StartDate, vr.end_date as EndDate,
                        vr.return_date as ReturnDate,
                        vr.status as Status, vr.comments as Reason, vr.signed_file_path
                 FROM vacation_requests vr JOIN employees e ON vr.employee_id = e.id WHERE 1=1`;
    const params: any[] = [];

    if (requestType && requestType !== 'Todos') {
      const typeMap: Record<string, string> = { 'Vacaciones': 'VACATION', 'Permisos': 'REST_DAY', 'Canjes': 'CASH_OUT' };
      query += ' AND vr.type = ?';
      params.push(typeMap[requestType] || requestType);
    }
    if (employeeId) { query += ' AND vr.employee_id = ?'; params.push(employeeId); }
    if (startDate) { query += ' AND vr.start_date >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND vr.end_date <= ?'; params.push(endDate); }
    if (pdfStatus === 'SIGNED') query += " AND (vr.signed_file_path IS NOT NULL AND vr.signed_file_path != '')";
    else if (pdfStatus === 'MISSING') query += " AND (vr.signed_file_path IS NULL OR vr.signed_file_path = '')";

    query += ' ORDER BY vr.request_date DESC';
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al generar reporte' });
  }
}
