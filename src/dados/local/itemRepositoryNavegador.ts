import type { Item } from '../../dominio/item';
import type { ItemRepository } from '../../dominio/itemRepository';
import { itemDeLinha, itemParaLinha, type LinhaItem } from './itemMapper';

/** O que o repositório usa do localStorage do navegador. */
export interface Armazenamento {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
}

interface Conteudo {
  proximoId: number;
  itens: LinhaItem[];
}

const chaveItens = 'lista-de-casa:itens';
const chaveCriadoEm = 'lista-de-casa:criado_em';

/**
 * Implementação do mesmo contrato para a versão web (GitHub Pages), onde não
 * há SQLite. As linhas usam o mesmo formato da tabela "itens", e as regras de
 * gravação são as do repositório SQLite: toda gravação deixa o item pendente
 * e a marcação de envio só vale para a versão atual.
 */
export class ItemRepositoryNavegador implements ItemRepository {
  constructor(
    private readonly armazenamento: Armazenamento,
    private readonly agora: () => Date = () => new Date(),
  ) {
    if (armazenamento.getItem(chaveCriadoEm) === null) {
      armazenamento.setItem(chaveCriadoEm, this.agora().toISOString());
    }
  }

  private ler(): Conteudo {
    const texto = this.armazenamento.getItem(chaveItens);
    return texto ? (JSON.parse(texto) as Conteudo) : { proximoId: 1, itens: [] };
  }

  private gravar(conteudo: Conteudo): void {
    this.armazenamento.setItem(chaveItens, JSON.stringify(conteudo));
  }

  async lerMetadado(chave: string): Promise<string | null> {
    return chave === 'criado_em' ? this.armazenamento.getItem(chaveCriadoEm) : null;
  }

  async listar(): Promise<Item[]> {
    return this.ler().itens.map(itemDeLinha);
  }

  async salvar(item: Item): Promise<Item> {
    if (item.quantidade < 1 || item.quantidade > 99) {
      throw new Error('Quantidade fora do intervalo de 1 a 99.');
    }
    const conteudo = this.ler();
    const anterior = item.atualizadoEm.getTime();
    const atualizadoEm = new Date(Math.max(this.agora().getTime(), anterior + 1));
    const id = item.id ?? conteudo.proximoId;
    const pendente: Item = { ...item, id, sincronizado: false, atualizadoEm };
    const linha: LinhaItem = { id, ...itemParaLinha(pendente) };

    if (item.id === undefined) {
      conteudo.itens.push(linha);
      conteudo.proximoId = id + 1;
    } else {
      const posicao = conteudo.itens.findIndex((l) => l.id === id);
      if (posicao === -1) throw new Error(`O item ${id} não existe mais no aparelho.`);
      conteudo.itens[posicao] = linha;
    }
    this.gravar(conteudo);
    return pendente;
  }

  async excluir(id: number): Promise<void> {
    const conteudo = this.ler();
    this.gravar({ ...conteudo, itens: conteudo.itens.filter((l) => l.id !== id) });
  }

  async listarNaoSincronizados(): Promise<Item[]> {
    return this.ler().itens.filter((l) => l.sincronizado === 0).map(itemDeLinha);
  }

  async marcarComoSincronizado(item: Item): Promise<void> {
    const conteudo = this.ler();
    const linha = conteudo.itens.find(
      (l) => l.id === item.id && l.atualizado_em === item.atualizadoEm.getTime(),
    );
    if (!linha) return;
    linha.sincronizado = 1;
    this.gravar(conteudo);
  }
}
