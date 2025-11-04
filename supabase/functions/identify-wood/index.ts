// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
function monthStartISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}
async function sha256Hex(buf: Uint8Array) {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return json("ok");
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE")!;
    const HF = Deno.env.get("HUGGING_FACE_TOKEN");
    const MODEL = Deno.env.get("HF_MODEL") ?? "your-username/wood-species-classifier";
    if (!HF || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE) return json({ error: "Server not configured" }, 500);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file) return json({ error: "No image" }, 400);

    const userId = req.headers.get("x-user-id") || null;
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "0.0.0.0").split(",")[0].trim();
    const ipHash = await sha256Hex(new TextEncoder().encode(ip));

    const buf = new Uint8Array(await file.arrayBuffer());
    const sha = await sha256Hex(buf);

    // Plan/quota
    let plan = "free";
    let status = "free";
    const since = monthStartISO();
    if (userId) {
      const { data: sub } = await supabase.from("subscriptions").select("plan,status").eq("user_id", userId).maybeSingle();
      if (sub?.status === "active" && sub?.plan === "pro") { plan = "pro"; status = "active"; }
    }
    const { count } = await supabase.from("identifications").select("*", { count: "exact", head: true })
      .gte("created_at", since)
      .or(userId ? `user_id.eq.${userId}` : `ip_hash.eq.${ipHash}`);

    if (plan === "free" && (count ?? 0) >= 10) {
      return json({ error: "quota_exceeded", remaining: 0 }, 402);
    }

    // Cache
    const { data: cached } = await supabase.from("identifications")
      .select("top3").eq("sha256", sha)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (cached?.top3) {
      return json({ predictions: cached.top3, cached: true, remaining: Math.max(0, 10 - ((count ?? 0))), identification_id: null, sha256: sha });
    }

    // HF inference
    const t0 = performance.now();
    const hf = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${HF}` },
      body: buf
    });
    if (!hf.ok) {
      const txt = await hf.text();
      return json({ error: "inference_failed", detail: txt }, 502);
    }
    const preds = await hf.json();
    let top3 = (Array.isArray(preds) ? preds : []).slice(0, 3).map((p: any) => ({
      label: String(p.label ?? p.class ?? "unknown"),
      score: Number(p.score ?? p.probability ?? 0),
    }));

    // Canonicalize to verified species via aliases
    try {
      const labels = top3.map(p => p.label);
      if (labels.length) {
        const { data: aliases } = await supabase
          .from("species_aliases")
          .select("alias, species_id, species:species_id ( id, common_name, scientific_name, verified )")
          .in("alias", labels);
        if (aliases && aliases.length) {
          top3 = top3.map(p => {
            const hit = aliases.find(a => a.alias.toLowerCase() === p.label.toLowerCase() && a.species?.verified);
            if (hit && hit.species) {
              return {
                ...p,
                label: hit.species.common_name ?? hit.species.id,
                canonical_id: hit.species.id,
                scientific_name: hit.species.scientific_name ?? null
              };
            }
            return p;
          });
        }
      }
    } catch (_e) { /* ignore */ }

    const latency = Math.round(performance.now() - t0);

    // Log and return id
    const insertRes = await supabase.from("identifications").insert({
      user_id: userId,
      ip_hash: ipHash,
      sha256: sha,
      top1: top3[0]?.label ?? null,
      top1_conf: top3[0]?.score ?? null,
      top3,
      provider: "hf",
      latency_ms: latency,
      input_bytes: buf.byteLength
    }).select("id").single();
    const identId = insertRes.data?.id ?? null;

    const remaining = plan === "free" ? Math.max(0, 10 - ((count ?? 0) + 1)) : null;
    return json({ predictions: top3, remaining, identification_id: identId, sha256: sha });
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});
