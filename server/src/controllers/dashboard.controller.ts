import { Request, Response } from 'express';
import { getDb } from '../config/db';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();

    const [totalEmpResult] = await db.query<any[]>('SELECT COUNT(*) as count FROM employees');
    const totalEmployees = totalEmpResult[0].count;

    const [activeVacResult] = await db.query<any[]>(
      `SELECT COUNT(*) as count FROM vacation_requests vr
       WHERE vr.signed_file_path IS NOT NULL AND vr.signed_file_path != ''
       AND vr.status IN ('APPROVED', 'Autorizado')`
    );
    const activeVacations = activeVacResult[0].count;

    const [pendingResult] = await db.query<any[]>(
      `SELECT COUNT(*) as count FROM vacation_requests vr
       WHERE (vr.signed_file_path IS NULL OR vr.signed_file_path = '')
       AND vr.status IN ('APPROVED', 'Autorizado')`
    );
    const pendingRequests = pendingResult[0].count;

    res.json({ totalEmployees, activeVacations, pendingRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener estadísticas' });
  }
}

export async function getCalendarEvents(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const [results] = await db.query<any[]>(
      `SELECT r.id, r.employee_name as title, r.start_date as start, r.end_date as end_date, 'primary' as color
       FROM vacation_requests r WHERE r.status = 'APPROVED'`
    );

    const events = results.map((ev: any) => ({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end_date,
      color: 'primary',
      allDay: true,
    }));

    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener eventos del calendario' });
  }
}
