import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import vacationRoutes from './routes/vacation.routes';
import rhRoutes from './routes/rh.routes';

// Cron jobs
import './cron/vacation.cron';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vacations', vacationRoutes);
app.use('/api/rh', rhRoutes);

app.get('/api', (_req, res) => {
  res.json({ status: 'API HFC OK', environment: process.env.NODE_ENV });
});

app.use('/uploads', express.static('uploads'));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ msg: 'Error interno del servidor', error: err.message });
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor HFC corriendo en puerto ${PORT}`);
  });
}

export default app;
