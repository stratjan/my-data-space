import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface Snippet {
  id: string; title: string; author: string; entity: string; timepoint: string;
  protocol: string; created: string; updated: string; tags: string[]; body: string;
}

function SnippetCard({ s }: { s: Snippet }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(s.body || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <article
      className="bg-card border rounded-lg p-4 shadow-sm cursor-pointer hover:border-primary/30 transition-colors animate-fade-in"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-card-foreground">{s.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {s.author && `${s.author} · `}
            {s.updated ? new Date(s.updated).toLocaleDateString("de-DE") : ""}
          </p>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            {s.entity && <Badge variant="secondary" className="text-xs">{s.entity}</Badge>}
            {s.timepoint && <Badge className="text-xs bg-info-blue-light text-info-blue border-0">{s.timepoint}</Badge>}
            {s.protocol && s.protocol !== "—" && <Badge className="text-xs bg-clinical-green-light text-clinical-green border-0">{s.protocol}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Kopiert" : "Kopieren"}
          </Button>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>
      {open && (
        <div className="mt-3 bg-muted rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {s.body}
        </div>
      )}
    </article>
  );
}

export default function Snippets() {
  const [items, setItems] = useState<Snippet[]>([]);
  const [query, setQuery] = useState("");
  const [author, setAuthor] = useState("all");
  const [entity, setEntity] = useState("all");
  const [timepoint, setTimepoint] = useState("all");
  const [protocol, setProtocol] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        let r = await fetch("/snippets/snippets.json", { cache: "no-store" });
        if (!r.ok) r = await fetch("/snippets/snippets.example.json", { cache: "no-store" });
        const data = await r.json();
        setItems(Array.isArray(data) ? data : data.items || []);
      } catch { /* ignore */ }
    })();
  }, []);

  const authors = useMemo(() => [...new Set(items.map(x => x.author).filter(Boolean))].sort(), [items]);
  const entities = useMemo(() => [...new Set(items.map(x => x.entity).filter(Boolean))].sort(), [items]);
  const protocols = useMemo(() => [...new Set(items.map(x => x.protocol).filter(Boolean).filter(p => p !== "—"))].sort(), [items]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter(x => {
      if (author !== "all" && x.author !== author) return false;
      if (entity !== "all" && x.entity !== entity) return false;
      if (timepoint !== "all" && x.timepoint !== timepoint) return false;
      if (protocol !== "all" && x.protocol !== protocol) return false;
      if (q) {
        const hay = [x.title, x.body, x.author, x.entity, x.protocol, ...(x.tags || [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, author, entity, timepoint, protocol]);

  const exportCsv = () => {
    const head = ["id", "title", "author", "entity", "timepoint", "protocol", "body"];
    const rows = [head.join(","), ...items.map(x => head.map(k => `"${String((x as any)[k] ?? "").replace(/"/g, '""')}"`).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `textbausteine_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Textbausteine</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} Einträge</p>
      </div>

      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b pb-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Suche Titel/Text…" value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={author} onValueChange={setAuthor}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Ersteller</SelectItem>
            {authors.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Entitäten</SelectItem>
            {entities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={timepoint} onValueChange={setTimepoint}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Zeitpunkte</SelectItem>
            <SelectItem value="Diagnosestellung">Diagnosestellung</SelectItem>
            <SelectItem value="Therapie">Therapie</SelectItem>
            <SelectItem value="Therapieverlauf">Therapieverlauf</SelectItem>
            <SelectItem value="Nachsorge">Nachsorge</SelectItem>
          </SelectContent>
        </Select>
        <Select value={protocol} onValueChange={setProtocol}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Protokolle</SelectItem>
            {protocols.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> CSV
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.map(s => <SnippetCard key={s.id + s.title} s={s} />)}
        {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Keine Treffer</p>}
      </div>
    </div>
  );
}
