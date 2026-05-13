import { Router } from 'express';
import { verifyToken } from '../middleware/auth';
import {
  getMyVacations,
  getAuthorizationDashboard,
  processAuthorizationAction,
  requestTimeOff,
  getAbsenceCalendar,
  getEmployeesList,
  generateReport,
} from '../controllers/rh.controller';

const router = Router();

router.use(verifyToken);

router.get('/my-vacations', getMyVacations);
router.get('/authorization/dashboard', getAuthorizationDashboard);
router.post('/authorization/action', processAuthorizationAction);
router.post('/request-time-off', requestTimeOff);
router.get('/calendar-events', getAbsenceCalendar);
router.get('/employees-list', getEmployeesList);
router.post('/reports/generate', generateReport);

export default router;
