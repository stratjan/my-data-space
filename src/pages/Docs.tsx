import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, ExternalLink, FileText, Link2, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface DocItem {
  id: string; title: string; category: string; type: string; source: string;
  owner: string; created: string; updated: string; url: string;
  tags: string[]; description: string; mime?: string;
}

function DocCard({ item }: { item: DocItem }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const isPdf = item.type === "Dokument" || (item.url || "").toLowerCase().endsWith(".pdf");

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <article className="bg-card border rounded-lg p-4 shadow-sm cursor-pointer hover:border-primary/30 transition-colors animate-fade-in" onClick={() => setOpen(!open)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isPdf ? <FileText className="h-4 w-4 text-destructive shrink-0" /> : <Link2 className="h-4 w-4 text-info-blue shrink-0" />}
            <h3 className="font-semibold text-card-foreground truncate">{item.title}</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {item.owner && `${item.owner} · `}
            {item.updated ? new Date(item.updated).toLocaleDateString("de-DE") : ""}
          </p>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {item.category && <Badge variant="secondary" className="text-xs">{item.category}</Badge>}
            {item.type && <Badge className="text-xs bg-info-blue-light text-info-blue border-0">{item.type}</Badge>}
            {item.source && <Badge className="text-xs bg-clinical-green-light text-clinical-green border-0">{item.source}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a href={item.url} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Öffnen <ExternalLink className="h-3 w-3" />
          </a>
          <Button variant="ghost" size="sm" onClick={copyLink}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {open && item.description && (
        <div className="mt-3 bg-muted rounded-lg p-4 text-sm leading-relaxed">
          {item.description}
          {item.tags?.length > 0 && <div className="mt-2 text-xs text-muted-foreground">Tags: {item.tags.join(", ")}</div>}
        </div>
      )}
    </article>
  );
}

export default function Docs() {
  const [items, setItems] = useState<DocItem[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [dtype, setDtype] = useState("all");
  const [source, setSource] = useState("all");

  useEffect(() => {
    (async () => {
      const urls = ["/docs/docs.json"];
      for (const url of urls) {
        try {
          const r = await fetch(url, { cache: "no-store" });
          if (!r.ok) continue;
          const ct = r.headers.get("content-type") || "";
          if (!ct.includes("json")) continue;
          const data = await r.json();
          setItems(Array.isArray(data) ? data : data.items || []);
          return;
        } catch { /* try next */ }
      }
    })();
  }, []);

  const categories = useMemo(() => [...new Set(items.map(x => x.category).filter(Boolean))].sort(), [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter(x => {
      if (category !== "all" && x.category !== category) return false;
      if (dtype !== "all" && x.type !== dtype) return false;
      if (source !== "all" && x.source !== source) return false;
      if (q) {
        const hay = [x.title, x.description, x.category, x.owner, ...(x.tags || [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, category, dtype, source]);

  const docs = filtered.filter(x => x.type === "Dokument" || (x.url || "").toLowerCase().endsWith(".pdf") || x.source === "Intern");
  const links = filtered.filter(x => !docs.includes(x));

  const exportCsv = () => {
    const head = ["id", "title", "category", "type", "source", "url", "description"];
    const rows = [head.join(","), ...items.map(x => head.map(k => `"${String((x as any)[k] ?? "").replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `docs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dokumente & Links</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} Einträge (Dokumente: {docs.length} · Links: {links.length})</p>
      </div>

      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b pb-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Suche Titel/Beschreibung/Tags…" value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={dtype} onValueChange={setDtype}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="Dokument">Dokument</SelectItem>
            <SelectItem value="Link">Link</SelectItem>
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Quellen</SelectItem>
            <SelectItem value="Intern">Intern</SelectItem>
            <SelectItem value="Extern">Extern</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><FileText className="h-5 w-5 text-destructive" /> Dokumente</h2>
          <div className="space-y-2">
            {docs.map(d => <DocCard key={d.id} item={d} />)}
            {docs.length === 0 && <p className="text-muted-foreground text-sm">Keine Dokumente</p>}
          </div>
        </section>
        <section>
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><Link2 className="h-5 w-5 text-info-blue" /> Externe Links</h2>
          <div className="space-y-2">
            {links.map(d => <DocCard key={d.id} item={d} />)}
            {links.length === 0 && <p className="text-muted-foreground text-sm">Keine Links</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
