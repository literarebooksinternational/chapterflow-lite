import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  chapter_id: string;
  status: string;
}

const buildEmailContent = (chapter: any, status: string): { subject: string; html: string } => {
  let subject = '';
  let htmlContent = '';

  if (status === 'Aprovado') {
    subject = 'Seu capítulo foi aprovado!';
    htmlContent = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FFB319, #FFC658); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Parabéns! 🎉</h1>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            Olá <strong>${chapter.nome}</strong>,
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            Temos uma excelente notícia! Seu capítulo "<strong>${chapter.titulo_capitulo}</strong>" 
            para o livro "<strong>${chapter.livro}</strong>" foi <strong style="color: #28a745;">APROVADO</strong> 
            pela nossa equipe editorial.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">
            Em breve entraremos em contato com mais informações sobre os próximos passos.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            Equipe Editorial - Literare Books
          </p>
        </div>
      </div>
    `;
  } else if (status === 'Solicitar Ajustes') {
    subject = 'Ajustes necessários no seu capítulo enviado';
    htmlContent = `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FFB319, #FFC658); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Revisão Necessária</h1>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            Olá <strong>${chapter.nome}</strong>,
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            Recebemos o seu capítulo enviado para o livro "<strong>${chapter.livro}</strong>" 
            e ele foi analisado pela nossa equipe editorial.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
            Identificamos alguns pontos que precisam ser ajustados antes que possamos 
            seguir com o processo de aprovação.
          </p>
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0;">
            Pedimos, por gentileza, que entre em contato conosco para que possamos 
            orientar você sobre os ajustes necessários.
          </p>
          ${chapter.observacao_admin ? `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-top: 20px;">
              <p style="color: #856404; font-size: 14px; margin: 0;">
                <strong>Observações da equipe editorial:</strong><br>
                ${chapter.observacao_admin}
              </p>
            </div>
          ` : ''}
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            Equipe Editorial - Literare Books<br>
            <a href="mailto:comunicacao@literarebooks.com.br" style="color: #FFB319;">comunicacao@literarebooks.com.br</a>
          </p>
        </div>
      </div>
    `;
  }

  return { subject, html: htmlContent };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chapter_id, status }: NotificationRequest = await req.json();

    // Get chapter details
    const { data: chapter, error: chapterError } = await supabase
      .from('envios_capitulos')
      .select('*')
      .eq('id', chapter_id)
      .single();

    if (chapterError || !chapter) {
      throw new Error('Chapter not found');
    }

    // Build email content based on status
    const { subject, html } = buildEmailContent(chapter, status);

    if (!subject || !html) {
      return new Response(JSON.stringify({ message: 'No notification needed' }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    const emailResponse = await resend.emails.send({
      from: "Literare Books <onboarding@resend.dev>",
      to: [chapter.email],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
