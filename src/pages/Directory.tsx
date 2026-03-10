import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Phone } from "lucide-react";

interface Contact {
  salutation: string; firstName: string; lastName: string; fullName: string;
  department1: string; department2: string; position: string;
  phoneWork: string; phoneWork2: string; mobile: string; fax: string;
  phoneOther: string; pager: string; emailDisplay: string;
}

function PhoneLink({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  const tel = value.replace(/[^+\d]/g, "");
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}:</span>{" "}
      <a href={`tel:${tel}`} className="text-primary hover:underline font-medium">{value}</a>
    </div>
  );
}

export default function Directory() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("all");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/directory/contacts.example.json", { cache: "no-store" });
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    })();
  }, []);

  const teams = useMemo(() =>
    [...new Set(contacts.map(c => c.department1).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de")),
    [contacts]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let arr = contacts;
    if (team !== "all") arr = arr.filter(c => c.department1 === team);
    if (q) {
      const starts: Contact[] = [];
      const rest: Contact[] = [];
      arr.forEach(c => {
        const hay = [c.fullName, c.firstName, c.lastName, c.department1, c.department2, c.position, c.phoneWork].join(" ").toLowerCase();
        if (!hay.includes(q)) return;
        if ((c.fullName || "").toLowerCase().startsWith(q)) starts.push(c); else rest.push(c);
      });
      arr = [...starts, ...rest];
    }
    return arr;
  }, [contacts, query, team]);

  const copyAll = async () => {
    const nums = filtered.map(c => c.phoneWork).filter(Boolean).join(", ");
    await navigator.clipboard.writeText(nums);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Telefonverzeichnis</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} Treffer</p>
      </div>

      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b pb-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Name, Abteilung, Nummer…" value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={team} onValueChange={setTeam}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Teams</SelectItem>
            {teams.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={copyAll} className="gap-1.5">
          <Copy className="h-3.5 w-3.5" />{copied ? "Kopiert!" : "Alle Nummern"}
        </Button>
      </div>

      <div className="bg-card border rounded-xl divide-y divide-border">
        {filtered.length === 0 && <div className="p-6 text-center text-muted-foreground">Keine Treffer.</div>}
        {filtered.map((c, i) => (
          <div key={i} className="flex items-start justify-between gap-4 p-3 hover:bg-muted/50 transition-colors">
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">
                {c.fullName || "—"}
                {c.position && <span className="text-muted-foreground font-normal"> · {c.position}</span>}
              </div>
              {(c.department1 || c.department2) && (
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {c.department1 && <Badge variant="secondary" className="text-xs">{c.department1}</Badge>}
                  {c.department2 && <Badge variant="secondary" className="text-xs">{c.department2}</Badge>}
                </div>
              )}
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              <PhoneLink label="Tel" value={c.phoneWork} />
              <PhoneLink label="Tel2" value={c.phoneWork2} />
              <PhoneLink label="Mobil" value={c.mobile} />
              <PhoneLink label="Fax" value={c.fax} />
              <PhoneLink label="Pager" value={c.pager} />
              {c.emailDisplay && (
                <div className="text-sm">
                  <a href={`mailto:${c.emailDisplay}`} className="text-primary hover:underline">{c.emailDisplay}</a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
