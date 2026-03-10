import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, RotateCcw, CheckSquare, XSquare } from "lucide-react";

interface RegimenCatalog { id: string; name: string; group: string | null; aliases: string[]; }
interface SupportItem {
  id: string; name: string; substance: string; class: string; indication: string;
  dosing: string; max_daily: string; side_effects: string; warnings: string;
  regimen_category: string; specialty: string; disease: string; regimens: string[];
}

export default function Support() {
  const [items, setItems] = useState<SupportItem[]>([]);
  const [catalog, setCatalog] = useState<RegimenCatalog[]>([]);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [cls, setCls] = useState("all");
  const [therapyGroup, setTherapyGroup] = useState("all");
  const [therapy, setTherapy] = useState("all");
  const [query, setQuery] = useState("");
  const [printTitle, setPrintTitle] = useState("Supportivmedikation");
  const [printDate, setPrintDate] = useState(new Date().toLocaleDateString("de-DE"));
  const [printRegimen, setPrintRegimen] = useState("");
  const [printPhys, setPrintPhys] = useState("");

  useEffect(() => {
    (async () => {
      try {
        let r = await fetch("/support/supportive.json", { cache: "no-store" });
        if (!r.ok) r = await fetch("/support/supportive.example.json", { cache: "no-store" });
        const raw = await r.json();
        if (Array.isArray(raw)) { setItems(raw); setCatalog([]); }
        else { setItems(raw.items || []); setCatalog(raw.regimen_catalog || []); }
      } catch { /* ignore */ }
    })();
  }, []);

  const byRegimen = useMemo(() => new Map(catalog.map(r => [r.id, r])), [catalog]);
  const classes = useMemo(() => [...new Set(items.map(x => x.class).filter(Boolean))].sort(), [items]);
  const groups = useMemo(() => [...new Set(catalog.map(x => x.group).filter(Boolean) as string[])].sort(), [catalog]);
  const therapies = useMemo(() =>
    catalog.filter(r => therapyGroup === "all" || r.group === therapyGroup).sort((a, b) => a.name.localeCompare(b.name, "de")),
    [catalog, therapyGroup]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter(x => {
      if (cls !== "all" && x.class !== cls) return false;
      if (therapyGroup !== "all") {
        const hit = (x.regimens || []).some(rid => { const r = byRegimen.get(rid); return r && r.group === therapyGroup; });
        if (!hit) return false;
      }
      if (therapy !== "all") { if (!(x.regimens || []).includes(therapy)) return false; }
      if (q) {
        let aliasHit = false;
        for (const rid of x.regimens || []) {
          const r = byRegimen.get(rid);
          if (r && [r.name, ...(r.aliases || [])].join(" ").toLowerCase().includes(q)) { aliasHit = true; break; }
        }
        const hay = [x.name, x.substance, x.class, x.indication].join(" ").toLowerCase();
        if (!aliasHit && !hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, cls, therapyGroup, therapy, query, byRegimen]);

  const toggleSel = (id: string) => {
    const s = new Set(selection);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelection(s);
  };

  const selected = items.filter(x => selection.has(x.id));
  const byClass = new Map<string, SupportItem[]>();
  for (const it of selected) {
    const key = it.class || "Sonstige";
    if (!byClass.has(key)) byClass.set(key, []);
    byClass.get(key)!.push(it);
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Supportivtherapie</h1>
        <p className="text-sm text-muted-foreground">{items.length} Einträge · {catalog.length} Regime · {selection.size} ausgewählt</p>
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b pb-3 mb-6 flex flex-wrap gap-2 no-print">
        <Button variant="outline" size="sm" onClick={() => { setCls("all"); setTherapyGroup("all"); setTherapy("all"); setQuery(""); }}><RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset</Button>
        <Button variant="outline" size="sm" onClick={() => { const s = new Set(selection); filtered.forEach(x => s.add(x.id)); setSelection(s); }}><CheckSquare className="h-3.5 w-3.5 mr-1.5" />Alle wählen</Button>
        <Button variant="outline" size="sm" onClick={() => setSelection(new Set())}><XSquare className="h-3.5 w-3.5 mr-1.5" />Leeren</Button>
        <Button variant="default" size="sm" onClick={() => window.print()} className="gap-1.5"><Printer className="h-3.5 w-3.5" />Drucken</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter */}
        <aside className="no-print bg-card border rounded-xl p-5 lg:sticky lg:top-32 h-fit space-y-4">
          <h2 className="font-semibold text-lg">Filter</h2>
          <div>
            <label className="text-sm font-medium mb-1 block">Medikamentenklasse</label>
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Klassen</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Therapie-Oberkategorie</label>
            <Select value={therapyGroup} onValueChange={(v) => { setTherapyGroup(v); setTherapy("all"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Gruppen</SelectItem>
                {groups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Regime / Substanz</label>
            <Select value={therapy} onValueChange={setTherapy}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Regime</SelectItem>
                {therapies.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Freitext-Suche</label>
            <Input placeholder="z. B. Ondansetron" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        </aside>

        {/* Results */}
        <section className="no-print">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-semibold text-lg">Trefferliste</h2>
            <span className="text-sm text-muted-foreground">{filtered.length} Treffer</span>
          </div>
          <div className="space-y-2">
            {filtered.map(x => {
              const regs = (x.regimens || []).map(rid => byRegimen.get(rid)?.name).filter(Boolean) as string[];
              return (
                <label key={x.id} className="block bg-card border rounded-lg p-3 shadow-sm cursor-pointer hover:border-primary/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <Checkbox checked={selection.has(x.id)} onCheckedChange={() => toggleSel(x.id)} className="mt-1" />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{x.name}</div>
                      {regs.length > 0 && <div className="mt-1 flex gap-1 flex-wrap">{regs.map(n => <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>)}</div>}
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        <div><span className="font-medium">Klasse:</span> {x.class || "—"} · <span className="font-medium">Substanz:</span> {x.substance || "—"}</div>
                        <div><span className="font-medium">Indikation:</span> {x.indication || "—"}</div>
                        <div><span className="font-medium">Dosierung:</span> {x.dosing || "—"}</div>
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
            {filtered.length === 0 && <p className="text-muted-foreground text-center py-8">Keine Treffer</p>}
          </div>
        </section>

        {/* Preview */}
        <section className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-3">Druckvorschau</h2>
          <div className="grid grid-cols-2 gap-3 mb-4 no-print">
            <Input placeholder="Titel" value={printTitle} onChange={e => setPrintTitle(e.target.value)} />
            <Input placeholder="Datum" value={printDate} onChange={e => setPrintDate(e.target.value)} />
            <Input placeholder="Geplante Therapie" className="col-span-2" value={printRegimen} onChange={e => setPrintRegimen(e.target.value)} />
            <Input placeholder="Ärztin/Arzt" value={printPhys} onChange={e => setPrintPhys(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground mb-4 no-print">Hinweis: Die Angaben ersetzen nicht die ärztliche Rücksprache.</p>

          {selected.length === 0 ? (
            <p className="text-sm text-muted-foreground">Noch keine Auswahl.</p>
          ) : (
            <div className="space-y-4">
              {[...byClass.entries()].sort((a, b) => a[0].localeCompare(b[0], "de")).map(([clsName, arr]) => (
                <div key={clsName}>
                  <h3 className="font-semibold text-sm border-b pb-1 mb-2">{clsName}</h3>
                  <div className="space-y-2">
                    {arr.map(x => (
                      <div key={x.id} className="border rounded-lg p-3 text-sm">
                        <div className="font-semibold">{x.name}</div>
                        <div className="text-muted-foreground text-xs mt-1 space-y-0.5">
                          <div><span className="font-medium">Substanz:</span> {x.substance || "—"}</div>
                          <div><span className="font-medium">Indikation:</span> {x.indication || "—"}</div>
                          <div><span className="font-medium">Dosierung:</span> {x.dosing || "—"}</div>
                          <div><span className="font-medium">Tageshöchstdosis:</span> {x.max_daily || "—"}</div>
                          <div><span className="font-medium">Nebenwirkungen:</span> {x.side_effects || "—"}</div>
                          <div><span className="font-medium">Warnhinweise:</span> {x.warnings || "—"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
