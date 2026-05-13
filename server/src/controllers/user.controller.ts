import { Request, Response } from 'express';
import { getDb } from '../config/db';

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const db = await getDb();
    const [results] = await db.query('SELECT id, name, email, role, created_at FROM users');
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al obtener usuarios' });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const { name, email, role } = req.body;
  if (!email || !name) {
    res.status(400).json({ msg: 'Nombre y Email obligatorios' });
    return;
  }

  try {
    const db = await getDb();
    const [users] = await db.query<any[]>('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      res.status(400).json({ msg: 'El email ya está registrado' });
      return;
    }

    await db.query('INSERT INTO users (name, email, role) VALUES (?, ?, ?)', [name, email, role || 'User']);
    res.json({ msg: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear usuario' });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { name, email, role } = req.body;

  try {
    const db = await getDb();
    await db.query('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [name, email, role, id]);
    res.json({ msg: 'Usuario actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al actualizar usuario' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  try {
    const db = await getDb();
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ msg: 'Usuario eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al eliminar usuario' });
  }
}
