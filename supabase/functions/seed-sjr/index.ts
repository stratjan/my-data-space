import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Read CSV from request body
    const csvText = await req.text();
    if (!csvText.trim()) {
      return new Response(JSON.stringify({ error: "No CSV data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lines = csvText.split("\n").filter((l) => l.trim());
    // Skip header
    const rows: { journal_lower: string; journal_name: string; sjr_value: number }[] = [];
    for (let i = 1; i < lines.length; i++) {
      // Handle CSV with possible commas in quoted fields
      const match = lines[i].match(/^"?([^"]*?)"?,(.+)$/);
      if (!match) {
        // Simple split
        const parts = lines[i].split(",");
        if (parts.length >= 2) {
          const name = parts.slice(0, -1).join(",").trim();
          const val = parseFloat(parts[parts.length - 1]);
          if (name && !isNaN(val)) {
            rows.push({ journal_lower: name.toLowerCase(), journal_name: name, sjr_value: val });
          }
        }
        continue;
      }
      const name = match[1].trim();
      const val = parseFloat(match[2].trim());
      if (name && !isNaN(val)) {
        rows.push({ journal_lower: name.toLowerCase(), journal_name: name, sjr_value: val });
      }
    }

    console.log(`[seed-sjr] Parsed ${rows.length} journal entries`);

    // Clear and insert in batches
    await supabase.from("journal_metrics").delete().neq("journal_lower", "");

    let inserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase.from("journal_metrics").upsert(batch, { onConflict: "journal_lower" });
      if (error) {
        console.error("[seed-sjr] upsert error:", error);
      } else {
        inserted += batch.length;
      }
    }

    return new Response(JSON.stringify({ ok: true, count: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[seed-sjr] Error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
