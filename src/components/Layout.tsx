import { Link, useLocation } from "react-router-dom";
import logoOwl from "@/assets/logo-owl.png";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { to: "/", label: "Start" },
  { to: "/news", label: "News" },
  { to: "/support", label: "Supportivtherapie" },
  { to: "/directory", label: "Telefonverzeichnis" },
  { to: "/snippets", label: "Textbausteine" },
  { to: "/docs", label: "Dokumente" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-lg no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <img src={logoOwl} alt="LKZ Logo" className="h-10 w-10 rounded bg-primary-foreground/10 p-0.5 object-contain" />
              <div className="hidden sm:block">
                <div className="text-sm font-bold tracking-wide leading-tight">Lungenkrebszentrum</div>
                <div className="text-xs opacity-80 leading-tight">Universitätsklinikum des Saarlandes</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.to
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/75 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 rounded-md hover:bg-primary-foreground/10"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-primary-foreground/10 pb-3 px-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.to
                    ? "bg-primary-foreground/20"
                    : "text-primary-foreground/75 hover:bg-primary-foreground/10"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground/60 text-xs py-4 text-center no-print">
        <p>Lungenkrebszentrum · Universitätsklinikum des Saarlandes · Intern</p>
      </footer>
    </div>
  );
}
