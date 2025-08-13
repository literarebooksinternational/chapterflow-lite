import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

async function enviarTeste() {
  const transporter = nodemailer.createTransport({
    host: "smtp.literarebooks.com.br",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Literare Books" <${process.env.SMTP_USER}>`,
      to: "comunicacao@literarebooks.com.br",
      subject: "Teste de envio",
      text: "Olá, este é um teste de envio de e-mail.",
    });
    console.log("E-mail enviado:", info.response);
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
  }
}

enviarTeste();
