import { useState, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, Plus, Pencil, Trash2, Save, X, RotateCcw, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  salutation: string;
  first_name: string;
  last_name: string;
  full_name: string;
  department1: string;
  department2: string;
  position: string;
  phone_work: string;
  phone_work2: string;
  mobile: string;
  fax: string;
  phone_other: string;
  pager: string;
  email_display: string;
}

// Legacy JSON shape for import
interface LegacyContact {
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

const EDIT_FIELDS: { key: keyof Contact; label: string; half?: boolean }[] = [
  { key: "full_name", label: "Name" },
  { key: "position", label: "Position" },
  { key: "department1", label: "Abteilung 1", half: true },
  { key: "department2", label: "Abteilung 2", half: true },
  { key: "phone_work", label: "Telefon", half: true },
  { key: "phone_work2", label: "Telefon 2", half: true },
  { key: "mobile", label: "Mobil", half: true },
  { key: "fax", label: "Fax", half: true },
  { key: "pager", label: "Pager", half: true },
  { key: "email_display", label: "E-Mail", half: true },
];

function emptyContact(): Omit<Contact, "id"> {
  return {
    salutation: "", first_name: "", last_name: "", full_name: "",
    department1: "", department2: "", position: "",
    phone_work: "", phone_work2: "", mobile: "", fax: "",
    phone_other: "", pager: "", email_display: "",
  };
}

export default function Directory() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("all");
  const [copied, setCopied] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Omit<Contact, "id">>(emptyContact());
  const [addOpen, setAddOpen] = useState(false);
  const [addData, setAddData] = useState<Omit<Contact, "id">>(emptyContact());
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async () => {
    let allData: Contact[] = [];
    let from = 0;
    const pageSize = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("full_name")
        .range(from, from + pageSize - 1);
      if (error) {
        console.error("Fetch error:", error);
        break;
      }
      if (!data || data.length === 0) break;
      allData = [...allData, ...data];
      if (data.length < pageSize) break;
      from += pageSize;
    }
    setContacts(allData);
    setLoading(false);
  }, []);

  // Seed from JSON if DB is empty
  const seedFromJson = useCallback(async () => {
    try {
      const res = await fetch("/directory/contacts.json", { cache: "no-store" });
      const legacy: LegacyContact[] = await res.json();
      if (!Array.isArray(legacy) || legacy.length === 0) return;

      // Insert in batches of 50
      const rows = legacy.map((c) => ({
        salutation: c.salutation || "",
        first_name: c.firstName || "",
        last_name: c.lastName || "",
        full_name: c.fullName || "",
        department1: c.department1 || "",
        department2: c.department2 || "",
        position: c.position || "",
        phone_work: c.phoneWork || "",
        phone_work2: c.phoneWork2 || "",
        mobile: c.mobile || "",
        fax: c.fax || "",
        phone_other: c.phoneOther || "",
        pager: c.pager || "",
        email_display: c.emailDisplay || "",
      }));

      const batchSize = 50;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from("contacts").insert(batch);
        if (error) {
          console.error("Seed batch error:", error);
          break;
        }
      }
      await fetchContacts();
      toast.success(`${rows.length} Kontakte importiert`);
    } catch (e) {
      console.error("Seed error:", e);
    }
  }, [fetchContacts]);

  useEffect(() => {
    (async () => {
      const { count } = await supabase.from("contacts").select("*", { count: "exact", head: true });
      if (count === 0) {
        await seedFromJson();
      } else {
        await fetchContacts();
      }
    })();
  }, [fetchContacts, seedFromJson]);

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
        const hay = [c.full_name, c.first_name, c.last_name, c.department1, c.department2, c.position, c.phone_work].join(" ").toLowerCase();
        if (!hay.includes(q)) return;
        if ((c.full_name || "").toLowerCase().startsWith(q)) starts.push(c); else rest.push(c);
      });
      arr = [...starts, ...rest];
    }
    return arr;
  }, [contacts, query, team]);

  /* ── Actions ── */
  const startEdit = (c: Contact) => {
    setEditId(c.id);
    const { id, ...rest } = c;
    setEditData(rest as Omit<Contact, "id">);
  };

  const cancelEdit = () => setEditId(null);

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(true);
    const { error } = await supabase.from("contacts").update(editData).eq("id", editId);
    setSaving(false);
    if (error) {
      toast.error("Fehler beim Speichern");
      return;
    }
    toast.success("Kontakt gespeichert");
    setEditId(null);
    fetchContacts();
  };

  const deleteContact = async (c: Contact) => {
    const { error } = await supabase.from("contacts").delete().eq("id", c.id);
    if (error) {
      toast.error("Fehler beim Löschen");
      return;
    }
    toast("Kontakt gelöscht");
    fetchContacts();
  };

  const addContact = async () => {
    if (!addData.full_name.trim()) {
      toast.error("Name ist erforderlich");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("contacts").insert(addData);
    setSaving(false);
    if (error) {
      toast.error("Fehler beim Hinzufügen");
      return;
    }
    toast.success("Kontakt hinzugefügt");
    setAddOpen(false);
    setAddData(emptyContact());
    fetchContacts();
  };

  const copyAll = async () => {
    const nums = filtered.map(c => c.phone_work).filter(Boolean).join(", ");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Lade Kontakte…</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Telefonverzeichnis</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} Treffer</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 shrink-0">
          <Plus className="h-3.5 w-3.5" /> Neuer Kontakt
        </Button>
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
        {filtered.map((c) => {
          const isEditing = editId === c.id;

          if (isEditing) {
            return (
              <div key={c.id} className="p-4 bg-muted/30 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EDIT_FIELDS.map(f => (
                    <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
                      <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                      <Input
                        value={(editData[f.key as keyof typeof editData] as string) || ""}
                        onChange={e => updateEditField(f.key, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={cancelEdit} className="gap-1" disabled={saving}>
                    <X className="h-3.5 w-3.5" /> Abbrechen
                  </Button>
                  <Button size="sm" onClick={saveEdit} className="gap-1" disabled={saving}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Speichern
                  </Button>
                </div>
              </div>
            );
          }

          return (
            <div key={c.id} className="group flex items-start justify-between gap-4 p-3 hover:bg-muted/50 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {c.full_name || "—"}
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
                <PhoneLink label="Tel" value={c.phone_work} />
                <PhoneLink label="Tel2" value={c.phone_work2} />
                <PhoneLink label="Mobil" value={c.mobile} />
                <PhoneLink label="Fax" value={c.fax} />
                <PhoneLink label="Pager" value={c.pager} />
                {c.email_display && (
                  <div className="text-sm">
                    <a href={`mailto:${c.email_display}`} className="text-primary hover:underline">{c.email_display}</a>
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
            <DialogDescription>Kontakt wird dauerhaft in der Datenbank gespeichert.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
            {EDIT_FIELDS.map(f => (
              <div key={f.key} className={f.half ? "" : "sm:col-span-2"}>
                <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                <Input
                  value={(addData[f.key as keyof typeof addData] as string) || ""}
                  onChange={e => updateAddField(f.key, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Abbrechen</Button>
            <Button onClick={addContact} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
