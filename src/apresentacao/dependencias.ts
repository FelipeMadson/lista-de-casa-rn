import { openDatabaseAsync } from 'expo-sqlite';
import { useStore } from 'zustand';

import { BancoDeDados, nomeDoArquivo } from '../dados/local/bancoDeDados';
import { ItemRepositorySqlite } from '../dados/local/itemRepositorySqlite';
import { DispositivoNativo } from '../dados/plataforma/dispositivoNativo';
import { ServicoRemotoSimulado } from '../dados/remoto/servicoRemotoSimulado';
import { Sincronizador } from '../dados/sincronizador';
import type { ItemRepository } from '../dominio/itemRepository';
import { criarConectividadeStore, type ConectividadeStore } from './estado/conectividadeStore';
import { criarItensStore, type ItensStore } from './estado/itensStore';
import {
  criarSincronizacaoStore,
  type SincronizacaoStore,
} from './estado/sincronizacaoStore';

// ---------------------------------------------------------------------------
// Raiz de composição: o único ponto do aplicativo que conhece as classes
// concretas da camada de dados. As telas usam apenas os hooks abaixo.
// ---------------------------------------------------------------------------

export const banco = new BancoDeDados(() => openDatabaseAsync(nomeDoArquivo));

const repositorio: ItemRepository = new ItemRepositorySqlite(banco);
const sincronizador = new Sincronizador(repositorio, new ServicoRemotoSimulado());

export const dispositivoNativo = new DispositivoNativo();

export const conectividadeStore = criarConectividadeStore();
export const itensStore = criarItensStore(repositorio);
export const sincronizacaoStore = criarSincronizacaoStore({
  sincronizar: () => sincronizador.sincronizar(),
  estaOnline: () => conectividadeStore.getState().online,
  aoConcluir: () => itensStore.getState().carregar(),
});

// Hooks com seletor: o componente só renderiza de novo quando a fatia
// escolhida muda (equivalente ao select do Riverpod).
export const useItens = <T>(seletor: (s: ItensStore) => T) => useStore(itensStore, seletor);
export const useConectividade = <T>(seletor: (s: ConectividadeStore) => T) =>
  useStore(conectividadeStore, seletor);
export const useSincronizacao = <T>(seletor: (s: SincronizacaoStore) => T) =>
  useStore(sincronizacaoStore, seletor);
