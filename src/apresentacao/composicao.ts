import { useStore } from 'zustand';

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

/** Onde ficam os metadados do armazenamento local (data de criação). */
export interface FonteDeMetadados {
  lerMetadado(chave: string): Promise<string | null>;
}

/**
 * Monta stores e serviços a partir do armazenamento escolhido pela
 * plataforma. As telas não sabem qual implementação está por trás.
 */
export function compor(repositorio: ItemRepository, banco: FonteDeMetadados) {
  const sincronizador = new Sincronizador(repositorio, new ServicoRemotoSimulado());

  const conectividadeStore = criarConectividadeStore();
  const itensStore = criarItensStore(repositorio);
  const sincronizacaoStore = criarSincronizacaoStore({
    sincronizar: () => sincronizador.sincronizar(),
    estaOnline: () => conectividadeStore.getState().online,
    aoConcluir: () => itensStore.getState().carregar(),
  });

  return {
    banco,
    dispositivoNativo: new DispositivoNativo(),
    conectividadeStore,
    itensStore,
    sincronizacaoStore,
    // Hooks com seletor: o componente só renderiza de novo quando a fatia
    // escolhida muda (equivalente ao select do Riverpod).
    useItens: <T>(seletor: (s: ItensStore) => T) => useStore(itensStore, seletor),
    useConectividade: <T>(seletor: (s: ConectividadeStore) => T) =>
      useStore(conectividadeStore, seletor),
    useSincronizacao: <T>(seletor: (s: SincronizacaoStore) => T) =>
      useStore(sincronizacaoStore, seletor),
  };
}
