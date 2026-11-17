import type { Item } from '../../dominio/item';
import type { ItemRepository } from '../../dominio/itemRepository';
import type { BancoDeDados } from './bancoDeDados';
import { itemDeLinha, itemParaLinha, type LinhaItem } from './itemMapper';

export class ItemRepositorySqlite implements ItemRepository {
  /** Relógio injetável: os testes controlam o valor de atualizado_em. */
  constructor(
    private readonly banco: BancoDeDados,
    private readonly agora: () => Date = () => new Date(),
  ) {}

  async listar(): Promise<Item[]> {
    const db = await this.banco.abrir();
    const linhas = await db.getAllAsync<LinhaItem>('SELECT * FROM itens', []);
    return linhas.map(itemDeLinha);
  }

  async salvar(item: Item): Promise<Item> {
    const db = await this.banco.abrir();
    // Toda gravação local deixa o item pendente de envio ao servidor. O
    // horário nunca repete o anterior, para a condição de sincronização valer.
    const anterior = item.atualizadoEm.getTime();
    const atualizadoEm = new Date(Math.max(this.agora().getTime(), anterior + 1));
    const pendente: Item = { ...item, sincronizado: false, atualizadoEm };
    const l = itemParaLinha(pendente);
    const valores = [
      l.nome,
      l.quantidade,
      l.categoria,
      l.observacao,
      l.comprado,
      l.sincronizado,
      l.criado_em,
      l.atualizado_em,
    ];

    if (pendente.id === undefined) {
      const resultado = await db.runAsync(
        `INSERT INTO itens (nome, quantidade, categoria, observacao, comprado,
           sincronizado, criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        valores,
      );
      return { ...pendente, id: resultado.lastInsertRowId };
    }

    const resultado = await db.runAsync(
      `UPDATE itens SET nome = ?, quantidade = ?, categoria = ?, observacao = ?,
         comprado = ?, sincronizado = ?, criado_em = ?, atualizado_em = ?
       WHERE id = ?`,
      [...valores, pendente.id],
    );
    if (resultado.changes === 0) {
      throw new Error(`O item ${pendente.id} não existe mais no aparelho.`);
    }
    return pendente;
  }

  async excluir(id: number): Promise<void> {
    const db = await this.banco.abrir();
    await db.runAsync('DELETE FROM itens WHERE id = ?', [id]);
  }

  async listarNaoSincronizados(): Promise<Item[]> {
    const db = await this.banco.abrir();
    const linhas = await db.getAllAsync<LinhaItem>(
      'SELECT * FROM itens WHERE sincronizado = 0',
      [],
    );
    return linhas.map(itemDeLinha);
  }

  async marcarComoSincronizado(item: Item): Promise<void> {
    if (item.id === undefined) return;
    const db = await this.banco.abrir();
    // A condição em atualizado_em impede marcar como enviada uma versão que
    // foi alterada enquanto o envio estava em andamento.
    await db.runAsync(
      'UPDATE itens SET sincronizado = 1 WHERE id = ? AND atualizado_em = ?',
      [item.id, item.atualizadoEm.getTime()],
    );
  }
}
