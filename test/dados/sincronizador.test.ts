import { FalhaTransitoria } from '../../src/dados/remoto/novaTentativa';
import type { ServicoRemoto } from '../../src/dados/remoto/servicoRemotoSimulado';
import { Sincronizador } from '../../src/dados/sincronizador';
import { novoItem, type Item } from '../../src/dominio/item';
import { RepositorioEmMemoria } from '../apoio/repositorioEmMemoria';

const semEspera = { esperar: async () => {}, aleatorio: () => 0 };

describe('Sincronizador', () => {
  let repositorio: RepositorioEmMemoria;

  beforeEach(async () => {
    repositorio = new RepositorioEmMemoria();
    await repositorio.salvar(novoItem({ nome: 'Arroz', categoria: 'Mercearia' }));
    await repositorio.salvar(novoItem({ nome: 'Sabão', categoria: 'Limpeza' }));
  });

  it('envia os pendentes e os marca como sincronizados', async () => {
    const enviados: string[] = [];
    const remoto: ServicoRemoto = { enviar: async (i: Item) => void enviados.push(i.nome) };

    const resultado = await new Sincronizador(repositorio, remoto, semEspera).sincronizar();

    expect(resultado).toEqual({ enviados: 2, falhas: 0 });
    expect(enviados.sort()).toEqual(['Arroz', 'Sabão']);
    expect(await repositorio.listarNaoSincronizados()).toEqual([]);
  });

  it('mantém pendente o item cujo envio falhou em todas as tentativas', async () => {
    const remoto: ServicoRemoto = {
      enviar: async (i: Item) => {
        if (i.nome === 'Sabão') throw new FalhaTransitoria('fora do ar');
      },
    };

    const resultado = await new Sincronizador(repositorio, remoto, semEspera).sincronizar();

    expect(resultado).toEqual({ enviados: 1, falhas: 1 });
    const pendentes = await repositorio.listarNaoSincronizados();
    expect(pendentes.map((i) => i.nome)).toEqual(['Sabão']);
  });

  it('repassa erros que não são de rede', async () => {
    const remoto: ServicoRemoto = {
      enviar: async () => {
        throw new Error('bug');
      },
    };
    await expect(new Sincronizador(repositorio, remoto, semEspera).sincronizar()).rejects.toThrow('bug');
  });
});
