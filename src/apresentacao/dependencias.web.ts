import { ItemRepositoryNavegador } from '../dados/local/itemRepositoryNavegador';
import { compor } from './composicao';

// ---------------------------------------------------------------------------
// Raiz de composição na web (demonstração no GitHub Pages). Só a fonte de
// dados muda: o mesmo contrato ItemRepository, guardado no localStorage.
// Telas, estado e regras são exatamente os do aplicativo Android.
// ---------------------------------------------------------------------------

const repositorio = new ItemRepositoryNavegador(window.localStorage);

export const {
  banco,
  dispositivoNativo,
  conectividadeStore,
  itensStore,
  sincronizacaoStore,
  useItens,
  useConectividade,
  useSincronizacao,
} = compor(repositorio, repositorio);
