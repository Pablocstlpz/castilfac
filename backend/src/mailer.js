import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "./config.js";

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
