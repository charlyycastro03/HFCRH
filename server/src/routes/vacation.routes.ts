import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth';
import { vacationPeriodService } from '../services/vacation-period.service';
import {
  getEmployeeVacationInfo,
  calculateRequest,
  createVacationRequest,
  getRequestsByEmployee,
  uploadSignedRequest,
  deleteRequest,
  getVacationReport,
} from '../controllers/vacation.controller';

const router = Router();

router.get('/alerts', verifyToken, requireRole(['admin', 'hr']), async (req, res) => {
  try {
    const threshold = parseInt(req.query.days as string) || 30;
    const alerts = await vacationPeriodService.getExpiringVacationsAlert(threshold);
    const grouped = {
      critical: alerts.filter(a => a.alert_level === 'critical'),
      urgent: alerts.filter(a => a.alert_level === 'urgent'),
      warning: alerts.filter(a => a.alert_level === 'warning'),
    };
    res.json({ success: true, data: grouped, total: alerts.length });
  } catch (err: any) {
    console.error('[Alerts]', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/employee/:id/summary', verifyToken, async (req, res) => {
  try {
    const empId = parseInt(req.params.id as string);
    if (req.user!.role !== 'admin' && req.user!.role !== 'hr' && empId !== req.user!.uid) {
      res.status(403).json({ success: false, message: 'Sin acceso' });
      return;
    }
    const data = await vacationPeriodService.getEmployeeVacationSummary(parseInt(req.params.id as string));
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/sync/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    await vacationPeriodService.syncEmployeePeriods(parseInt(req.params.id as string));
    res.json({ success: true, message: 'Períodos sincronizados' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/info/:id', verifyToken, getEmployeeVacationInfo);
router.post('/calculate', verifyToken, calculateRequest);
router.post('/requests', verifyToken, createVacationRequest);
router.get('/requests/:id', verifyToken, getRequestsByEmployee);
router.post('/requests/:id/upload', verifyToken, uploadSignedRequest);
router.delete('/requests/:id', verifyToken, deleteRequest);
router.get('/report', verifyToken, requireRole(['admin', 'hr']), getVacationReport);

export default router;
