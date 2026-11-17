import type { Item } from './item';

export const tamanhoMinimoNome = 2;
export const tamanhoMaximoNome = 40;
export const quantidadeMinima = 1;
export const quantidadeMaxima = 99;

/** Devolve a mensagem de erro, ou null quando o nome é válido. */
export function validarNome(nome: string): string | null {
  const texto = nome.trim();
  if (texto.length === 0) return 'Informe o nome do item.';
  if (texto.length < tamanhoMinimoNome) {
    return `Use ao menos ${tamanhoMinimoNome} caracteres.`;
  }
  if (texto.length > tamanhoMaximoNome) {
    return `Use no máximo ${tamanhoMaximoNome} caracteres.`;
  }
  return null;
}

/** Soma a variação à quantidade, sem sair do intervalo permitido. */
export function ajustarQuantidade(atual: number, variacao: number): number {
  return Math.min(quantidadeMaxima, Math.max(quantidadeMinima, atual + variacao));
}

const comparadorDeTexto = (a: string, b: string) =>
  a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });

/** Itens a comprar primeiro; dentro de cada grupo, por categoria e por nome. */
export function ordenarParaExibicao(itens: Iterable<Item>): Item[] {
  return [...itens].sort((a, b) => {
    if (a.comprado !== b.comprado) return a.comprado ? 1 : -1;
    const porCategoria = comparadorDeTexto(a.categoria, b.categoria);
    if (porCategoria !== 0) return porCategoria;
    return comparadorDeTexto(a.nome, b.nome);
  });
}

export interface Resumo {
  readonly total: number;
  readonly comprados: number;
  readonly aguardandoEnvio: number;
  /** Fração comprada, de 0 a 1. */
  readonly progresso: number;
}

export function resumir(itens: Iterable<Item>): Resumo {
  let total = 0;
  let comprados = 0;
  let aguardandoEnvio = 0;
  for (const item of itens) {
    total++;
    if (item.comprado) comprados++;
    if (!item.sincronizado) aguardandoEnvio++;
  }
  return {
    total,
    comprados,
    aguardandoEnvio,
    progresso: total === 0 ? 0 : comprados / total,
  };
}
