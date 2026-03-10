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

/** Try to extract a simple dosing scheme like "1-0-0-0" from free text */
function extractDosingScheme(dosing: string): string {
  // Look for patterns like "1-0-0", "1-0-1", "1-0-0-0", also with spaces around dashes
  const match = dosing.match(/(\d+)\s*-\s*(\d+)\s*-\s*(\d+)(?:\s*-\s*(\d+))?/);
  if (match) return match[0].replace(/\s/g, "");
  // Look for "Nx täglich" / "Nx daily" patterns
  const nxMatch = dosing.match(/(\d+)\s*[x×]\s*täglich/i);
  if (nxMatch) {
    const n = parseInt(nxMatch[1]);
    if (n === 1) return "1-0-0";
    if (n === 2) return "1-0-1";
    if (n === 3) return "1-1-1";
  }
  // Look for "morgens" / "abends" patterns
  const lower = dosing.toLowerCase();
  if (lower.includes("morgens") && !lower.includes("abends")) return "1-0-0";
  if (lower.includes("abends") && !lower.includes("morgens")) return "0-0-1";
  if (lower.includes("morgens") && lower.includes("abends")) return "1-0-1";
  return "";
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
  // Rezeptblock: per-item overrides for pack size and dosing scheme
  const [packSizes, setPackSizes] = useState<Record<string, string>>({});
  const [dosingSchemes, setDosingSchemes] = useState<Record<string, string>>({});

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

  const getPackSize = (id: string) => packSizes[id] ?? "N2";
  const getDosingScheme = (id: string, dosing: string) => dosingSchemes[id] ?? extractDosingScheme(dosing);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
      <div className="mb-4 no-print">
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

        {/* Preview & Rezeptblock */}
        <section className="space-y-6">
          {/* Print Preview */}
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-semibold text-lg mb-3 no-print">Druckvorschau</h2>
            <div className="grid grid-cols-2 gap-3 mb-4 no-print">
              <Input placeholder="Titel" value={printTitle} onChange={e => setPrintTitle(e.target.value)} />
              <Input placeholder="Datum" value={printDate} onChange={e => setPrintDate(e.target.value)} />
              <Input placeholder="Geplante Therapie" className="col-span-2" value={printRegimen} onChange={e => setPrintRegimen(e.target.value)} />
              <Input placeholder="Ärztin/Arzt" value={printPhys} onChange={e => setPrintPhys(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground mb-4 no-print">Hinweis: Die Angaben ersetzen nicht die ärztliche Rücksprache.</p>

            {/* Print header - only visible in print */}
            <div className="hidden print-header">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h1 className="text-base font-bold">{printTitle}</h1>
                  {printRegimen && <p className="text-xs">Therapie: {printRegimen}</p>}
                </div>
                <div className="text-right text-xs">
                  <div>{printDate}</div>
                  {printPhys && <div>{printPhys}</div>}
                </div>
              </div>
              <p className="text-[9px] text-gray-500 mb-3 border-b pb-2">
                Patienteninformation – Die Angaben ersetzen nicht die ärztliche Rücksprache. Individuelle Anpassungen möglich.
              </p>
            </div>

            {selected.length === 0 ? (
              <p className="text-sm text-muted-foreground no-print">Noch keine Auswahl.</p>
            ) : (
              <div className="space-y-3 print-content">
                {[...byClass.entries()].sort((a, b) => a[0].localeCompare(b[0], "de")).map(([clsName, arr]) => (
                  <div key={clsName} className="print-block">
                    <h3 className="font-semibold text-sm border-b pb-1 mb-2 print:text-xs print:font-bold">{clsName}</h3>
                    <div className="space-y-2 print:space-y-1">
                      {arr.map(x => (
                        <div key={x.id} className="border rounded-lg p-3 print:p-2 print:border-gray-300 text-sm print:text-[10px]">
                          <div className="font-semibold print:text-xs">{x.name}</div>
                          <div className="text-muted-foreground mt-1 space-y-0.5 print:text-[10px] print:text-gray-800">
                            {/* Priority fields: Dosierung & Indikation first and prominent */}
                            <div className="print:font-medium"><span className="font-medium">Einnahme:</span> {x.dosing || "—"}</div>
                            <div><span className="font-medium">Indikation:</span> {x.indication || "—"}</div>
                            {/* Secondary fields: smaller in print */}
                            <div className="print:text-[9px] print:text-gray-500"><span className="font-medium">Substanz:</span> {x.substance || "—"}</div>
                            <div className="print:text-[9px] print:text-gray-500"><span className="font-medium">Max. Tagesdosis:</span> {x.max_daily || "—"}</div>
                            <div className="print:text-[9px] print:text-gray-500"><span className="font-medium">Nebenwirkungen:</span> {x.side_effects || "—"}</div>
                            <div className="print:text-[9px] print:text-gray-500"><span className="font-medium">Warnhinweise:</span> {x.warnings || "—"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rezeptblock Preview */}
          {selected.length > 0 && (
            <div className="bg-card border rounded-xl p-5 no-print">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Rezeptblock-Vorschau</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const text = selected.map(x => {
                      const substance = x.substance || x.name;
                      const pack = getPackSize(x.id);
                      const scheme = getDosingScheme(x.id, x.dosing);
                      return `${substance} ${pack}${scheme ? ` ${scheme}` : ""}`;
                    }).join("\n");
                    navigator.clipboard.writeText(text);
                    import("sonner").then(({ toast }) => toast.success("In Zwischenablage kopiert"));
                  }}
                  className="gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Kopieren
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Packungsgröße und Einnahmeschema können pro Medikament angepasst werden.</p>
              {/* Copyable text block */}
              <div
                className="bg-muted/50 border rounded-lg p-4 font-mono text-sm whitespace-pre-wrap select-all cursor-text mb-4"
                onClick={(e) => {
                  const range = document.createRange();
                  range.selectNodeContents(e.currentTarget);
                  const sel = window.getSelection();
                  sel?.removeAllRanges();
                  sel?.addRange(range);
                }}
              >
                {selected.map(x => {
                  const substance = x.substance || x.name;
                  const pack = getPackSize(x.id);
                  const scheme = getDosingScheme(x.id, x.dosing);
                  return `${substance} ${pack}${scheme ? ` ${scheme}` : ""}`;
                }).join("\n")}
              </div>
              {/* Per-item controls */}
              <div className="space-y-2">
                {selected.map(x => {
                  const scheme = getDosingScheme(x.id, x.dosing);
                  const packSize = getPackSize(x.id);
                  return (
                    <div key={x.id} className="border rounded-lg p-3 bg-background">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="font-mono font-semibold text-sm">
                            {x.substance || x.name}
                          </div>
                        </div>
                        <div className="flex gap-2 items-center shrink-0">
                          <Select
                            value={packSize}
                            onValueChange={(v) => setPackSizes(prev => ({ ...prev, [x.id]: v }))}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="N1">N1</SelectItem>
                              <SelectItem value="N2">N2</SelectItem>
                              <SelectItem value="N3">N3</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            className="w-24 h-8 text-xs font-mono"
                            placeholder="1-0-0"
                            value={scheme}
                            onChange={e => setDosingSchemes(prev => ({ ...prev, [x.id]: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
