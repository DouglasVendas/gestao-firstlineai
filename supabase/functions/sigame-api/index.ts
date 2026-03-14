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
    // Apenas POST é aceito para emissão
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Parse do payload vindo do cliente ou via trigger/webhook interno (ex: "Emita NF para Fatura #123")
    const { invoice_id } = await req.json()

    if (!invoice_id) {
      return new Response(JSON.stringify({ error: "Missing invoice_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log(`Iniciando fluxo de emissão NF Sigame para Fatura: ${invoice_id}`)

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string
    const sigameApiToken = Deno.env.get("SIGAME_API_TOKEN") as string

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not found")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Obter dados da Fatura e Cliente do Banco
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        clients (
          name,
          email,
          -- Adicionar campos de endereco/documento caso existirem na base
          status
        )
      `)
      .eq("id", invoice_id)
      .single()

    if (invoiceError || !invoice) {
      throw new Error(`Invoice não encontrada: ${invoiceError?.message}`)
    }

    const client = invoice.clients

    // 2. Montar Payload no formato que a Sigame.digital exige
    // (Esta é uma estrutura teórica da API Sigame, devendo ser adaptada a doc oficial)
    const sigamePayload = {
      valor_total: invoice.value,
      data_competencia: invoice.paid_date || new Date().toISOString().split('T')[0],
      tomador: {
        nome_razao_social: client.name,
        email: client.email || "contato@empresa.com",
        // cpf_cnpj: client.documento, // Necessario puxar do seu banco caso estenda
      },
      servico: {
        discriminacao: `Referente a prestação de serviços cobrada na fatura ${invoice.id}.`,
        // codigo_tributacao_nacional: "01.01", 
      }
    }

    // 3. Disparar API para Sigame
    console.log("Payload Sigame:", JSON.stringify(sigamePayload))

    // Simulação do Fetch para Sigame.digital
    // Descomente e passe a URL oficial de Produção assim que o token for adicionado no Supabase Vault
    /*
    const sigameReq = await fetch("https://api.sigame.digital/v1/notas-fiscais", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sigameApiToken}`
        },
        body: JSON.stringify(sigamePayload)
    })

    const sigameRes = await sigameReq.json()

    if (!sigameReq.ok) {
       throw new Error(`Erro na Sigame API: ${JSON.stringify(sigameRes)}`)
    }
    
    console.log("NF Emitida com Sucesso", sigameRes)
    */

    return new Response(JSON.stringify({
      success: true,
      message: "Nota Fiscal encaminhada para processamento (Sigame)",
      invoice_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("Erro na integração Sigame:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
