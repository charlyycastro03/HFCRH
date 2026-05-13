import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { importEmployees } from '../controllers/import.controller';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getUpcomingBirthdays } from '../controllers/employee.controller';
import { getDashboardStats, getCalendarEvents } from '../controllers/dashboard.controller';
import { verifyToken, requireRole } from '../middleware/auth';
import { vacationPeriodService } from '../services/vacation-period.service';
import { getDb } from '../config/db';

const router = Router();

router.use(verifyToken);

router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/events', getCalendarEvents);
router.get('/birthdays', getUpcomingBirthdays);

router.use(requireRole(['admin']));

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

router.post('/import-employees', importEmployees);

router.post('/sync-all', async (req, res) => {
  try {
    const db = await getDb();
    const [emps] = await db.query<any[]>('SELECT id FROM employees');
    let synced = 0;
    for (const emp of emps) {
      await vacationPeriodService.syncEmployeePeriods(emp.id);
      synced++;
    }
    res.json({ success: true, synced, msg: `${synced} empleados sincronizados` });
  } catch (err: any) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

export default router;
