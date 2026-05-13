import cron from 'node-cron';
import { vacationPeriodService } from '../services/vacation-period.service';
import { getDb } from '../config/db';

if (process.env.NODE_ENV !== 'production') {
  cron.schedule('0 6 * * *', async () => {
    console.log('[CRON] Iniciando prescripción diaria...');
    try {
      const result = await vacationPeriodService.expireOldPeriods();
      if (result.total > 0) {
        console.warn(`[CRON] ${result.total} período(s) prescritos. Días perdidos: ${result.days_lost}`);
      } else {
        console.log('[CRON] Sin períodos por prescribir hoy.');
      }
    } catch (err: any) {
      console.error('[CRON] Error en prescripción:', err.message);
    }
  }, { timezone: 'America/Monterrey' });

  cron.schedule('0 7 * * *', async () => {
    console.log('[CRON] Revisando notificaciones de vencimiento...');
    try {
      const pending = await vacationPeriodService.getPendingNotifications();
      if (!pending.length) {
        console.log('[CRON] Sin notificaciones pendientes.');
        return;
      }

      for (const record of pending) {
        const daysLeft = record.days_until_expiry;
        let notifType: string | null = null;
        let urgency = '';

        if (daysLeft <= 7) { notifType = '7_days'; urgency = 'CRITICO'; }
        else if (daysLeft <= 15) { notifType = '15_days'; urgency = 'URGENTE'; }
        else if (daysLeft <= 30) { notifType = '30_days'; urgency = 'AVISO'; }

        if (!notifType) continue;

        await vacationPeriodService.markNotificationSent(record.period_id, notifType);
        console.log(`[CRON] ${urgency} - ${record.employee_name}: ${record.days_remaining} días vencen en ${daysLeft} días`);
      }

      console.log(`[CRON] ${pending.length} notificación(es) procesadas.`);
    } catch (err: any) {
      console.error('[CRON] Error en notificaciones:', err.message);
    }
  }, { timezone: 'America/Monterrey' });

  cron.schedule('0 5 1 * *', async () => {
    console.log('[CRON] Sincronización mensual de períodos...');
    try {
      const db = await getDb();
      const [employees] = await db.query<any[]>('SELECT id FROM employees WHERE active = 1');
      let synced = 0;

      for (const emp of employees) {
        try {
          await vacationPeriodService.syncEmployeePeriods(emp.id);
          synced++;
        } catch (e: any) {
          console.error(`[CRON] Error sincronizando empleado ${emp.id}:`, e.message);
        }
      }

      console.log(`[CRON] ${synced}/${employees.length} empleados sincronizados.`);
    } catch (err: any) {
      console.error('[CRON] Error en sincronización mensual:', err.message);
    }
  }, { timezone: 'America/Monterrey' });

  console.log('[CRON] Jobs registrados (zona: America/Monterrey)');
} else {
  console.log('[CRON] Deshabilitados en producción (Vercel)');
}
