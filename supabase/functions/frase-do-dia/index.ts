// supabase/functions/frase-do-dia/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// ✅ Define os cabeçalhos de permissão (o "treinamento" do nosso porteiro)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // ✅ Responde à "ligação de verificação" (preflight request) do navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const response = await fetch("https://zenquotes.io/api/today");
    if (!response.ok) throw new Error("A API de frases não respondeu.");
    
    const data = await response.json();
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})