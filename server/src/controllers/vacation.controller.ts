import { Request, Response } from 'express';
import { getDb } from '../config/db';
import { calculateBusinessDays, calculateReturnDate } from '../utils/holidays';
import { calculateEntitlement } from '../utils/lft';
import { vacationPeriodService } from '../services/vacation-period.service';

export async function getEmployeeVacationInfo(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const db = await getDb();
    const [employees] = await db.query<any[]>('SELECT * FROM employees WHERE id = ?', [id]);
    if (!employees.length) {
      res.status(404).json({ msg: 'Empleado no encontrado' });
      return;
    }

    const emp = employees[0];
    const entitlement = calculateEntitlement(emp.hire_date);
    const today = new Date();

    const [restCheck] = await db.query<any[]>(
      `SELECT SUM(days_requested) as total_days FROM vacation_requests
       WHERE employee_id = ? AND type = 'REST_DAY'
       AND MONTH(start_date) = ? AND YEAR(start_date) = ? AND status != 'REJECTED'`,
      [id, today.getMonth() + 1, today.getFullYear()]
    );
    const restDaysUsed = restCheck[0]?.total_days || 0;
    const finalWorkDays = emp.work_days_per_week ?? (emp.es_arquitecto ? 5 : 6);

    res.json({
      id: emp.id,
      name: emp.name,
      hire_date: emp.hire_date,
      department: emp.department,
      vacation_days_used: emp.vacation_days_used,
      entitlement_days: entitlement,
      available_days: emp.vacation_days_available,
      work_days_per_week: finalWorkDays,
      es_arquitecto: emp.es_arquitecto,
      rest_days_used: restDaysUsed,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener info de vacaciones' });
  }
}

export async function calculateRequest(req: Request, res: Response): Promise<void> {
  const { employeeId, startDate, endDate } = req.body;
  if (!startDate || !endDate) {
    res.status(400).json({ msg: 'Fechas requeridas' });
    return;
  }

  try {
    const db = await getDb();
    const [employees] = await db.query<any[]>('SELECT work_days_per_week, es_arquitecto FROM employees WHERE id = ?', [employeeId]);
    if (!employees.length) {
      res.status(404).json({ msg: 'Empleado no encontrado' });
      return;
    }

    let workDays = employees[0].work_days_per_week ?? (employees[0].es_arquitecto ? 5 : 6);
    workDays = parseInt(workDays, 10);

    const daysRequested = calculateBusinessDays(startDate, endDate, workDays);
    const returnDate = calculateReturnDate(endDate, workDays);

    res.json({ days_requested: daysRequested, return_date: returnDate, start_date: startDate, end_date: endDate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al calcular días' });
  }
}

export async function createVacationRequest(req: Request, res: Response): Promise<void> {
  const { employee_id, request_date, start_date, end_date, days_requested, return_date, status, comments, type, descansos, descanso_dates } = req.body;
  const requestType = type || 'VACATION';

  try {
    const db = await getDb();
    const [employees] = await db.query<any[]>('SELECT name, vacation_days_available, es_arquitecto, work_days_per_week FROM employees WHERE id = ?', [employee_id]);
    if (!employees.length) {
      res.status(404).json({ msg: 'Empleado no encontrado' });
      return;
    }
    const emp = employees[0];
    const workDays = emp.work_days_per_week ?? (emp.es_arquitecto ? 5 : 6);

    if (requestType === 'REST_DAY') {
      if (!emp.es_arquitecto) {
        res.status(403).json({ msg: 'Solo los arquitectos pueden solicitar días de descanso' });
        return;
      }
      const startDateObj = new Date(start_date);
      const [limitCheck] = await db.query<any[]>(
        `SELECT SUM(days_requested) as total_days FROM vacation_requests
         WHERE employee_id = ? AND type = 'REST_DAY'
         AND MONTH(start_date) = ? AND YEAR(start_date) = ? AND status != 'REJECTED'`,
        [employee_id, startDateObj.getMonth() + 1, startDateObj.getFullYear()]
      );
      const currentUsed = limitCheck[0]?.total_days || 0;
      if (Number(currentUsed) + Number(days_requested) > 2) {
        res.status(400).json({ msg: `Límite mensual excedido. Has usado ${currentUsed} de 2 días.` });
        return;
      }
    } else if (emp.vacation_days_available < days_requested) {
      res.status(400).json({ msg: `Saldo insuficiente. Disponibles: ${emp.vacation_days_available}` });
      return;
    }

    const empName = emp.name;
    await db.query(
      `INSERT INTO vacation_requests (employee_id, employee_name, request_date, start_date, end_date, days_requested, status, comments, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, empName, request_date || new Date(), start_date, end_date, days_requested, status || 'APPROVED', comments, requestType]
    );

    if (emp.es_arquitecto && descansos && descanso_dates && descansos.length > 0 && requestType === 'VACATION') {
      for (let i = 0; i < descansos.length; i++) {
        const dDate = descanso_dates[i]
        if (dDate) {
          const dCount = calculateBusinessDays(dDate, dDate, workDays)
          await db.query(
            `INSERT INTO vacation_requests (employee_id, employee_name, request_date, start_date, end_date, days_requested, status, comments, type)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [employee_id, empName, new Date(), dDate, dDate, dCount, 'APPROVED', 'Descanso arquitecto - ' + descansos[i], 'REST_DAY']
          )
        }
      }
    }

    if ((status === 'APPROVED' || !status) && requestType === 'VACATION') {
      await db.query('UPDATE employees SET vacation_days_available = vacation_days_available - ? WHERE id = ?', [days_requested, employee_id]);
    }

    res.json({ msg: 'Solicitud creada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear solicitud' });
  }
}

