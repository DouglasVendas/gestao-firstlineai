import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Webhook receiver genérico para ferramentas externas:
 * - Landing page builders (Unbounce, Leadpages, Carrd)
 * - Ferramentas de email marketing (MailChimp, SendGrid)
 * - Chatbots (Intercom, Crisp)
 * - Pagamentos (Stripe)
 * 
 * O body deve conter um campo "source" indicando a origem.
 */
serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const body = await req.json();
        const source = body.source || "webhook";

        let result: any = { processed: false };

        // ─── Tipo: Lead capturado ───────────────────────────
        if (body.type === "lead" || body.type === "form_submission") {
            const { data, error } = await supabase.from("lead_captures").insert({
                name: body.name || body.data?.name || null,
                email: body.email || body.data?.email || null,
                phone: body.phone || body.data?.phone || null,
                company: body.company || body.data?.company || null,
                message: body.message || body.data?.message || null,
                form_source: source,
                utm_source: body.utm_source || body.data?.utm_source || null,
                utm_medium: body.utm_medium || body.data?.utm_medium || null,
                utm_campaign: body.utm_campaign || body.data?.utm_campaign || null,
                page_url: body.page_url || body.data?.page_url || null,
                referrer: body.referrer || null,
                metadata: body,
            }).select().single();

            if (error) throw error;
            result = { processed: true, type: "lead", lead_id: data.id };
        }

        // ─── Tipo: Pagamento confirmado (Stripe-like) ───────
        if (body.type === "payment_success" || body.type === "checkout.session.completed") {
            const email = body.customer_email || body.data?.object?.customer_email;
            if (email) {
                // Encontrar deal pelo email e marcar como ganho
                const { data: deals } = await supabase.from("deals")
                    .select("id")
                    .eq("contact_email", email)
                    .neq("stage", "closed_won")
                    .neq("stage", "closed_lost")
                    .limit(1);

                if (deals && deals.length > 0) {
                    await supabase.from("deals")
                        .update({ stage: "closed_won", updated_at: new Date().toISOString() })
                        .eq("id", deals[0].id);

                    result = { processed: true, type: "payment", deal_id: deals[0].id };
                }
            }
        }

        // ─── Tipo: Evento genérico do site ──────────────────
        if (body.type === "event" || body.type === "pageview") {
            await supabase.from("web_events").insert({
                event_type: body.event_type || body.type || "pageview",
                page_url: body.page_url || null,
                referrer: body.referrer || null,
                utm_source: body.utm_source || null,
                utm_medium: body.utm_medium || null,
                utm_campaign: body.utm_campaign || null,
                visitor_id: body.visitor_id || null,
                metadata: body,
            });
            result = { processed: true, type: "event" };
        }

        return new Response(JSON.stringify({ success: true, ...result }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
