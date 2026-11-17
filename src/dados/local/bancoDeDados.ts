/** Valor aceito como parâmetro de uma instrução SQL. */
export type ValorSql = string | number | null;

/**
 * Subconjunto da API do expo-sqlite usado pelo aplicativo. Depender desta
 * interface, e não da biblioteca, permite testar a camada de dados com o
 * SQLite do Node, sem aparelho nem emulador.
 */
export interface ConexaoSqlite {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    parametros: ValorSql[],
  ): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, parametros: ValorSql[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, parametros: ValorSql[]): Promise<T | null>;
  closeAsync(): Promise<void>;
}

/** Cada posição cria a versão seguinte do esquema (índice 0 → versão 1). */
const migracoes: ((db: ConexaoSqlite) => Promise<void>)[] = [
  async (db) => {
    await db.execAsync(`
      CREATE TABLE itens (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        nome          TEXT    NOT NULL,
        quantidade    INTEGER NOT NULL CHECK (quantidade BETWEEN 1 AND 99),
        categoria     TEXT    NOT NULL,
        observacao    TEXT    NOT NULL DEFAULT '',
        comprado      INTEGER NOT NULL DEFAULT 0,
        sincronizado  INTEGER NOT NULL DEFAULT 0,
        criado_em     INTEGER NOT NULL,
        atualizado_em INTEGER NOT NULL
      );
      CREATE INDEX idx_itens_sincronizado ON itens (sincronizado);
      CREATE TABLE metadados (
        chave TEXT PRIMARY KEY,
        valor TEXT NOT NULL
      );
    `);
    await db.runAsync('INSERT INTO metadados (chave, valor) VALUES (?, ?)', [
      'criado_em',
      new Date().toISOString(),
    ]);
  },
];

export const versaoDoEsquema = migracoes.length;
export const nomeDoArquivo = 'compras.db';

/** Abre o arquivo SQLite e aplica as migrações pendentes. */
export class BancoDeDados {
  private abertura: Promise<ConexaoSqlite> | null = null;

  constructor(private readonly abrirConexao: () => Promise<ConexaoSqlite>) {}

  /** Abre uma única vez; chamadas seguintes reutilizam a mesma conexão. */
  abrir(): Promise<ConexaoSqlite> {
    if (!this.abertura) {
      this.abertura = this.abrirEMigrar().catch((erro) => {
        this.abertura = null; // permite tentar de novo depois de uma falha
        throw erro;
      });
    }
    return this.abertura;
  }

  private async abrirEMigrar(): Promise<ConexaoSqlite> {
    const db = await this.abrirConexao();
    await db.execAsync('PRAGMA foreign_keys = ON');
    const linha = await db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version',
      [],
    );
    let versao = linha?.user_version ?? 0;
    // A versão gravada em user_version indica quais migrações já rodaram.
    while (versao < versaoDoEsquema) {
      await db.execAsync('BEGIN');
      try {
        await migracoes[versao](db);
        versao++;
        await db.execAsync(`PRAGMA user_version = ${versao}`);
        await db.execAsync('COMMIT');
      } catch (erro) {
        await db.execAsync('ROLLBACK');
        throw erro;
      }
    }
    return db;
  }

  async lerMetadado(chave: string): Promise<string | null> {
    const db = await this.abrir();
    const linha = await db.getFirstAsync<{ valor: string }>(
      'SELECT valor FROM metadados WHERE chave = ? LIMIT 1',
      [chave],
    );
    return linha?.valor ?? null;
  }

  async fechar(): Promise<void> {
    const abertura = this.abertura;
    this.abertura = null;
    if (abertura) await (await abertura).closeAsync();
  }
}