export async function getRequestsByEmployee(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const db = await getDb();
    const [requests] = await db.query<any[]>(
      'SELECT * FROM vacation_requests WHERE employee_id = ? ORDER BY request_date DESC',
      [id]
    );
    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener historial' });
  }
}

export async function uploadSignedRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { fileBase64 } = req.body;

  if (!fileBase64) {
    res.status(400).json({ msg: 'No file provided' });
    return;
  }

  if (!fileBase64.startsWith('data:application/pdf;base64,')) {
    res.status(400).json({ msg: 'Solo se permiten PDFs' });
    return;
  }

  const padding = (fileBase64.match(/=/g) || []).length;
  const sizeInBytes = fileBase64.length * 0.75 - padding;
  if (sizeInBytes / (1024 * 1024) > 5) {
    res.status(400).json({ msg: 'El archivo excede el límite de 5 MB' });
    return;
  }

  try {
    const db = await getDb();
    const [requests] = await db.query<any[]>('SELECT id, status FROM vacation_requests WHERE id = ?', [id]);
    if (!requests.length) {
      res.status(404).json({ msg: 'Solicitud no encontrada' });
      return;
    }

    await db.query("UPDATE vacation_requests SET signed_file_path = ?, status = 'FIRMADO' WHERE id = ?", [fileBase64, id]);
    res.json({ msg: 'PDF subido correctamente. Solicitud marcada como LISTA.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al subir archivo' });
  }
}

export async function deleteRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const db = await getDb();
    const [requests] = await db.query<any[]>('SELECT * FROM vacation_requests WHERE id = ?', [id]);
    if (!requests.length) {
      res.status(404).json({ msg: 'Solicitud no encontrada' });
      return;
    }

    const request = requests[0];
    if (request.status === 'APPROVED' && request.type === 'VACATION') {
      await db.query(
        'UPDATE employees SET vacation_days_available = vacation_days_available + ?, vacation_days_used = vacation_days_used - ? WHERE id = ?',
        [request.days_requested, request.days_requested, request.employee_id]
      );
    }

    await db.query('DELETE FROM vacation_requests WHERE id = ?', [id]);
    res.json({ msg: 'Solicitud eliminada y días reembolsados' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al eliminar solicitud' });
  }
}

export async function getVacationReport(req: Request, res: Response): Promise<void> {
  const { month, year, employeeId, department } = req.query;

  try {
    const db = await getDb();
    let query = `SELECT vr.*, e.department FROM vacation_requests vr JOIN employees e ON vr.employee_id = e.id WHERE 1=1`;
    const params: any[] = [];

    if (employeeId) { query += ' AND vr.employee_id = ?'; params.push(employeeId); }
    if (department) { query += ' AND e.department = ?'; params.push(department); }
    if (month && year) { query += ' AND MONTH(vr.start_date) = ? AND YEAR(vr.start_date) = ?'; params.push(month, year); }
    else if (year) { query += ' AND YEAR(vr.start_date) = ?'; params.push(year); }

    query += ' ORDER BY vr.start_date DESC';
    const [results] = await db.query(query, params);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al generar reporte' });
  }
}
