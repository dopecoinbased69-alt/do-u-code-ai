import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are CodeForge AI, a professional-grade HTML/CSS/JS code generator. You specialize in creating complete, self-contained HTML files.

RULES:
- ALWAYS return a COMPLETE, valid HTML document (<!DOCTYPE html> to </html>)
- Include all CSS inline in <style> tags
- Include all JavaScript inline in <script> tags
- Support Three.js (CDN: https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js)
- Support Babylon.js (CDN: https://cdn.babylonjs.com/babylon.js)
- Use modern, clean, professional code with smooth animations
- ONLY output the HTML code, nothing else. No markdown, no explanations.
- If given existing code and asked to iterate, modify it preserving structure.`;

type ProviderId = "lovable" | "openai" | "anthropic" | "gemini" | "groq";

interface ProviderSpec {
  id: ProviderId;
  label: string;
  envKey: string;
  defaultModel: string;
}

const PROVIDERS: ProviderSpec[] = [
  { id: "lovable", label: "Lovable AI", envKey: "LOVABLE_API_KEY", defaultModel: "google/gemini-3-flash-preview" },
  { id: "openai", label: "OpenAI", envKey: "OPENAI_API_KEY", defaultModel: "gpt-4o-mini" },
  { id: "anthropic", label: "Anthropic Claude", envKey: "ANTHROPIC_API_KEY", defaultModel: "claude-3-5-sonnet-latest" },
  { id: "gemini", label: "Google Gemini", envKey: "GEMINI_API_KEY", defaultModel: "gemini-2.0-flash-exp" },
  { id: "groq", label: "Groq", envKey: "GROQ_API_KEY", defaultModel: "llama-3.3-70b-versatile" },
];

function stripFences(s: string): string {
  return s.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();
}

async function callLovable(key: string, model: string, system: string, user: string): Promise<string> {
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!r.ok) throw new Error(`lovable:${r.status}:${await r.text()}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "";
}

async function callOpenAI(key: string, model: string, system: string, user: string): Promise<string> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!r.ok) throw new Error(`openai:${r.status}:${await r.text()}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "";
}

async function callAnthropic(key: string, model: string, system: string, user: string): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 8192, system, messages: [{ role: "user", content: user }] }),
  });
  if (!r.ok) throw new Error(`anthropic:${r.status}:${await r.text()}`);
  const d = await r.json();
  return d.content?.[0]?.text || "";
}

async function callGemini(key: string, model: string, system: string, user: string): Promise<string> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
    }),
  });
  if (!r.ok) throw new Error(`gemini:${r.status}:${await r.text()}`);
  const d = await r.json();
  return d.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callGroq(key: string, model: string, system: string, user: string): Promise<string> {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: user }] }),
  });
  if (!r.ok) throw new Error(`groq:${r.status}:${await r.text()}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content || "";
}

async function dispatch(p: ProviderId, key: string, model: string, system: string, user: string): Promise<string> {
  switch (p) {
    case "lovable": return callLovable(key, model, system, user);
    case "openai": return callOpenAI(key, model, system, user);
    case "anthropic": return callAnthropic(key, model, system, user);
    case "gemini": return callGemini(key, model, system, user);
    case "groq": return callGroq(key, model, system, user);
  }
}

function availability() {
  return PROVIDERS.map((p) => ({
    id: p.id,
    label: p.label,
    available: !!Deno.env.get(p.envKey),
    defaultModel: p.defaultModel,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    if (req.method === "GET" || url.searchParams.get("action") === "status") {
      return new Response(JSON.stringify({ providers: availability() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    if (body?.action === "status") {
      return new Response(JSON.stringify({ providers: availability() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, currentCode, provider, model } = body as {
      prompt: string; currentCode?: string; provider?: ProviderId; model?: string;
    };
    if (!prompt?.trim()) {
      return new Response(JSON.stringify({ error: "BAD_REQUEST", message: "prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessage = currentCode
      ? `Current code:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nUser request: ${prompt}`
      : `User request: ${prompt}`;

    // Build ordered chain: preferred first, then remaining available providers as fallbacks.
    const preferred = PROVIDERS.find((p) => p.id === provider);
    const ordered = [
      ...(preferred ? [preferred] : []),
      ...PROVIDERS.filter((p) => p.id !== provider),
    ].filter((p) => !!Deno.env.get(p.envKey));

    if (ordered.length === 0) {
      return new Response(
        JSON.stringify({ error: "NO_PROVIDER", message: "No AI providers are configured.", providers: availability() }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const errors: { provider: string; error: string }[] = [];
    for (const p of ordered) {
      const key = Deno.env.get(p.envKey)!;
      const useModel = (provider === p.id && model) ? model : p.defaultModel;
      try {
        const raw = await dispatch(p.id, key, useModel, SYSTEM_PROMPT, userMessage);
        const code = stripFences(raw);
        if (!code) throw new Error("empty response");
        return new Response(
          JSON.stringify({ code, provider: p.id, model: useModel, fallbacksTried: errors }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[${p.id}] failed:`, msg);
        errors.push({ provider: p.id, error: msg.slice(0, 200) });
      }
    }

    return new Response(
      JSON.stringify({
        error: "ALL_PROVIDERS_FAILED",
        message: "All configured AI providers failed. Check API keys or quota.",
        attempts: errors,
        providers: availability(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ai-code-gen error:", e);
    return new Response(
      JSON.stringify({ error: "SERVICE_FAILED", message: e instanceof Error ? e.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
