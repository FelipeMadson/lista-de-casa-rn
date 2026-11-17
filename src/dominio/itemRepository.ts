import type { Item } from './item';

/**
 * Contrato que a camada de dados deve cumprir. O domínio define o que
 * precisa; a camada de dados decide como (SQLite, memória, rede).
 */
export interface ItemRepository {
  listar(): Promise<Item[]>;

  /** Insere (quando id é indefinido) ou atualiza. Devolve o item com id preenchido. */
  salvar(item: Item): Promise<Item>;

  excluir(id: number): Promise<void>;

  listarNaoSincronizados(): Promise<Item[]>;

  /** Marca como enviada a versão informada, se ela ainda for a atual. */
  marcarComoSincronizado(item: Item): Promise<void>;
}
