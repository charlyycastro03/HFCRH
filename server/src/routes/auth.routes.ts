import { Router } from 'express';
import { requestLogin, verifyLogin, getProfile } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.post('/login-request', requestLogin);
router.post('/login-verify', verifyLogin);
router.get('/profile', verifyToken, getProfile);

export default router;
