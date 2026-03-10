import { Link } from "react-router-dom";
import uksBuildingImg from "@/assets/uks-building.png";
import { Newspaper, Pill, Phone, FileText, FolderOpen, FlaskConical } from "lucide-react";

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
  {
    to: "/studies",
    icon: FlaskConical,
    title: "Studienportal",
    desc: "Aktuelle klinische Studien mit Zielpopulation & Details.",
    color: "bg-primary/10 text-primary",
  },
];

export default function Index() {
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
    </div>
  );
}
