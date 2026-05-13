import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

export async function sendLoginCode(email: string, code: string): Promise<boolean> {
  const sender = `"HFC Construcciones" <${process.env.EMAIL_USER}>`;

  try {
    await transporter.sendMail({
      from: sender,
      to: email,
      subject: 'Código de Verificación - HFC Construcciones',
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;color:#333;max-width:600px;margin:auto;border:1px solid #eee;border-radius:10px;">
          <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#2196F3;margin:0;">HFC Construcciones</h2>
            <p style="color:#666;font-size:14px;margin:5px 0 0 0;">Portal Corporativo</p>
          </div>
          <hr style="border:0;border-top:1px solid #eee;">
          <p style="font-size:16px;">Has solicitado iniciar sesión en el portal. Usa el siguiente código:</p>
          <div style="background-color:#f9f9f9;padding:25px;text-align:center;border-radius:8px;margin:25px 0;">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1976D2;">${code}</span>
          </div>
          <p style="font-size:14px;color:#777;">Este código expirará en 5 minutos.</p>
          <hr style="border:0;border-top:1px solid #eee;margin-top:30px;">
          <p style="text-align:center;"><small style="color:#999;">&copy; ${new Date().getFullYear()} HFC Construcciones</small></p>
        </div>`,
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"Sistema RH" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch {
    return false;
  }
}

export function newRequestTemplate(employeeName: string, reqData: {
  typeLabel: string;
  dates: string;
  days: string;
  reason: string;
  balanceCurrent: number;
  balancePrev: number;
}): string {
  return `
    <html><body style="font-family:Arial,sans-serif;background:#f4f7f6;padding:20px;">
      <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <div style="background:#1565C0;padding:30px;text-align:center;color:white;">
          <h1>Nueva Solicitud</h1><p>Requiere Autorización</p>
        </div>
        <div style="padding:30px;">
          <p>Hola, <strong>${employeeName}</strong> ha solicitado:</p>
          <div style="background:#E3F2FD;border-left:5px solid #1565C0;padding:15px;margin-bottom:25px;border-radius:4px;">
            <b>Tipo:</b> ${reqData.typeLabel}<br>
            <b>Fechas:</b> ${reqData.dates}<br>
            <b>Días:</b> ${reqData.days}<br>
            <b>Motivo:</b> "${reqData.reason}"
          </div>
          <div style="text-align:center;margin-top:20px;">
            <a href="${process.env.FRONTEND_URL}/rh/autorizaciones" style="background:#1565C0;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Ir a Autorizar</a>
          </div>
        </div>
        <div style="background:#333;color:#999;text-align:center;padding:15px;font-size:12px;">Sistema RH HFC Construcciones</div>
      </div>
    </body></html>`;
}

export function statusUpdateTemplate(employeeName: string, status: string, notes?: string): string {
  const isApproved = status === 'APPROVED';
  const color = isApproved ? '#2e7d32' : '#c62828';
  const statusText = isApproved ? 'AUTORIZADA' : 'RECHAZADA';
  const message = isApproved
    ? 'Tu solicitud ha sido aprobada y los días se han descontado de tu saldo.'
    : 'Tu solicitud no pudo ser procesada en esta ocasión.';

  return `
    <html><body style="font-family:Arial,sans-serif;background:#f4f7f6;padding:20px;">
      <div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <div style="background:${color};padding:30px;text-align:center;color:white;">
          <h1>Solicitud ${statusText}</h1>
        </div>
        <div style="padding:30px;">
          <p>Hola <strong>${employeeName}</strong>,</p>
          <p>${message}</p>
          ${notes ? `<div style="background:#E3F2FD;border-left:5px solid #1565C0;padding:15px;border-radius:4px;"><b>Notas:</b><br>${notes}</div>` : ''}
        </div>
        <div style="background:#333;color:#999;text-align:center;padding:15px;font-size:12px;">Sistema RH HFC Construcciones</div>
      </div>
    </body></html>`;
}
