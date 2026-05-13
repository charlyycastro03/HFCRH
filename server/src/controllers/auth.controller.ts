import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db';
import { sendLoginCode } from '../services/email.service';
import { generateCode, addMinutes } from '../utils/helpers';

export async function requestLogin(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ msg: 'Email requerido' });
    return;
  }

  try {
    const db = await getDb();
    const [users] = await db.query<any[]>('SELECT id, role FROM users WHERE email = ?', [email]);
    let userId: number;

    if (users.length === 0) {
      const role = email === 'charlyycastro03@gmail.com' ? 'admin' : 'User';
      const [insertResult] = await db.query<any>(
        'INSERT INTO users (email, name, role) VALUES (?, ?, ?)',
        [email, 'Nuevo Usuario', role]
      );
      userId = insertResult.insertId;
    } else {
      userId = users[0].id;
      if (email === 'charlyycastro03@gmail.com' && users[0].role !== 'admin') {
        await db.query('UPDATE users SET role = "admin" WHERE id = ?', [userId]);
      }
    }

    const code = generateCode();
    const expiration = addMinutes(new Date(), 5);

    await db.query('UPDATE users SET login_code = ?, login_code_expires = ? WHERE id = ?', [code, expiration, userId]);

    const emailSent = await sendLoginCode(email, code);
    console.log(`[AUTH] Código ${code} enviado a ${email} - ${emailSent ? 'OK' : 'FALLO'}`);

    res.json({ msg: 'Código enviado correctamente' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ msg: 'Error en el servidor: ' + error.message });
  }
}

export async function verifyLogin(req: Request, res: Response): Promise<void> {
  const { email, code } = req.body;

  try {
    const db = await getDb();
    const [users] = await db.query<any[]>(
      `SELECT id, email, name, role FROM users
       WHERE email = ? AND login_code = ? AND login_code_expires > NOW()`,
      [email, code]
    );

    if (users.length === 0) {
      res.status(401).json({ msg: 'Código inválido o expirado' });
      return;
    }

    const user = users[0];
    await db.query('UPDATE users SET login_code = NULL WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { uid: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al validar' });
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const [users] = await db.query<any[]>(
      'SELECT id, name, email, role, photo_url FROM users WHERE id = ?',
      [req.user!.uid]
    );

    if (users.length === 0) {
      res.status(404).json({ msg: 'Usuario no encontrado' });
      return;
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener perfil' });
  }
}
