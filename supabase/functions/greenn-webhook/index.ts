import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Tratar preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Apenas POST é aceito para o webhook
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Parse do payload da Greenn Pagamentos
    const payload = await req.json()
    console.log("Recebido Webhook Greenn:", payload)

    // O token de serviço ignora RLS para atualizar as faturas com segurança no backend
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not found in edge function environment")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // A estrutura do evento depende da documentação exata da Greenn, mas normalmente possui 'event' ou 'type' 
    // Vamos simular a atualização de uma Fatura (Invoice)
    // Se o evento for de pagamento aprovado
    const eventType = payload.event || payload.type

    // Exemplo de payload esperado da Greenn:
    // { event: "transaction.approved", data: { transactionId: "...", metadata: { invoice_id: "..." } } }

    if (eventType === "transaction.approved" || eventType === "payment_approved") {
      const invoiceId = payload.data?.metadata?.invoice_id || payload.metadata?.invoice_id

      if (invoiceId) {
        // Atualiza a fatura para "paid"
        const { error } = await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_date: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
          })
          .eq("id", invoiceId)

        if (error) throw error

        console.log(`Fatura ${invoiceId} marcada como paga via Greenn Webhook.`)
      } else {
        console.warn("Nenhum invoice_id encontrado no metadata do payload da Greenn.")
      }
    } else if (eventType === "subscription.canceled") {
      console.log("Evento de cancelamento recebido, processar churn caso necessário.")
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("Erro no processamento do webhook:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
