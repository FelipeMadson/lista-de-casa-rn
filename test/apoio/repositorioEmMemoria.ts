import type { Item } from '../../src/dominio/item';
import type { ItemRepository } from '../../src/dominio/itemRepository';

/** Repositório sem banco, para testar o estado da interface isoladamente. */
export class RepositorioEmMemoria implements ItemRepository {
  private itens = new Map<number, Item>();
  private proximoId = 1;
  private relogio = 1_000;
  falharAoExcluir = false;
  falharAoListar = false;

  async listar(): Promise<Item[]> {
    if (this.falharAoListar) throw new Error('Disco indisponível.');
    return [...this.itens.values()];
  }

  async salvar(item: Item): Promise<Item> {
    const id = item.id ?? this.proximoId++;
    const salvo: Item = { ...item, id, sincronizado: false, atualizadoEm: new Date(this.relogio++) };
    this.itens.set(id, salvo);
    return salvo;
  }

  async excluir(id: number): Promise<void> {
    if (this.falharAoExcluir) throw new Error('Falha ao excluir.');
    this.itens.delete(id);
  }

  async listarNaoSincronizados(): Promise<Item[]> {
    return [...this.itens.values()].filter((i) => !i.sincronizado);
  }

  async marcarComoSincronizado(item: Item): Promise<void> {
    const atual = item.id === undefined ? undefined : this.itens.get(item.id);
    if (atual && atual.atualizadoEm.getTime() === item.atualizadoEm.getTime()) {
      this.itens.set(atual.id!, { ...atual, sincronizado: true });
    }
  }
}
