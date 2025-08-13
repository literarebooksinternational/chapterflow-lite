import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const transporter = nodemailer.createTransport({
  host: "smtp.literarebooks.com.br",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function solicitarAjustes(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Método não permitido" });
    }

    const { capituloId, observacao_admin } = req.body;

    if (!capituloId || !observacao_admin) {
      return res.status(400).json({ success: false, message: "Dados inválidos no corpo da requisição" });
    }

    const { data: capitulo, error } = await supabase
      .from("capitulos")
      .select(`
        id, url_arquivo, status, observacao_admin, comentario_adicional, created_at, updated_at, responsible_user_id,
        autor:autor_id(email, nome)
      `)
      .eq("id", capituloId)
      .single();

    if (error || !capitulo) {
      return res.status(404).json({ success: false, message: "Capítulo não encontrado" });
    }

    const autorEmail = capitulo.autor?.email;
    const autorNome = capitulo.autor?.nome;

    if (!autorEmail || !autorNome) {
      return res.status(500).json({ success: false, message: "Autor não encontrado." });
    }

    await supabase
      .from("capitulos")
      .update({ observacao_admin })
      .eq("id", capituloId);

    await transporter.sendMail({
      from: `"Literare Books" <${process.env.SMTP_USER}>`,
      to: autorEmail,
      subject: `Ajustes solicitados no capítulo "${capituloId}"`,
      html: `
        <p>Olá ${autorNome},</p>
        <p>O capítulo que você enviou precisa de ajustes pelo seguinte motivo:</p>
        <p><strong>${observacao_admin}</strong></p>
        <p>Por favor, revise e envie novamente.</p>
      `,
    });

    return res.status(200).json({ success: true, message: "Notificação enviada ao autor." });

  } catch (err) {
    console.error("Erro ao solicitar ajustes:", err);
    return res.status(500).json({ success: false, message: err.message || "Erro desconhecido" });
  }
}
