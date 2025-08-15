console.log("📩 Corpo da requisição:", req.body);

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import supabase from "../../lib/supabaseClient.js";

dotenv.config();

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
    console.log("📩 Requisição recebida:", req.body);

    if (req.method !== "POST") {
      return res
        .status(405)
        .json({ success: false, message: "Método não permitido" });
    }

    const { id, observacao_admin } = req.body;

      if (!id || !observacao_admin) {
      return res.status(400).json({
      success: false,
      message: "ID do capítulo e observacao_admin são obrigatórios",
        });
      }

    const { data: capitulo, error: fetchError } = await supabase
      .from("envios_capitulos")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !capitulo) {
      console.error("❌ Erro ao buscar capítulo:", fetchError);
      return res
        .status(404)
        .json({ success: false, message: "Capítulo não encontrado" });
    }

    const { email, nome, titulo_capitulo } = capitulo;

    if (!email || !nome) {
      return res.status(500).json({
        success: false,
        message: "Autor com e-mail ou nome inválido",
      });
    }

    const { error: updateError } = await supabase
      .from("envios_capitulos")
      .update({
        observacao_admin,
        status: "Solicitar Ajustes",
      })
      .eq("id", id);

    if (updateError) {
      console.error("❌ Erro ao atualizar capítulo:", updateError);
      return res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar capítulo" });
    }

    const emailOptions = {
      from: `"Literare Books" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Ajustes solicitados no capítulo "${titulo_capitulo}"`,
      html: `
        <p>Olá ${nome},</p>
        <p>O capítulo que você enviou precisa de ajustes pelo seguinte motivo:</p>
        <p><strong>${observacao_admin}</strong></p>
        <p>Por favor, revise e envie novamente.</p>
      `,
    };

    await transporter.sendMail(emailOptions);
    console.log(`✅ E-mail enviado para ${email}`);

    return res.status(200).json({
      success: true,
      message: "Notificação enviada ao autor.",
    });
  } catch (err) {
    console.error("❌ Erro ao solicitar ajustes:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Erro desconhecido" });
  }
}
