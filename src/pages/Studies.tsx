import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, ChevronRight } from "lucide-react";

interface Study {
  id: string;
  name: string;
  phase: string;
  status: string;
  population: string;
  nctId?: string;
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Studienportal</h1>
        <p className="text-sm text-muted-foreground">{studies.length} aktuelle Studie{studies.length !== 1 ? "n" : ""}</p>
      </div>

      <div className="space-y-3">
        {studies.map((s) => (
          <div
            key={s.id}
            className="flex items-start gap-3 p-5 rounded-lg bg-card border border-border shadow-sm hover:border-primary/20 transition-colors"
          >
            <div className="inline-flex p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-card-foreground text-lg">{s.name}</span>
                {s.phase && <Badge variant="secondary" className="text-xs">{s.phase}</Badge>}
                {s.status && <Badge className="text-xs bg-clinical-green-light text-clinical-green border-0">{s.status}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.population}</p>
              {s.nctId && (
                <a
                  href={`https://clinicaltrials.gov/study/${s.nctId}`}
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-primary hover:underline mt-2 inline-block"
                >
                  {s.nctId} → ClinicalTrials.gov
                </a>
              )}
            </div>
          </div>
        ))}
        {studies.length === 0 && (
          <p className="text-muted-foreground text-sm">Keine Studien vorhanden.</p>
        )}
      </div>
    </div>
  );
}