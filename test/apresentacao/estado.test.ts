import { lerId } from '../../src/apresentacao/lerId';
import { criarItensStore } from '../../src/apresentacao/estado/itensStore';
import { criarSincronizacaoStore } from '../../src/apresentacao/estado/sincronizacaoStore';
import { novoItem } from '../../src/dominio/item';
import { RepositorioEmMemoria } from '../apoio/repositorioEmMemoria';

describe('fluxo da lista (estado)', () => {
  it('começa carregando e passa a "pronto" com a lista ordenada', async () => {
    const repositorio = new RepositorioEmMemoria();
    await repositorio.salvar({ ...novoItem({ nome: 'Pão', categoria: 'Mercearia' }), comprado: true });
    await repositorio.salvar(novoItem({ nome: 'Detergente', categoria: 'Limpeza' }));
    const store = criarItensStore(repositorio);

    expect(store.getState().lista.status).toBe('carregando');
    await store.getState().carregar();

    const lista = store.getState().lista;
    expect(lista.status).toBe('pronto');
    if (lista.status === 'pronto') {
      expect(lista.itens.map((i) => i.nome)).toEqual(['Detergente', 'Pão']);
    }
  });

  it('expõe o erro de leitura com mensagem específica', async () => {
    const repositorio = new RepositorioEmMemoria();
    repositorio.falharAoListar = true;
    const store = criarItensStore(repositorio);

    await store.getState().carregar();

    expect(store.getState().lista).toEqual({ status: 'erro', mensagem: 'Disco indisponível.' });
  });

  it('adiciona, marca como comprado e exclui', async () => {
    const store = criarItensStore(new RepositorioEmMemoria());
    await store.getState().carregar();

    const salvo = await store.getState().salvar(novoItem({ nome: 'Café', categoria: 'Mercearia' }));
    await store.getState().alternarComprado(salvo);
    let lista = store.getState().lista;
    expect(lista.status === 'pronto' && lista.itens[0].comprado).toBe(true);

    await store.getState().excluir(salvo);
    lista = store.getState().lista;
    expect(lista.status === 'pronto' && lista.itens).toEqual([]);
  });

  it('desfaz a remoção otimista quando a exclusão falha', async () => {
    const repositorio = new RepositorioEmMemoria();
    const store = criarItensStore(repositorio);
    await store.getState().carregar();
    const salvo = await store.getState().salvar(novoItem({ nome: 'Café', categoria: 'Mercearia' }));
    repositorio.falharAoExcluir = true;

    await expect(store.getState().excluir(salvo)).rejects.toThrow('Falha ao excluir.');

    const lista = store.getState().lista;
    expect(lista.status === 'pronto' && lista.itens.map((i) => i.nome)).toEqual(['Café']);
  });
});

describe('sincronização (estado)', () => {
  const dependencias = (online: boolean | null) => {
    const chamadas = { sincronizar: 0, recarregar: 0 };
    const store = criarSincronizacaoStore({
      sincronizar: async () => {
        chamadas.sincronizar++;
        return { enviados: 2, falhas: 1 };
      },
      estaOnline: () => online,
      aoConcluir: async () => {
        chamadas.recarregar++;
      },
    });
    return { store, chamadas };
  };

  it('sem rede, não tenta enviar e explica que os dados continuam salvos', async () => {
    const { store, chamadas } = dependencias(false);
    await store.getState().sincronizar();
    expect(chamadas.sincronizar).toBe(0);
    expect(store.getState().mensagem).toBe('Sem conexão. As alterações continuam salvas no aparelho.');
  });

  it('com rede, informa o resultado e relê a lista', async () => {
    const { store, chamadas } = dependencias(true);
    await store.getState().sincronizar();
    expect(chamadas).toEqual({ sincronizar: 1, recarregar: 1 });
    expect(store.getState()).toMatchObject({
      emAndamento: false,
      mensagem: 'Envio simulado: 2; 1 continua(m) pendente(s).',
      versaoDaMensagem: 1,
    });
  });

  it('ignora um segundo pedido enquanto o primeiro está em andamento', async () => {
    const { store, chamadas } = dependencias(true);
    await Promise.all([store.getState().sincronizar(), store.getState().sincronizar()]);
    expect(chamadas.sincronizar).toBe(1);
  });
});

describe('lerId (rota /item/:id)', () => {
  it('aceita apenas inteiros positivos', () => {
    expect(lerId('7')).toBe(7);
    expect(lerId('0')).toBeNull();
    expect(lerId('abc')).toBeNull();
    expect(lerId('7.5')).toBeNull();
    expect(lerId(undefined)).toBeNull();
    expect(lerId(['1', '2'])).toBeNull();
  });
});
