import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Phone, Plus, Pencil, Trash2, Save, X, RotateCcw } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const STORAGE_KEY = "directory-overrides";

interface Contact {
  salutation: string; firstName: string; lastName: string; fullName: string;
  department1: string; department2: string; position: string;
  phoneWork: string; phoneWork2: string; mobile: string; fax: string;
  phoneOther: string; pager: string; emailDisplay: string;
  _custom?: boolean; // marks user-added contacts
}

type Overrides = {
  edits: Record<string, Partial<Contact>>; // key = fullName+phoneWork original
  added: Contact[];
  deleted: string[]; // keys of deleted originals
};

function contactKey(c: Contact) {
  return `${c.fullName}||${c.phoneWork}||${c.department1}`;
}

function loadOverrides(): Overrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { edits: {}, added: [], deleted: [] };
}

function saveOverrides(o: Overrides) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
}

function emptyContact(): Contact {
  return {
    salutation: "", firstName: "", lastName: "", fullName: "",
    department1: "", department2: "", position: "",
    phoneWork: "", phoneWork2: "", mobile: "", fax: "",
    phoneOther: "", pager: "", emailDisplay: "", _custom: true,
  };
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

/* ── Inline edit fields ── */
const EDIT_FIELDS: { key: keyof Contact; label: string; half?: boolean }[] = [
  { key: "fullName", label: "Name" },
  { key: "position", label: "Position" },
  { key: "department1", label: "Abteilung 1", half: true },
  { key: "department2", label: "Abteilung 2", half: true },
  { key: "phoneWork", label: "Telefon", half: true },
  { key: "phoneWork2", label: "Telefon 2", half: true },
  { key: "mobile", label: "Mobil", half: true },
  { key: "fax", label: "Fax", half: true },
  { key: "pager", label: "Pager", half: true },
  { key: "emailDisplay", label: "E-Mail", half: true },
];

export default function Directory() {
  const [baseContacts, setBaseContacts] = useState<Contact[]>([]);
  const [overrides, setOverrides] = useState<Overrides>(loadOverrides);
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("all");
  const [copied, setCopied] = useState(false);

  // editing
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editData, setEditData] = useState<Contact>(emptyContact());
  const [addOpen, setAddOpen] = useState(false);
  const [addData, setAddData] = useState<Contact>(emptyContact());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/directory/contacts.example.json", { cache: "no-store" });
        const data = await res.json();
        setBaseContacts(Array.isArray(data) ? data : []);
      } catch { /* ignore */ }
    })();
  }, []);

  // Merge base + overrides
  const contacts = useMemo(() => {
    let arr = baseContacts
      .filter(c => !overrides.deleted.includes(contactKey(c)))
      .map(c => {
        const k = contactKey(c);
        return overrides.edits[k] ? { ...c, ...overrides.edits[k] } : c;
      });
    return [...arr, ...overrides.added];
  }, [baseContacts, overrides]);

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

  const persist = useCallback((next: Overrides) => {
    setOverrides(next);
    saveOverrides(next);
  }, []);

  /* ── Actions ── */
  const startEdit = (c: Contact) => {
    setEditKey(contactKey(c));
    setEditData({ ...c });
  };

  const cancelEdit = () => { setEditKey(null); };

  const saveEdit = () => {
    if (!editKey) return;
    const next = { ...overrides };

    // Check if it's a custom-added contact
    const addedIdx = next.added.findIndex(a => contactKey(a) === editKey);
    if (addedIdx >= 0) {
      next.added = [...next.added];
      next.added[addedIdx] = { ...editData, _custom: true };
    } else {
      next.edits = { ...next.edits, [editKey]: { ...editData } };
    }
    persist(next);
    setEditKey(null);
    toast.success("Kontakt gespeichert");
  };

  const deleteContact = (c: Contact) => {
    const k = contactKey(c);
    const next = { ...overrides };
    if (c._custom) {
      next.added = next.added.filter(a => contactKey(a) !== k);
    } else {
      next.deleted = [...next.deleted, k];
    }
    persist(next);
    if (editKey === k) setEditKey(null);
    toast("Kontakt entfernt", { description: "Änderung kann zurückgesetzt werden." });
  };

  const addContact = () => {
    if (!addData.fullName.trim()) {
      toast.error("Name ist erforderlich");
      return;
    }
    const next = { ...overrides, added: [...overrides.added, { ...addData, _custom: true }] };
    persist(next);
    setAddOpen(false);
    setAddData(emptyContact());
    toast.success("Kontakt hinzugefügt");
  };

  const resetAll = () => {
    persist({ edits: {}, added: [], deleted: [] });
    toast.success("Alle lokalen Änderungen zurückgesetzt");
  };

  const hasOverrides = Object.keys(overrides.edits).length > 0 || overrides.added.length > 0 || overrides.deleted.length > 0;

  const copyAll = async () => {
    const nums = filtered.map(c => c.phoneWork).filter(Boolean).join(", ");
    await navigator.clipboard.writeText(nums);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const updateEditField = (key: keyof Contact, value: string) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const updateAddField = (key: keyof Contact, value: string) => {
    setAddData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Telefonverzeichnis</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} Treffer</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {hasOverrides && (
            <Button variant="ghost" size="sm" onClick={resetAll} className="gap-1.5 text-muted-foreground">
              <RotateCcw className="h-3.5 w-3.5" /> Zurücksetzen
            </Button>
          )}
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Neuer Kontakt
          </Button>
        </div>
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
        {filtered.map((c, i) => {
          const k = contactKey(c);
          const isEditing = editKey === k;
          const isModified = !!overrides.edits[k];

          if (isEditing) {
            return (
              <div key={k + i} className="p-4 bg-muted/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EDIT_FIELDS.map(f => (
                    <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
                      <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                      <Input
                        value={(editData[f.key] as string) || ""}
                        onChange={e => updateEditField(f.key, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEdit} className="gap-1">
                    <X className="h-3.5 w-3.5" /> Abbrechen
                  </Button>
                  <Button size="sm" onClick={saveEdit} className="gap-1">
                    <Save className="h-3.5 w-3.5" /> Speichern
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div key={k + i} className="group flex items-start justify-between gap-4 p-3 hover:bg-muted/50 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {c.fullName || "—"}
                  {c.position && <span className="text-muted-foreground font-normal"> · {c.position}</span>}
                  {c._custom && <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">Neu</Badge>}
                  {isModified && <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">Bearbeitet</Badge>}
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
              <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteContact(c)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Neuer Kontakt</DialogTitle>
            <DialogDescription>Kontakt wird lokal im Browser gespeichert.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            {EDIT_FIELDS.map(f => (
              <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <Input
                  value={(addData[f.key] as string) || ""}
                  onChange={e => updateAddField(f.key, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Abbrechen</Button>
            <Button onClick={addContact}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
