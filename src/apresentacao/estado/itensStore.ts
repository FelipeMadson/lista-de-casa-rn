import { createStore } from 'zustand/vanilla';

import type { Item } from '../../dominio/item';
import type { ItemRepository } from '../../dominio/itemRepository';
import { ordenarParaExibicao } from '../../dominio/regrasItem';
import { mensagemDeErro } from './mensagemDeErro';

/** Os três estados clássicos de uma tela que lê dados (Aula 4). */
export type EstadoLista =
  | { status: 'carregando' }
  | { status: 'pronto'; itens: Item[] }
  | { status: 'erro'; mensagem: string };

export interface ItensStore {
  lista: EstadoLista;
  carregar(): Promise<void>;
  salvar(item: Item): Promise<Item>;
  alternarComprado(item: Item): Promise<void>;
  excluir(item: Item): Promise<void>;
}

/**
 * Estado da lista exibida na tela principal. Recebe o repositório pelo
 * contrato do domínio: não sabe se os dados vêm do SQLite ou da memória.
 */
export function criarItensStore(repositorio: ItemRepository) {
  return createStore<ItensStore>()((set, get) => {
    const recarregar = async () => {
      set({
        lista: { status: 'pronto', itens: ordenarParaExibicao(await repositorio.listar()) },
      });
    };

    return {
      lista: { status: 'carregando' },

      async carregar() {
        // Só mostra o indicador na primeira leitura ou depois de um erro;
        // recargas posteriores mantêm a lista visível.
        if (get().lista.status !== 'pronto') set({ lista: { status: 'carregando' } });
        try {
          await recarregar();
        } catch (erro) {
          set({ lista: { status: 'erro', mensagem: mensagemDeErro(erro) } });
        }
      },

      async salvar(item) {
        const salvo = await repositorio.salvar(item);
        await recarregar();
        return salvo;
      },

      async alternarComprado(item) {
        await get().salvar({ ...item, comprado: !item.comprado });
      },

      async excluir(item) {
        const id = item.id;
        if (id === undefined) return;
        // Remoção otimista: o cartão some de imediato, como o gesto exige.
        const atual = get().lista;
        if (atual.status === 'pronto') {
          set({ lista: { status: 'pronto', itens: atual.itens.filter((i) => i.id !== id) } });
        }
        try {
          await repositorio.excluir(id);
        } catch (erro) {
          await recarregar(); // desfaz a remoção otimista
          throw erro;
        }
      },
    };
  });
}
