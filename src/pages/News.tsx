import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Download, RefreshCw, Star, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface NewsItem {
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

const STUDY_COLORS: Record<string, string> = {
  Prospective: "border-l-clinical-green bg-clinical-green-light/50 text-clinical-green",
  Review: "border-l-info-blue bg-info-blue-light/50 text-info-blue",
  Guideline: "border-l-warm-amber bg-warm-amber-light/50 text-warm-amber",
  Preclinical: "border-l-[hsl(var(--purple))] bg-[hsl(var(--purple-light))]/50 text-[hsl(var(--purple))]",
  Other: "border-l-border bg-muted/50 text-muted-foreground",
};

function StudyBadge({ study }: { study: string }) {
  const cls = STUDY_COLORS[study] || STUDY_COLORS.Other;
  return <Badge variant="outline" className={`${cls} border-0 text-xs`}>{study}</Badge>;
}

function NewsCard({ item, isNew }: { item: NewsItem; isNew: boolean }) {
  const [showAbstract, setShowAbstract] = useState(false);
  const study = item.study_class || "Other";
  const borderColor = study === "Prospective" ? "border-l-clinical-green"
    : study === "Review" ? "border-l-info-blue"
    : study === "Guideline" ? "border-l-warm-amber"
    : study === "Preclinical" ? "border-l-[hsl(var(--purple))]"
    : "border-l-border";

  return (
    <article
      className={`bg-card border rounded-lg p-4 shadow-sm border-l-4 ${borderColor} animate-fade-in cursor-pointer`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) return;
        if (item.abstract) setShowAbstract(!showAbstract);
      }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {isNew && <Star className="h-4 w-4 text-warm-amber shrink-0 mt-1 fill-warm-amber" />}
            <h3 className="font-semibold text-card-foreground leading-snug">{item.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">{item.journal}</span>
            {" · "}
            {item.pubdate ? new Date(item.pubdate).toLocaleDateString("de-DE") : "—"}
            {item.is_oa === true && <span className="ml-1 text-clinical-green font-medium">· OA</span>}
          </p>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            <StudyBadge study={study} />
            {item.entity && <Badge variant="secondary" className="text-xs">{item.entity}</Badge>}
            {item.trial_type && <Badge variant="secondary" className="text-xs">{item.trial_type}</Badge>}
          </div>
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
          {item.metric_value != null ? `${item.metric_name}: ${item.metric_value}` : "—"}
        </div>
      </div>

      {/* Links */}
      <div className="mt-3 flex gap-3 text-sm">
        <a href={item.url_pubmed} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
          PubMed <ExternalLink className="h-3 w-3" />
        </a>
        {item.url_doi && (
          <a href={item.url_doi} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
            DOI <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {item.oa_url && (
          <a href={item.oa_url} target="_blank" rel="noopener" className="text-clinical-green hover:underline inline-flex items-center gap-1">
            Volltext <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {item.abstract && (
          <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 ml-auto">
            {showAbstract ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Abstract
          </button>
        )}
      </div>

      {/* Abstract */}
      {showAbstract && item.abstract && (
        <div className="mt-3 bg-muted rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {item.abstract}
        </div>
      )}
    </article>
  );
}

export default function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("all");
  const [sort, setSort] = useState("metric");
  const [seenPmids] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("digestSeenPMIDs") || "[]")); }
    catch { return new Set<string>(); }
  });

  const loadData = useCallback(async (bust = false) => {
    setLoading(true);
    try {
      const url = bust ? `/data.json?t=${Date.now()}` : "/data.json";
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      setGenerated(data.generated);
      setItems(data.items || []);
      // Mark as seen
      const pmids = (data.items || []).map((x: NewsItem) => x.pmid);
      pmids.forEach((p: string) => seenPmids.add(p));
      localStorage.setItem("digestSeenPMIDs", JSON.stringify([...seenPmids]));
    } catch {
      // ignore
    }
    setLoading(false);
  }, [seenPmids]);

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
          <Button variant="outline" size="sm" onClick={() => loadData(true)} className="gap-1.5">
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
