import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.header('Authorization');
  if (!token) {
    res.status(401).json({ msg: 'Acceso denegado' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(400).json({ msg: 'Token inválido' });
  }
}

export function requireRole(roles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ msg: 'Autenticación requerida' });
      return;
    }
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    const userRole = req.user.role?.toLowerCase() || '';
    const hasRole = allowedRoles.some((r) => r.toLowerCase() === userRole);

    if (!hasRole) {
      res.status(403).json({ msg: 'No tienes permisos para esta acción' });
      return;
    }
    next();
  };
}
