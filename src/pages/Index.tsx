import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import uksBuildingImg from "@/assets/uks-building.png";
import { Newspaper, Pill, Phone, FileText, FolderOpen, FlaskConical, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Study {
  id: string;
  name: string;
  phase: string;
  status: string;
  population: string;
  nctId?: string;
}

const MODULES = [
  {
    to: "/news",
    icon: Newspaper,
    title: "News",
    desc: "Tägliche PubMed-Treffer mit Filtern, Abstracts & Export.",
    color: "bg-info-blue-light text-info-blue",
  },
  {
    to: "/support",
    icon: Pill,
    title: "Supportivtherapie",
    desc: "Medikamente suchen, auswählen & druckbares Merkblatt erstellen.",
    color: "bg-clinical-green-light text-clinical-green",
  },
  {
    to: "/directory",
    icon: Phone,
    title: "Telefonverzeichnis",
    desc: "Suche & schnelles Kopieren von Nummern.",
    color: "bg-warm-amber-light text-warm-amber",
  },
  {
    to: "/snippets",
    icon: FileText,
    title: "Textbausteine",
    desc: "Vorlagen per Klick kopieren – mit Suche & Filtern.",
    color: "bg-secondary text-navy",
  },
  {
    to: "/docs",
    icon: FolderOpen,
    title: "Dokumente & Links",
    desc: "SOPs, PDFs und externe Referenzen.",
    color: "bg-muted text-navy-light",
  },
];

export default function Index() {
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
    <div>
      {/* Hero */}
      <section className="relative h-[340px] sm:h-[400px] overflow-hidden">
        <img
          src={uksBuildingImg}
          alt="Universitätsklinikum des Saarlandes"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 flex items-center h-full">
          <div className="text-primary-foreground max-w-xl">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-3">
              Lungenkrebszentrum
            </h1>
            <p className="text-lg sm:text-xl opacity-90 leading-relaxed">
              Interne Plattform · Klinik für Innere Medizin V – Pneumologie, Allergologie & Intensivmedizin
            </p>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className="group bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className={`inline-flex p-3 rounded-lg mb-4 ${m.color}`}>
                <m.icon className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {m.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Aktuelle Studien */}
      {studies.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="inline-flex p-3 rounded-lg bg-primary/10 text-primary">
                <FlaskConical className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Aktuelle Studien</h2>
                <p className="text-sm text-muted-foreground">{studies.length} laufende Studie{studies.length !== 1 ? "n" : ""}</p>
              </div>
            </div>
            <div className="space-y-3">
              {studies.map((s) => (
                <div
                  key={s.id}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/20 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 mt-1 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-card-foreground">{s.name}</span>
                      {s.phase && <Badge variant="secondary" className="text-xs">{s.phase}</Badge>}
                      {s.status && <Badge className="text-xs bg-clinical-green-light text-clinical-green border-0">{s.status}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.population}</p>
                    {s.nctId && (
                      <a
                        href={`https://clinicaltrials.gov/study/${s.nctId}`}
                        target="_blank"
                        rel="noopener"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        {s.nctId}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
