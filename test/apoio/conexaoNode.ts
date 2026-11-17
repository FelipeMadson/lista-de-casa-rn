import type { ConexaoSqlite, ValorSql } from '../../src/dados/local/bancoDeDados';

// node:sqlite é carregado pelo próprio Node (22.5 ou superior), fora do
// sistema de módulos do Jest. Assim os testes usam um SQLite real.
type DatabaseSync = import('node:sqlite').DatabaseSync;
const { DatabaseSync } = process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite');

/**
 * Adapta o SQLite do Node à mesma interface que o expo-sqlite cumpre no
 * aparelho. O SQL testado aqui é exatamente o que roda no Android.
 */
export class ConexaoNode implements ConexaoSqlite {
  readonly db: DatabaseSync;

  constructor(caminho = ':memory:') {
    this.db = new DatabaseSync(caminho);
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, parametros: ValorSql[]) {
    const r = this.db.prepare(sql).run(...parametros);
    return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
  }

  async getAllAsync<T>(sql: string, parametros: ValorSql[]): Promise<T[]> {
    return this.db.prepare(sql).all(...parametros) as T[];
  }

  async getFirstAsync<T>(sql: string, parametros: ValorSql[]): Promise<T | null> {
    return (this.db.prepare(sql).get(...parametros) as T | undefined) ?? null;
  }

  async closeAsync(): Promise<void> {
    this.db.close();
  }
}
