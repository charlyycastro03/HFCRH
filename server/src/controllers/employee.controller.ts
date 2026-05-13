import { Request, Response } from 'express';
import { getDb } from '../config/db';

function getDaysGrantedByYear(years: number): number {
  if (years < 1) return 0;
  if (years === 1) return 12;
  if (years === 2) return 14;
  if (years === 3) return 16;
  if (years === 4) return 18;
  if (years === 5) return 20;
  return 22;
}

function calculateProportionalDays(hireDateStr: string | null): number {
  if (!hireDateStr) return 0;

  const hireDate = new Date(hireDateStr);
  const today = new Date();

  if (hireDate > today) return 0;

  let years = today.getFullYear() - hireDate.getFullYear();
  let months = today.getMonth() - hireDate.getMonth();

  if (today.getDate() < hireDate.getDate()) months--;
  if (months < 0) { months += 12; years--; }

  years = Math.max(0, years);

  const totalMonths = years * 12 + months;
  const daysPerYear = getDaysGrantedByYear(years);
  const proportionalDays = Math.round((totalMonths / 12) * daysPerYear);

  return Math.max(0, proportionalDays);
}

export async function getEmployees(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const [results] = await db.query<any[]>(
      `SELECT id, name, department, hire_date, birth_date, vacation_days_available,
              es_arquitecto, work_days_per_week, user_id
       FROM employees ORDER BY name ASC`
    );
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener empleados' });
  }
}

export async function createEmployee(req: Request, res: Response): Promise<void> {
  const { name, department, hire_date, birth_date, es_arquitecto, vacation_days_available, work_days_per_week, user_id } = req.body;
  if (!name) {
    res.status(400).json({ msg: 'El nombre es obligatorio' });
    return;
  }

  try {
    const db = await getDb();
    const isArchitect = es_arquitecto === true || es_arquitecto === 1 || es_arquitecto === 'true';
    const finalWorkDays = work_days_per_week ?? (isArchitect ? 5 : 6);
    const daysToSet = (vacation_days_available !== undefined && vacation_days_available !== null && vacation_days_available !== 0)
      ? vacation_days_available
      : calculateProportionalDays(hire_date);

    await db.query(
      `INSERT INTO employees (name, department, hire_date, birth_date, es_arquitecto, vacation_days_available, work_days_per_week, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, department, hire_date, birth_date || null, isArchitect ? 1 : 0, daysToSet, finalWorkDays, user_id || null]
    );
    res.json({ msg: 'Empleado creado correctamente', daysGranted: daysToSet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear empleado' });
  }
}

export async function updateEmployee(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, department, hire_date, birth_date, es_arquitecto, vacation_days_available, work_days_per_week, user_id } = req.body;

  try {
    const db = await getDb();
    const isArchitect = es_arquitecto === true || es_arquitecto === 1 || es_arquitecto === 'true';
    const finalWorkDays = work_days_per_week ?? (isArchitect ? 5 : 6);

    let daysToSet: number;
    if (vacation_days_available !== undefined && vacation_days_available !== null && vacation_days_available !== 0) {
      daysToSet = vacation_days_available;
    } else {
      daysToSet = calculateProportionalDays(hire_date);
    }

    await db.query(
      `UPDATE employees SET name = ?, department = ?, hire_date = ?, birth_date = ?, es_arquitecto = ?,
       vacation_days_available = ?, work_days_per_week = ?, user_id = ? WHERE id = ?`,
      [name, department, hire_date || null, birth_date || null, isArchitect ? 1 : 0, daysToSet, finalWorkDays, user_id || null, id]
    );
    res.json({ success: true, msg: 'Empleado actualizado correctamente', daysGranted: daysToSet });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Error al actualizar empleado' });
  }
}

export async function deleteEmployee(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const db = await getDb();
    const [results] = await db.query<any[]>('SELECT id FROM employees WHERE id = ?', [id]);
    if (results.length === 0) {
      res.status(404).json({ msg: 'Empleado no encontrado' });
      return;
    }

    await db.query('DELETE FROM vacation_movements WHERE period_id IN (SELECT id FROM vacation_periods WHERE employee_id = ?)', [id]);
    await db.query('DELETE FROM vacation_periods WHERE employee_id = ?', [id]);
    await db.query('DELETE FROM vacation_requests WHERE employee_id = ?', [id]);
    await db.query('DELETE FROM employees WHERE id = ?', [id]);

    res.json({ success: true, msg: 'Empleado eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, msg: 'Error al eliminar empleado' });
  }
}

export async function getUpcomingBirthdays(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const [results] = await db.query<any[]>(
      `SELECT id, name, birth_date, department, DAY(birth_date) as day, MONTH(birth_date) as month
       FROM employees WHERE birth_date IS NOT NULL
       AND (MONTH(birth_date) = MONTH(NOW()) OR MONTH(birth_date) = MONTH(DATE_ADD(NOW(), INTERVAL 1 MONTH)))
       ORDER BY MONTH(birth_date) ASC, DAY(birth_date) ASC`
    );
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener cumpleaños' });
  }
}
