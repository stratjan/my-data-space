import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { NewsItem } from "@/pages/News";

const STUDY_COLORS: Record<string, string> = {
  Prospective: "border-l-clinical-green bg-clinical-green-light/50 text-clinical-green",
  Review: "border-l-info-blue bg-info-blue-light/50 text-info-blue",
  Guideline: "border-l-warm-amber bg-warm-amber-light/50 text-warm-amber",
  Preclinical: "border-l-[hsl(var(--purple))] bg-[hsl(var(--purple-light))]/50 text-[hsl(var(--purple))]",
  Other: "border-l-border bg-muted/50 text-muted-foreground",
};

function StudyBadge({ study }: { study: string }) {
  const cls = STUDY_COLORS[study] || STUDY_COLORS.Other;
  return <Badge variant="outline" className={`${cls} border-0 text-xs`}>{study}</Badge>;
}

export default function NewsCard({ item, isNew }: { item: NewsItem; isNew: boolean }) {
  const [showAbstract, setShowAbstract] = useState(false);
  const study = item.study_class || "Other";
  const borderColor = study === "Prospective" ? "border-l-clinical-green"
    : study === "Review" ? "border-l-info-blue"
    : study === "Guideline" ? "border-l-warm-amber"
    : study === "Preclinical" ? "border-l-[hsl(var(--purple))]"
    : "border-l-border";

  return (
    <article
      className={`bg-card border rounded-lg p-4 shadow-sm border-l-4 ${borderColor} animate-fade-in cursor-pointer`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) return;
        if (item.abstract) setShowAbstract(!showAbstract);
      }}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {isNew && <Star className="h-4 w-4 text-warm-amber shrink-0 mt-1 fill-warm-amber" />}
            <h3 className="font-semibold text-card-foreground leading-snug">{item.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">{item.journal}</span>
            {" · "}
            {item.pubdate ? new Date(item.pubdate).toLocaleDateString("de-DE") : "—"}
            {item.is_oa === true && <span className="ml-1 text-clinical-green font-medium">· OA</span>}
          </p>
          <div className="mt-2 flex gap-1.5 flex-wrap">
            <StudyBadge study={study} />
            {item.entity && <Badge variant="secondary" className="text-xs">{item.entity}</Badge>}
            {item.trial_type && <Badge variant="secondary" className="text-xs">{item.trial_type}</Badge>}
          </div>
        </div>
        <div className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
          {item.metric_value != null ? `${item.metric_name}: ${item.metric_value}` : "—"}
        </div>
      </div>

      {/* Links */}
      <div className="mt-3 flex gap-3 text-sm">
        <a href={item.url_pubmed} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
          PubMed <ExternalLink className="h-3 w-3" />
        </a>
        {item.url_doi && (
          <a href={item.url_doi} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
            DOI <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {item.oa_url && (
          <a href={item.oa_url} target="_blank" rel="noopener" className="text-clinical-green hover:underline inline-flex items-center gap-1">
            Volltext <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {item.abstract && (
          <button className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 ml-auto">
            {showAbstract ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Abstract
          </button>
        )}
      </div>

      {/* Abstract */}
      {showAbstract && item.abstract && (
        <div className="mt-3 bg-muted rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
          {item.abstract}
        </div>
      )}
    </article>
  );
}
