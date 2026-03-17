import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---- Config (matching config.yaml) ----
const CONTACT_EMAIL = "stratjan@googlemail.com";
const DAYS_BACK = 7;
const INCLUDE_ABSTRACTS = true;
const METRIC_NAME = "SJR";

const RSS_FEEDS = [
  "https://pubmed.ncbi.nlm.nih.gov/rss/search/1BE6Yf6ex8r7DRZ-LxK6Qy_Yppx64TDA8j4_HI5WAOLZADjUt4/?limit=15&utm_campaign=pubmed-2&fc=20250904042858",
  "https://pubmed.ncbi.nlm.nih.gov/rss/search/1deGMjvjVspo9hsDtk91neqW_t2WGjlrJnU9MGCo6mXWR1mQuz/?limit=100&utm_campaign=pubmed-2&fc=20250904042946",
  "https://pubmed.ncbi.nlm.nih.gov/rss/search/1Z74b2Om5LibvidIw7pqs8Z-n48D7V78QvmdyPOGmh0TXMOMH3/?limit=100&utm_campaign=pubmed-2&fc=20250904043024",
  "https://pubmed.ncbi.nlm.nih.gov/rss/search/1pEhTjOZGNUOUl_mTk5yi9XPhKJDXTxfMVF-FbfwNLeiUVSYWX/?limit=100&utm_campaign=pubmed-2&fc=20250904043054",
  "https://pubmed.ncbi.nlm.nih.gov/rss/search/1RcY2Y-NYSs3xrA4cVKJzHldHBBYyvZqTIkc4eJ1m7I3VouwyY/?limit=100&utm_campaign=pubmed-2&fc=20250904043128",
  "https://pubmed.ncbi.nlm.nih.gov/rss/search/1PeFS8XE8OyMjjoETx51aPa8MZkE7GBaJpRaKsX71zvOnxtMT3/?limit=15&utm_campaign=pubmed-2&fc=20250908161431",
];

const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const HEADERS = { "User-Agent": `oncology-digest/1.0 (${CONTACT_EMAIL})` };

// ---- Utils ----
function extractPmid(s: string): string | null {
  if (!s) return null;
  const m1 = s.match(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{4,10})/);
  if (m1) return m1[1];
  const m2 = s.match(/\b(\d{4,10})\b/);
  return m2 ? m2[1] : null;
}

async function rssPmids(url: string): Promise<string[]> {
  try {
    const res = await fetch(url, { headers: HEADERS });
    const text = await res.text();
    const pmids: string[] = [];
    // Simple XML parsing for RSS items
    const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(text)) !== null) {
      const item = match[1];
      // Try link, guid, description
      for (const tag of ["link", "guid", "description", "title"]) {
        const tagMatch = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        if (tagMatch) {
          const pmid = extractPmid(tagMatch[1]);
          if (pmid) {
            pmids.push(pmid);
            break;
          }
        }
      }
    }
    return [...new Set(pmids)];
  } catch (e) {
    console.error(`RSS fetch failed: ${url}`, e);
    return [];
  }
}

async function esummary(pmids: string[]): Promise<Record<string, any>> {
  if (!pmids.length) return {};
  const params = new URLSearchParams({
    db: "pubmed",
    id: pmids.join(","),
    retmode: "json",
    tool: "oncology-digest",
    email: CONTACT_EMAIL,
  });
  const ncbiKey = Deno.env.get("NCBI_API_KEY");
  if (ncbiKey) params.set("api_key", ncbiKey);
  const res = await fetch(`${NCBI_BASE}/esummary.fcgi?${params}`, { headers: HEADERS });
  const data = await res.json();
  return data.result || {};
}

async function efetchAbstracts(pmids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  if (!pmids.length) return out;
  const ncbiKey = Deno.env.get("NCBI_API_KEY");
  for (let i = 0; i < pmids.length; i += 180) {
    const chunk = pmids.slice(i, i + 180);
    const params = new URLSearchParams({
      db: "pubmed",
      id: chunk.join(","),
      retmode: "xml",
      tool: "oncology-digest",
      email: CONTACT_EMAIL,
    });
    if (ncbiKey) params.set("api_key", ncbiKey);
    try {
      const res = await fetch(`${NCBI_BASE}/efetch.fcgi?${params}`, { headers: HEADERS });
      const text = await res.text();
      // Simple XML parsing for abstracts
      const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g;
      let m;
      while ((m = articleRegex.exec(text)) !== null) {
        const art = m[1];
        const pmidMatch = art.match(/<MedlineCitation[\s\S]*?<PMID[^>]*>(\d+)<\/PMID>/);
        if (!pmidMatch) continue;
        const pmid = pmidMatch[1];
        const absTexts: string[] = [];
        const absRegex = /<AbstractText(?:\s+Label="([^"]*)")?[^>]*>([\s\S]*?)<\/AbstractText>/g;
        let am;
        while ((am = absRegex.exec(art)) !== null) {
          const label = am[1]?.trim();
          const txt = am[2]?.replace(/<[^>]+>/g, "").trim();
          if (!txt) continue;
          absTexts.push(label ? `${label}: ${txt}` : txt);
        }
        if (absTexts.length) out[pmid] = absTexts.join("\n\n");
      }
    } catch (e) {
      console.error("efetch error", e);
    }
    if (i + 180 < pmids.length) await new Promise((r) => setTimeout(r, 350));
  }
  return out;
}

