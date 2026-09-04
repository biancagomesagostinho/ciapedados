import * as XLSX from "xlsx";
import type { LinhaPlanilhaAluno } from "@/types";

export function baixarModelo() {
  const dados: LinhaPlanilhaAluno[] = [
    { "Nome do Aluno": "Maria da Silva", Turma: "1º Ano A", Nota: 7.5, Frequência: 92 },
  ];
  const planilha = XLSX.utils.json_to_sheet(dados);
  planilha["!cols"] = [{ wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 12 }];
  const livro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(livro, planilha, "Modelo");
  XLSX.writeFile(livro, "modelo_radar_academico.xlsx");
}

export async function lerPlanilha(arquivo: File): Promise<LinhaPlanilhaAluno[]> {
  const buffer = await arquivo.arrayBuffer();
  const livro = XLSX.read(buffer, { type: "array" });
  const primeiraAba = livro.SheetNames[0];
  const planilha = livro.Sheets[primeiraAba];
  const linhas = XLSX.utils.sheet_to_json<Record<string, unknown>>(planilha, { defval: null });

  return linhas
    .map((linha) => ({
      "Nome do Aluno": String(linha["Nome do Aluno"] ?? "").trim(),
      Turma: String(linha["Turma"] ?? "").trim(),
      Nota: Number(linha["Nota"]),
      Frequência: Number(linha["Frequência"] ?? linha["Frequencia"]),
    }))
    .filter((linha) => linha["Nome do Aluno"] && linha.Turma && !Number.isNaN(linha.Nota) && !Number.isNaN(linha.Frequência));
}
