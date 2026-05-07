import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "./config.js";

export const enviarEmailVerificacion = async (to, nombre, urlVerificacion) => {
  try {
    const info = await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject: "Activa tu cuenta en CastilFac",
      html: htmlVerificacion(nombre, urlVerificacion),
    });
    console.log("Email de verificación enviado:", info.messageId);
  } catch (error) {
    console.error("Error enviando email de verificación:", error);
  }
};

const htmlVerificacion = (nombre, urlVerificacion) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Activa tu cuenta</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- Cabecera -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;margin-bottom:4px;">CastilFac</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:2px;font-weight:600;">ERP Industrial · Carpintería &amp; Vidrio</div>
          </td>
        </tr>

        <!-- Cuerpo -->
        <tr>
          <td style="background:#ffffff;padding:48px 40px 36px;">
            <div style="width:68px;height:68px;background:#eef2ff;border-radius:18px;margin:0 auto 28px;display:table;text-align:center;line-height:68px;font-size:34px;">✉️</div>
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#0f172a;text-align:center;letter-spacing:-0.4px;">Confirma tu cuenta</h1>
            <p style="margin:0 0 32px;font-size:15px;color:#64748b;text-align:center;line-height:1.65;">
              Hola, <strong style="color:#0f172a;">${nombre}</strong>. ¡Bienvenido/a a CastilFac!<br>
              Haz clic en el botón para verificar tu dirección de correo y acceder al panel de administración.
            </p>

            <!-- Caja info -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;border-left:4px solid #6366f1;border-radius:0 10px 10px 0;margin-bottom:32px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#4f46e5;text-transform:uppercase;letter-spacing:1.5px;">Acción requerida</p>
                <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">Debes confirmar tu dirección de correo para activar tu acceso. El enlace expirará en <strong>24 horas</strong>.</p>
              </td></tr>
            </table>

            <!-- Botón CTA -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
              <tr><td align="center">
                <a href="${urlVerificacion}" style="display:inline-block;padding:15px 44px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;border-radius:12px;letter-spacing:0.2px;">
                  Activar mi cuenta &rarr;
                </a>
              </td></tr>
            </table>

            <!-- Enlace alternativo -->
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Si el botón no funciona, copia este enlace:</p>
                <p style="margin:0;font-size:12px;color:#6366f1;word-break:break-all;line-height:1.5;">${urlVerificacion}</p>
              </td></tr>
            </table>

            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">Si no has solicitado esta cuenta, puedes ignorar este mensaje con total seguridad.</p>
          </td>
        </tr>

        <!-- Pie -->
        <tr>
          <td style="background:#f1f5f9;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#64748b;">CastilFac · ERP Industrial para Carpintería y Vidrio</p>
            <p style="margin:0;font-size:11px;color:#94a3b8;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const transporter = nodemailer.createTransport({
  service: "gmail", // Puedes usar otro servicio como Outlook, Yahoo, etc.
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  secure: true, // true para puerto 465
  port: 465,
  tls: {
    rejectUnauthorized: true, // Verificar certificados SSL
  },
});

export const enviarEmailRecuperacion = async (to, nombre, urlReset) => {
  try {
    const info = await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject: "Recupera tu contraseña en CastilFac",
      html: htmlRecuperacion(nombre, urlReset),
    });
    console.log("Email de recuperación enviado:", info.messageId);
  } catch (error) {
    console.error("Error enviando email de recuperación:", error);
  }
};

const htmlRecuperacion = (nombre, urlReset) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Recupera tu contraseña</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc;padding:40px 20px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;margin-bottom:4px;">CastilFac</div>
            <div style="font-size:11px;color:rgba(255,255,255,0.65);text-transform:uppercase;letter-spacing:2px;font-weight:600;">ERP Industrial · Carpintería &amp; Vidrio</div>
          </td>
        </tr>

        <tr>
          <td style="background:#ffffff;padding:48px 40px 36px;">
            <div style="width:68px;height:68px;background:#eef2ff;border-radius:18px;margin:0 auto 28px;display:table;text-align:center;line-height:68px;font-size:34px;">🔑</div>
            <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#0f172a;text-align:center;letter-spacing:-0.4px;">Recupera tu contraseña</h1>
            <p style="margin:0 0 32px;font-size:15px;color:#64748b;text-align:center;line-height:1.65;">
              Hola, <strong style="color:#0f172a;">${nombre}</strong>.<br>
              Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva.
            </p>

            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9;border-left:4px solid #6366f1;border-radius:0 10px 10px 0;margin-bottom:32px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 4px;font-size:10px;font-weight:800;color:#4f46e5;text-transform:uppercase;letter-spacing:1.5px;">Importante</p>
                <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">Este enlace es válido durante <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo.</p>
              </td></tr>
            </table>

            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
              <tr><td align="center">
                <a href="${urlReset}" style="display:inline-block;padding:15px 44px;background:#0f172a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;border-radius:12px;letter-spacing:0.2px;">
                  Crear nueva contraseña &rarr;
                </a>
              </td></tr>
            </table>

            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
              <tr><td style="padding:16px 20px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Si el botón no funciona, copia este enlace:</p>
                <p style="margin:0;font-size:12px;color:#6366f1;word-break:break-all;line-height:1.5;">${urlReset}</p>
              </td></tr>
            </table>

            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">Si no has solicitado este cambio, puedes ignorar este mensaje con total seguridad.</p>
          </td>
        </tr>

        <tr>
          <td style="background:#f1f5f9;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#64748b;">CastilFac · ERP Industrial para Carpintería y Vidrio</p>
            <p style="margin:0;font-size:11px;color:#94a3b8;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

export const enviarEmailActivacion = async (to, subject, htmlContent) => {
  console.log(subject);

  try {
    const info = await transporter.sendMail({
      from: EMAIL_USER,
      to,
      subject,
      html: htmlContent, // También puedes usar `text` en lugar de `html
    });

    console.log("Correo enviado: ", info.messageId);
  } catch (error) {
    console.error("Error enviando correo:", error);
  }
};
