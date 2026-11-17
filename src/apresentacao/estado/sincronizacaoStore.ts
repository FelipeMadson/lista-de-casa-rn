import { createStore } from 'zustand/vanilla';

import type { ResultadoSincronizacao } from '../../dados/sincronizador';
import { mensagemDeErro } from './mensagemDeErro';

export interface SincronizacaoStore {
  emAndamento: boolean;
  /** Resultado da última tentativa, exibido em um aviso temporário. */
  mensagem: string | null;
  /** Muda a cada resultado, para o aviso reaparecer com a mesma mensagem. */
  versaoDaMensagem: number;
  sincronizar(): Promise<void>;
}

interface Dependencias {
  sincronizar(): Promise<ResultadoSincronizacao>;
  estaOnline(): boolean | null;
  /** Relê a lista para atualizar os ícones de "enviado". */
  aoConcluir(): Promise<void>;
}

export function criarSincronizacaoStore(dep: Dependencias) {
  return createStore<SincronizacaoStore>()((set, get) => {
    const informar = (mensagem: string) =>
      set({ emAndamento: false, mensagem, versaoDaMensagem: get().versaoDaMensagem + 1 });

    return {
      emAndamento: false,
      mensagem: null,
      versaoDaMensagem: 0,

      async sincronizar() {
        if (get().emAndamento) return;

        // Estado de rede desconhecido conta como offline: não arrisca o envio.
        if (dep.estaOnline() !== true) {
          informar('Sem conexão. As alterações continuam salvas no aparelho.');
          return;
        }

        set({ emAndamento: true });
        try {
          const { enviados, falhas } = await dep.sincronizar();
          informar(
            falhas === 0
              ? `Envio simulado: ${enviados} item(ns).`
              : `Envio simulado: ${enviados}; ${falhas} continua(m) pendente(s).`,
          );
        } catch (erro) {
          informar(`Falha inesperada: ${mensagemDeErro(erro)}`);
        }
        await dep.aoConcluir();
      },
    };
  });
}
