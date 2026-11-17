import { openDatabaseAsync } from 'expo-sqlite';

import { BancoDeDados, nomeDoArquivo } from '../dados/local/bancoDeDados';
import { ItemRepositorySqlite } from '../dados/local/itemRepositorySqlite';
import { compor } from './composicao';

// ---------------------------------------------------------------------------
// Raiz de composição no Android: o único ponto do aplicativo que conhece as
// classes concretas da camada de dados. Na web, o Metro usa
// dependencias.web.ts no lugar deste arquivo.
// ---------------------------------------------------------------------------

const banco = new BancoDeDados(() => openDatabaseAsync(nomeDoArquivo));

export const {
  dispositivoNativo,
  conectividadeStore,
  itensStore,
  sincronizacaoStore,
  useItens,
  useConectividade,
  useSincronizacao,
} = compor(new ItemRepositorySqlite(banco), banco);

export { banco };
