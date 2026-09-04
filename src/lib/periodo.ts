export function anoDoPeriodo(periodo: string): number | null {
  const match = periodo.match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function ordinalDoPeriodo(periodo: string): number {
  const match = periodo.match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
}

export function compararPeriodos(a: string, b: string): number {
  const anoA = anoDoPeriodo(a) ?? 0;
  const anoB = anoDoPeriodo(b) ?? 0;
  if (anoA !== anoB) return anoA - anoB;
  const ordA = ordinalDoPeriodo(a);
  const ordB = ordinalDoPeriodo(b);
  if (ordA !== ordB) return ordA - ordB;
  return a.localeCompare(b, "pt-BR");
}

export function anosDisponiveis(periodos: string[]): number[] {
  const anos = new Set<number>();
  periodos.forEach((p) => {
    const ano = anoDoPeriodo(p);
    if (ano) anos.add(ano);
  });
  return Array.from(anos).sort((a, b) => a - b);
}
