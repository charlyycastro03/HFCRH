import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { importEmployees } from '../controllers/import.controller';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getUpcomingBirthdays } from '../controllers/employee.controller';
import { getDashboardStats, getCalendarEvents } from '../controllers/dashboard.controller';
import { verifyToken, requireRole } from '../middleware/auth';

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

export default router;