async function unpaywall(doi: string | null): Promise<{ is_oa: boolean | null; oa_url: string | null }> {
  if (!doi) return { is_oa: null, oa_url: null };
  try {
    const res = await fetch(
      `https://api.unpaywall.org/v2/${doi}?email=${CONTACT_EMAIL}`,
      { headers: HEADERS }
    );
    if (res.status === 404) return { is_oa: false, oa_url: null };
    const j = await res.json();
    return {
      is_oa: !!j.is_oa,
      oa_url: j.best_oa_location?.url || null,
    };
  } catch {
    return { is_oa: null, oa_url: null };
  }
}

function withinDays(pubdateIso: string): boolean {
  try {
    const d = new Date(pubdateIso);
    const cutoff = new Date(Date.now() - DAYS_BACK * 86400000);
    return d >= cutoff;
  } catch {
    return true;
  }
}

// ---- Classification ----
function classifyEntity(title: string): string {
  const t = (title || "").toLowerCase();
  if (["nsclc", "non-small cell", "non–small cell", "adenocarcinoma of the lung", "squamous cell carcinoma of the lung"].some((k) => t.includes(k)))
    return "NSCLC";
  if (["sclc", "small cell lung"].some((k) => t.includes(k))) return "SCLC";
  if (t.includes("mesothelioma")) return "Mesothelioma";
  if (["thymoma", "thymic"].some((k) => t.includes(k))) return "Thymic";
  if (["lung", "pulmonary", "bronchial"].some((k) => t.includes(k))) return "Thoracic-other";
  return "Other";
}

function classifyTrial(pubtypes: string[], title: string): string | null {
  const pt = new Set(pubtypes.map((p) => p.toLowerCase()));
  if ([...pt].some((p) => p.includes("randomized controlled trial"))) return "RCT";
  if ([...pt].some((p) => p.includes("clinical trial, phase iii")) || /\bphase\s*iii\b/i.test(title)) return "Phase III";
  if ([...pt].some((p) => p.includes("clinical trial, phase ii")) || /\bphase\s*ii\b/i.test(title)) return "Phase II";
  if ([...pt].some((p) => p.includes("practice guideline") || p === "guideline")) return "Guideline";
  if ([...pt].some((p) => p === "review" || p.includes("systematic review") || p.includes("meta-analysis"))) return "Review/Meta";
  if ([...pt].some((p) => p.includes("prospective studies")) || /\bprospective\b/i.test(title)) return "Prospective (non-RCT)";
  return null;
}

const PRECLIN_KW = ["preclinical", "xenograft", "syngeneic", "murine", "mouse", "mice", "rat", "zebrafish", "organoid", "in vitro", "in vivo", "cell line"];

function classifyStudyClass(pubtypes: string[], title: string, trialType: string | null): string {
  const pt = new Set(pubtypes.map((p) => p.toLowerCase()));
  const t = (title || "").toLowerCase();
  if (["RCT", "Phase III", "Phase II", "Prospective (non-RCT)"].includes(trialType || "")) return "Prospective";
  if ([...pt].some((p) => p.includes("practice guideline") || p === "guideline")) return "Guideline";
  if ([...pt].some((p) => p === "review" || p.includes("systematic review") || p.includes("meta-analysis"))) return "Review";
  if (PRECLIN_KW.some((k) => t.includes(k))) return "Preclinical";
  return "Other";
}

