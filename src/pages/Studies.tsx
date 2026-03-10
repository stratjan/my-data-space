import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FlaskConical, ChevronDown, ChevronUp, CheckCircle2, XCircle, FileDown } from "lucide-react";

interface StudyDocument {
  label: string;
  url: string;
}

interface Study {
  id: string;
  name: string;
  phase: string;
  status: string;
  population: string;
  nctId?: string;
  documents?: StudyDocument[];
  inclusion?: string[];
  exclusion?: string[];
}

function StudyCard({ study }: { study: Study }) {
  const [open, setOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState<Record<number, boolean>>({});
  const [checkedEx, setCheckedEx] = useState<Record<number, boolean>>({});

  const toggleIn = (i: number) => setCheckedIn((prev) => ({ ...prev, [i]: !prev[i] }));
  const toggleEx = (i: number) => setCheckedEx((prev) => ({ ...prev, [i]: !prev[i] }));

  const inclusionCount = study.inclusion?.length ?? 0;
  const exclusionCount = study.exclusion?.length ?? 0;
  const checkedInCount = Object.values(checkedIn).filter(Boolean).length;
  const checkedExCount = Object.values(checkedEx).filter(Boolean).length;

  return (
    <div className="rounded-xl bg-card border border-border shadow-sm overflow-hidden transition-colors hover:border-primary/20">
      {/* Header – always visible */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left p-5 flex items-start gap-3 cursor-pointer"
      >
        <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
          <FlaskConical className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-card-foreground text-lg">{study.name}</span>
            {study.phase && <Badge variant="secondary" className="text-xs">{study.phase}</Badge>}
            {study.status && (
              <Badge className="text-xs bg-clinical-green-light text-clinical-green border-0">
                {study.status}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{study.population}</p>
            {study.nctId && (
              <a
                href={`https://clinicaltrials.gov/study/${study.nctId}`}
                target="_blank"
                rel="noopener"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                {study.nctId} → ClinicalTrials.gov
              </a>
            )}
            {study.documents && study.documents.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {study.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener"
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    {doc.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        <div className="shrink-0 text-muted-foreground mt-1">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* Expandable criteria */}
      {open && (study.inclusion?.length || study.exclusion?.length) && (
        <div className="border-t px-5 pb-5 pt-4 space-y-6 animate-fade-in">
          {/* Inclusion */}
          {study.inclusion && study.inclusion.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-clinical-green" />
                <h3 className="font-semibold text-card-foreground">
                  Einschlusskriterien
                </h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {checkedInCount} / {inclusionCount}
                </span>
              </div>
              <div className="space-y-2">
                {study.inclusion.map((crit, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checkedIn[i]
                        ? "bg-clinical-green-light/50 border-clinical-green/30"
                        : "bg-muted/30 border-border/50 hover:bg-muted/60"
                    }`}
                  >
                    <Checkbox
                      checked={!!checkedIn[i]}
                      onCheckedChange={() => toggleIn(i)}
                      className="mt-0.5 shrink-0"
                    />
                    <span
                      className={`text-sm leading-relaxed ${
                        checkedIn[i] ? "text-muted-foreground line-through" : "text-card-foreground"
                      }`}
                    >
                      {crit}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Exclusion */}
          {study.exclusion && study.exclusion.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-card-foreground">
                  Ausschlusskriterien
                </h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {checkedExCount} / {exclusionCount}
                </span>
              </div>
              <div className="space-y-2">
                {study.exclusion.map((crit, i) => (
                  <label
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checkedEx[i]
                        ? "bg-destructive/5 border-destructive/20"
                        : "bg-muted/30 border-border/50 hover:bg-muted/60"
                    }`}
                  >
                    <Checkbox
                      checked={!!checkedEx[i]}
                      onCheckedChange={() => toggleEx(i)}
                      className="mt-0.5 shrink-0"
                    />
                    <span
                      className={`text-sm leading-relaxed ${
                        checkedEx[i] ? "text-muted-foreground line-through" : "text-card-foreground"
                      }`}
                    >
                      {crit}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Studies() {
  const [studies, setStudies] = useState<Study[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/studies/studies.json", { cache: "no-store" });
        if (r.ok && (r.headers.get("content-type") || "").includes("json")) {
          const data = await r.json();
          setStudies(Array.isArray(data) ? data : data.items || []);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Studienportal</h1>
        <p className="text-sm text-muted-foreground">
          {studies.length} aktuelle Studie{studies.length !== 1 ? "n" : ""} – Klicken zum Öffnen der Ein-/Ausschlusskriterien
        </p>
      </div>

      <div className="space-y-4">
        {studies.map((s) => (
          <StudyCard key={s.id} study={s} />
        ))}
        {studies.length === 0 && (
          <p className="text-muted-foreground text-sm">Keine Studien vorhanden.</p>
        )}
      </div>
    </div>
  );
}