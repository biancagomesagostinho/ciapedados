import { Checkbox } from "@/components/ui/Checkbox";
import { serieDaTurma } from "@/lib/utils";

interface TurmaFilterProps {
  turmasDisponiveis: string[];
  selecionadas: string[];
  onAlternar: (turma: string) => void;
}

export function TurmaFilter({ turmasDisponiveis, selecionadas, onAlternar }: TurmaFilterProps) {
  const grupos = new Map<string, string[]>();
  turmasDisponiveis.forEach((turma) => {
    const serie = serieDaTurma(turma);
    grupos.set(serie, [...(grupos.get(serie) ?? []), turma]);
  });

  const series = Array.from(grupos.keys()).sort();

  if (turmasDisponiveis.length === 0) {
    return <p className="text-sm text-text-muted">Nenhuma turma disponível.</p>;
  }

  return (
    <div className="flex flex-wrap gap-6">
      {series.map((serie) => (
        <div key={serie}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{serie}</p>
          <div className="flex flex-col gap-1.5">
            {grupos.get(serie)!.map((turma) => (
              <label key={turma} className="flex items-center gap-2 text-sm text-text">
                <Checkbox checked={selecionadas.includes(turma)} onChange={() => onAlternar(turma)} />
                {turma}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
