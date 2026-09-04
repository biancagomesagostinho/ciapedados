import { NavLink } from "react-router-dom";
import { GraduationCap, Moon, Sun, AlertTriangle, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { saudacaoPorHorario } from "@/lib/utils";
import { useAlertaAltoRisco } from "@/hooks/useAlertaAltoRisco";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { label: string; to: string; papeis: Array<"professor" | "coordenador"> }[] = [
  { label: "Análise Descritiva", to: "/descritiva", papeis: ["professor", "coordenador"] },
  { label: "Análise Preditiva", to: "/preditiva", papeis: ["professor", "coordenador"] },
  { label: "Análise Prescritiva", to: "/prescritiva", papeis: ["professor", "coordenador"] },
  { label: "Enviar Planilha", to: "/enviar", papeis: ["professor", "coordenador"] },
  { label: "Aprovações", to: "/aprovacoes", papeis: ["coordenador"] },
  { label: "Gestão de Usuários", to: "/usuarios", papeis: ["coordenador"] },
  { label: "Catálogo de Ações", to: "/catalogo", papeis: ["coordenador"] },
];

export function Header() {
  const { profile, sair } = useAuth();
  const { tema, alternarTema } = useTheme();
  const alertaAltoRisco = useAlertaAltoRisco();

  const itensVisiveis = NAV_ITEMS.filter((item) => profile && item.papeis.includes(profile.papel));

  return (
    <header className="border-b border-border bg-card/60">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2.5">
            <GraduationCap size={26} className="text-gold" strokeWidth={1.8} />
            <span className="font-serif text-xl font-bold text-text">Radar Acadêmico</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={alternarTema}
              className="rounded-full border border-border p-2 text-text-muted transition-colors hover:bg-border/20"
              aria-label="Alternar tema"
            >
              {tema === "escuro" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={sair}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs text-text-muted transition-colors hover:bg-border/20"
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-text">
              {saudacaoPorHorario()}, {profile?.nome ?? ""}
            </h1>
          </div>

          {alertaAltoRisco > 0 && (
            <div className="flex items-center gap-3 rounded-card border border-risk-alto/40 bg-risk-alto/10 px-4 py-3">
              <AlertTriangle size={20} className="shrink-0 text-risk-alto" />
              <div>
                <p className="text-sm font-semibold text-risk-alto">
                  {alertaAltoRisco} estudante{alertaAltoRisco > 1 ? "s" : ""} precisam de atenção imediata
                </p>
                <p className="text-xs text-text-muted">
                  Notas e frequência indicam os casos prioritários.
                </p>
              </div>
            </div>
          )}
        </div>

        <nav className="flex flex-wrap gap-1 border-t border-border py-2">
          {itensVisiveis.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-gold/15 text-gold"
                    : "text-text-muted hover:bg-border/20 hover:text-text"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
