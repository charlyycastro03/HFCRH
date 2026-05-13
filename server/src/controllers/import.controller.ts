import { Request, Response } from 'express';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { getDb } from '../config/db';

const EXCEL_PATH = path.join(__dirname, '..', '..', '..', 'Empleados.xlsx');

export async function importEmployees(req: Request, res: Response): Promise<void> {
  try {
    if (!fs.existsSync(EXCEL_PATH)) {
      res.status(404).json({ msg: `Archivo Excel no encontrado en ${EXCEL_PATH}` });
      return;
    }

    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);
    const db = await getDb();

    let insertedCount = 0;
    let updatedCount = 0;

    for (const row of rawData) {
      const name = row['Nombre_Empleado'];
      const department = row['Departamento'] || 'Sin Departamento';
      let hireDate = row['Fecha_de_ingreso'];

      if (typeof hireDate === 'number') {
        hireDate = new Date(Math.round((hireDate - 25569) * 86400 * 1000));
      } else if (typeof hireDate === 'string') {
        hireDate = new Date(hireDate);
      }
      if (isNaN(hireDate)) hireDate = null;

      const esArquitecto = (row['Es_Arquitecto'] === 'SI' || row['Es_Arquitecto'] === 'si' || row['Es_Arquitecto'] === true || row['Es_Arquitecto'] === 1) ? 1 : 0;

      if (!name) continue;

      const [existing] = await db.query<any[]>('SELECT id FROM employees WHERE name = ?', [name]);

      if (existing.length > 0) {
        await db.query('UPDATE employees SET department = ?, hire_date = ?, es_arquitecto = ? WHERE id = ?',
          [department, hireDate, esArquitecto, existing[0].id]);
        updatedCount++;
      } else {
        await db.query('INSERT INTO employees (name, department, hire_date, es_arquitecto) VALUES (?, ?, ?, ?)',
          [name, department, hireDate, esArquitecto]);
        insertedCount++;
      }
    }

    res.json({ msg: 'Importación completada', details: `Insertados: ${insertedCount}, Actualizados: ${updatedCount}`, totalProcessed: rawData.length });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ msg: 'Error al importar: ' + error.message });
  }
}
