import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, RefreshCw, Star, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import NewsCard from "@/components/news/NewsCard";

export interface NewsItem {
  pmid: string;
  doi: string | null;
  title: string;
  journal: string;
  pubdate: string;
  pubtypes: string[];
  entity: string;
  trial_type: string | null;
  study_class: string;
  is_oa: boolean | null;
  oa_url: string | null;
  metric_name: string | null;
  metric_value: number | null;
  url_pubmed: string;
  url_doi: string | null;
  abstract: string | null;
}

export default function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("all");
  const [sort, setSort] = useState("metric");
  const today = new Date().toISOString().slice(0, 10);
  const [viewedToday, setViewedToday] = useState<Set<string>>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("digestViewedToday") || "{}");
      if (stored.date === today) return new Set(stored.pmids || []);
      return new Set<string>();
    } catch { return new Set<string>(); }
  });

  const markViewed = useCallback((pmid: string) => {
    setViewedToday(prev => {
      if (prev.has(pmid)) return prev;
      const next = new Set(prev);
      next.add(pmid);
      localStorage.setItem("digestViewedToday", JSON.stringify({ date: today, pmids: [...next] }));
      return next;
    });
  }, [today]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Try loading from database first
      const { data: metaData } = await (supabase as any)
        .from("news_meta")
        .select("value")
        .eq("key", "generated")
        .single();

      const { data: newsData } = await (supabase as any)
        .from("news_items")
        .select("*")
        .order("metric_value", { ascending: false, nullsFirst: false });

      if (newsData && newsData.length > 0) {
        setGenerated(metaData?.value || "");
        const mapped: NewsItem[] = newsData.map((row: any) => ({
          ...row,
          pubtypes: Array.isArray(row.pubtypes) ? row.pubtypes : [],
        }));
        setItems(mapped);
        // data loaded
      } else {
        // Fallback to static data.json
        const res = await fetch("/data.json", { cache: "no-store" });
        const data = await res.json();
        setGenerated(data.generated);
        setItems(data.items || []);
        // data loaded
      }
    } catch {
      // Fallback to static file
      try {
        const res = await fetch("/data.json", { cache: "no-store" });
        const data = await res.json();
        setGenerated(data.generated);
        setItems(data.items || []);
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let arr = items.slice();
    const q = query.toLowerCase();
    if (q) arr = arr.filter(x => (x.title || "").toLowerCase().includes(q) || (x.journal || "").toLowerCase().includes(q));
    if (entity !== "all") arr = arr.filter(x => x.entity === entity);
    arr.sort((a, b) => {
      if (sort === "metric") {
        const dm = (b.metric_value ?? -1) - (a.metric_value ?? -1);
        if (dm !== 0) return dm;
        return new Date(b.pubdate || 0).getTime() - new Date(a.pubdate || 0).getTime();
      }
      return new Date(b.pubdate || 0).getTime() - new Date(a.pubdate || 0).getTime();
    });
    return arr;
  }, [items, query, entity, sort]);

  const exportCsv = () => {
    const head = ["pmid", "doi", "title", "journal", "pubdate", "entity", "trial_type", "study_class", "metric_value"];
    const rows = [head.join(","), ...filtered.map(x => head.map(k => `"${String((x as any)[k] ?? "").replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `oncology-digest_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Oncology Daily Digest</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {generated ? `Aktualisiert: ${new Date(generated).toLocaleString("de-DE")}` : "Lade…"}
          {" · "}{filtered.length} Treffer
        </p>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border pb-4 mb-6 no-print">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Suche Titel/Journal…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={entity} onValueChange={setEntity}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Entitäten</SelectItem>
              <SelectItem value="NSCLC">NSCLC</SelectItem>
              <SelectItem value="SCLC">SCLC</SelectItem>
              <SelectItem value="Mesothelioma">Mesotheliom</SelectItem>
              <SelectItem value="Thymic">Thymisch</SelectItem>
              <SelectItem value="Thoracic-other">Thoracic-other</SelectItem>
              <SelectItem value="Other">Andere</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="metric">Metrik ↓</SelectItem>
              <SelectItem value="date">Datum ↓</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => loadData()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Aktualisieren
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-clinical-green" /> Prospektiv</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-info-blue" /> Review</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-warm-amber" /> Guideline</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[hsl(var(--purple))]" /> Präklinisch</span>
          <span className="inline-flex items-center gap-1.5"><Star className="h-3 w-3 text-warm-amber fill-warm-amber" /> Neu</span>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Lade Daten…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Keine Treffer</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <NewsCard key={item.pmid} item={item} isNew={!seenPmids.has(item.pmid)} />
          ))}
        </div>
      )}
    </div>
  );
}
