import type { Item } from '../../dominio/item';

// Conversão entre a entidade de domínio e uma linha da tabela "itens".
// SQLite não tem tipos booleano nem data: usam-se 0/1 e milissegundos.

export interface LinhaItem {
  id: number;
  nome: string;
  quantidade: number;
  categoria: string;
  observacao: string;
  comprado: number;
  sincronizado: number;
  criado_em: number;
  atualizado_em: number;
}

export type LinhaItemSemId = Omit<LinhaItem, 'id'>;

export function itemParaLinha(item: Item): LinhaItemSemId {
  return {
    nome: item.nome,
    quantidade: item.quantidade,
    categoria: item.categoria,
    observacao: item.observacao,
    comprado: item.comprado ? 1 : 0,
    sincronizado: item.sincronizado ? 1 : 0,
    criado_em: item.criadoEm.getTime(),
    atualizado_em: item.atualizadoEm.getTime(),
  };
}

export function itemDeLinha(linha: LinhaItem): Item {
  return {
    id: linha.id,
    nome: linha.nome,
    quantidade: linha.quantidade,
    categoria: linha.categoria,
    observacao: linha.observacao,
    comprado: linha.comprado === 1,
    sincronizado: linha.sincronizado === 1,
    criadoEm: new Date(linha.criado_em),
    atualizadoEm: new Date(linha.atualizado_em),
  };
}
