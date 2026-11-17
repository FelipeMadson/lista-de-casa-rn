/**
 * Entidade de domínio: não conhece React Native, SQLite nem formato de rede.
 * Os campos são somente leitura; alterações geram um objeto novo.
 */
export interface Item {
  /** Indefinido enquanto o item não foi gravado no banco. */
  readonly id?: number;
  readonly nome: string;
  readonly quantidade: number;
  readonly categoria: string;
  readonly observacao: string;
  readonly comprado: boolean;
  /** Verdadeiro quando a versão atual já foi enviada ao servidor. */
  readonly sincronizado: boolean;
  readonly criadoEm: Date;
  readonly atualizadoEm: Date;
}

export interface DadosNovoItem {
  nome: string;
  categoria: string;
  quantidade?: number;
  observacao?: string;
}

/** Cria um item ainda não gravado, com os valores padrão do domínio. */
export function novoItem(dados: DadosNovoItem, agora: Date = new Date()): Item {
  return {
    nome: dados.nome,
    categoria: dados.categoria,
    quantidade: dados.quantidade ?? 1,
    observacao: dados.observacao ?? '',
    comprado: false,
    sincronizado: false,
    criadoEm: agora,
    atualizadoEm: agora,
  };
}
