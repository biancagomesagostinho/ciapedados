import { GraduationCap, BarChart3, Target, ListChecks, Search, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { supabaseConfigurado } from "@/lib/supabase";

const ICONES_FLUTUANTES = [
  { Icon: BarChart3, top: "14%", left: "10%", delay: "0s" },
  { Icon: Target, top: "10%", left: "84%", delay: "0.8s" },
  { Icon: GraduationCap, top: "55%", left: "4%", delay: "1.6s" },
  { Icon: ListChecks, top: "52%", left: "93%", delay: "0.4s" },
  { Icon: Search, top: "88%", left: "18%", delay: "1.2s" },
  { Icon: TrendingUp, top: "90%", left: "80%", delay: "2s" },
];

const BARRAS = [42, 68, 30, 80, 55];

export default function Login() {
  const { entrarComGoogle, erroAcesso } = useAuth();

  return (
    <div className="min-h-screen w-full bg-bg">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:flex-row">
        <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-[55%] lg:px-14 lg:py-0">
          <div className="mb-8 flex items-center gap-3">
            <GraduationCap size={34} className="text-gold" strokeWidth={1.8} />
            <div>
              <h1 className="font-serif text-3xl font-bold text-text">
                Radar <span className="text-gold">Acadêmico</span>
              </h1>
              <p className="mt-1 max-w-md text-sm text-text-muted">
                Gestão de dados educacionais com inteligência, previsão de riscos e planos de ação
                prescritivos.
              </p>
            </div>
          </div>

          <div className="relative h-[360px] w-full overflow-hidden rounded-2xl border border-border/50 dot-grid sm:h-[420px]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, rgb(var(--card)) 0%, rgb(var(--bg)) 70%)",
              }}
            />

            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {ICONES_FLUTUANTES.map((icone, i) => (
                <line
                  key={i}
                  x1="50"
                  y1="50"
                  x2={parseFloat(icone.left)}
                  y2={parseFloat(icone.top)}
                  stroke="rgb(var(--gold))"
                  strokeOpacity={0.25}
                  strokeWidth={0.3}
                  strokeDasharray="1.5 1.5"
                />
              ))}
            </svg>

            {ICONES_FLUTUANTES.map(({ Icon, top, left, delay }, i) => (
              <div
                key={i}
                className="animate-float absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-card shadow-sm"
                style={{ top, left, animationDelay: delay }}
              >
                <Icon size={18} className="text-gold" strokeWidth={1.8} />
              </div>
            ))}

            <div className="absolute left-1/2 top-1/2 w-[78%] max-w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border/60 bg-card shadow-md">
              <div className="flex items-center gap-1.5 border-b border-border/60 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-risk-alto/70" />
                <span className="h-2 w-2 rounded-full bg-risk-medio/70" />
                <span className="h-2 w-2 rounded-full bg-risk-baixo/70" />
              </div>
              <div className="flex items-end gap-4 p-4">
                <div className="flex h-20 flex-1 items-end gap-1.5">
                  {BARRAS.map((altura, i) => (
                    <div
                      key={i}
                      className={i % 2 === 0 ? "flex-1 rounded-t bg-gold/80" : "flex-1 rounded-t bg-risk-futuro/60"}
                      style={{ height: `${altura}%` }}
                    />
                  ))}
                </div>
                <svg width="70" height="56" viewBox="0 0 70 56">
                  <path
                    d="M 6 48 A 29 29 0 0 1 64 48"
                    fill="none"
                    stroke="rgb(var(--border))"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 6 48 A 29 29 0 0 1 64 48"
                    fill="none"
                    stroke="rgb(var(--gold))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="91"
                    strokeDashoffset="30"
                  />
                  <polyline
                    points="12,40 26,28 38,32 52,14"
                    fill="none"
                    stroke="rgb(var(--risk-baixo))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-center px-6 py-10 lg:w-[45%] lg:px-14 lg:py-0">
          <div className="w-full max-w-sm rounded-card border border-border bg-card p-8 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-bg">
                <GraduationCap size={28} className="text-gold" strokeWidth={1.8} />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-text">Bem-vindo!</h2>
              <p className="mt-2 text-sm text-text-muted">
                Faça login para acessar o Radar Acadêmico.
              </p>

              <Button onClick={entrarComGoogle} className="mt-6 w-full" size="lg" disabled={!supabaseConfigurado}>
                <GoogleIcon />
                Entrar com Google
              </Button>

              {!supabaseConfigurado && (
                <p className="mt-4 rounded-md border border-risk-medio/40 bg-risk-medio/10 px-3 py-2 text-xs text-risk-medio">
                  Supabase ainda não configurado neste ambiente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.
                </p>
              )}

              {erroAcesso && (
                <p className="mt-4 rounded-md border border-risk-alto/40 bg-risk-alto/10 px-3 py-2 text-sm text-risk-alto">
                  {erroAcesso}
                </p>
              )}

              <p className="mt-6 text-xs leading-relaxed text-text-muted">
                O acesso é liberado apenas para e-mails previamente autorizados pela coordenação.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18A13.9 13.9 0 0 1 10.9 24c0-1.45.25-2.86.69-4.18v-5.7H4.34A21.93 21.93 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}