// ---- Main Pipeline ----
async function buildDigest(supabase: any) {
  console.log(`[digest] Starting. ${RSS_FEEDS.length} feeds, days_back=${DAYS_BACK}`);

  // 1. Collect PMIDs from RSS
  const allPmids: string[] = [];
  for (const url of RSS_FEEDS) {
    const pmids = await rssPmids(url);
    console.log(`[rss] ${pmids.length} PMIDs from feed`);
    allPmids.push(...pmids);
  }
  const uniquePmids = [...new Set(allPmids)];
  console.log(`[digest] ${uniquePmids.length} unique PMIDs`);

  if (!uniquePmids.length) {
    console.log("[digest] No PMIDs found, skipping");
    return { count: 0 };
  }

  // 2. Load SJR metrics from DB
  const { data: metricsData } = await supabase
    .from("journal_metrics")
    .select("journal_lower, sjr_value");
  const metricMap: Record<string, number> = {};
  for (const m of metricsData || []) {
    metricMap[m.journal_lower] = Number(m.sjr_value);
  }
  console.log(`[digest] ${Object.keys(metricMap).length} journal metrics loaded`);

  // 3. Fetch article metadata in chunks
  const items: any[] = [];
  for (let i = 0; i < uniquePmids.length; i += 180) {
    const chunk = uniquePmids.slice(i, i + 180);
    const result = await esummary(chunk);
    const uids = result.uids || [];
    for (const uid of uids) {
      const it = result[uid];
      if (!it || typeof it !== "object") continue;
      const title = it.title;
      const journal = it.fulljournalname || it.source;
      const pt = it.pubtype;
      const pubtypes: string[] = Array.isArray(pt)
        ? pt.map((x: any) => (typeof x === "object" ? x.text || String(x) : String(x)))
        : pt ? [String(pt)] : [];
      const rawDate = it.sortpubdate || it.epubdate || it.pubdate;
      let pubdateIso: string;
      try {
        pubdateIso = new Date(rawDate).toISOString();
      } catch {
        pubdateIso = rawDate;
      }

      const doi = (it.articleids || []).find((a: any) => a.idtype === "doi")?.value || null;
      const { is_oa, oa_url } = await unpaywall(doi);

      const entity = classifyEntity(title);
      const trialType = classifyTrial(pubtypes, title);
      const studyClass = classifyStudyClass(pubtypes, title, trialType);
      const jkey = (journal || "").trim().toLowerCase();
      const mval = metricMap[jkey] ?? null;

      items.push({
        pmid: uid,
        doi,
        title,
        journal,
        pubdate: pubdateIso,
        pubtypes,
        entity,
        trial_type: trialType,
        study_class: studyClass,
        is_oa,
        oa_url,
        metric_name: mval !== null ? METRIC_NAME : null,
        metric_value: mval,
        url_pubmed: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
        url_doi: doi ? `https://doi.org/${doi}` : null,
        abstract: null,
      });
    }
    if (i + 180 < uniquePmids.length) await new Promise((r) => setTimeout(r, 350));
  }

  console.log(`[digest] ${items.length} items fetched`);

  // 4. Fetch abstracts
  if (INCLUDE_ABSTRACTS && items.length) {
    const absMap = await efetchAbstracts(items.map((x) => x.pmid));
    for (const item of items) {
      if (absMap[item.pmid]) item.abstract = absMap[item.pmid];
    }
    console.log(`[digest] ${Object.keys(absMap).length} abstracts fetched`);
  }

  // 5. Filter by date & deduplicate
  const seen = new Set<string>();
  const filtered: any[] = [];
  // Sort by metric desc, then date desc
  items.sort((a, b) => {
    const dm = (b.metric_value ?? -1) - (a.metric_value ?? -1);
    if (dm !== 0) return dm;
    return new Date(b.pubdate || 0).getTime() - new Date(a.pubdate || 0).getTime();
  });
  for (const x of items) {
    const key = x.doi || x.pmid || (x.title + x.pubdate);
    if (seen.has(key)) continue;
    seen.add(key);
    if (x.pubdate && !withinDays(x.pubdate)) continue;
    filtered.push(x);
  }

  console.log(`[digest] ${filtered.length} items after dedup & date filter`);

  // 6. Upsert into DB
  // First delete old items
  await supabase.from("news_items").delete().neq("pmid", "");

  // Insert new items in batches
  for (let i = 0; i < filtered.length; i += 50) {
    const batch = filtered.slice(i, i + 50);
    const { error } = await supabase.from("news_items").upsert(batch, { onConflict: "pmid" });
    if (error) console.error("[digest] upsert error:", error);
  }

  // Update metadata
  await supabase.from("news_meta").upsert(
    { key: "generated", value: new Date().toISOString(), updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );

  console.log(`[digest] Done. ${filtered.length} items stored.`);
  return { count: filtered.length };
}

// ---- Serve ----
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const result = await buildDigest(supabase);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[digest] Fatal error:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
