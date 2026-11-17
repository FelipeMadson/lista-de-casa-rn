import {
  ItemRepositoryNavegador,
  type Armazenamento,
} from '../../src/dados/local/itemRepositoryNavegador';
import { novoItem } from '../../src/dominio/item';

/** localStorage falso, guardado em memória. */
class ArmazenamentoEmMemoria implements Armazenamento {
  readonly dados = new Map<string, string>();
  getItem(chave: string) {
    return this.dados.get(chave) ?? null;
  }
  setItem(chave: string, valor: string) {
    this.dados.set(chave, valor);
  }
}

describe('ItemRepositoryNavegador (versão web)', () => {
  let armazenamento: ArmazenamentoEmMemoria;
  let relogio: number;
  let repositorio: ItemRepositoryNavegador;

  beforeEach(() => {
    armazenamento = new ArmazenamentoEmMemoria();
    relogio = 10_000;
    repositorio = new ItemRepositoryNavegador(armazenamento, () => new Date(relogio));
  });

  const pao = () => novoItem({ nome: 'Pão', categoria: 'Mercearia' }, new Date(5_000));

  it('registra a data de criação uma única vez', async () => {
    const primeira = await repositorio.lerMetadado('criado_em');
    relogio = 99_000;
    new ItemRepositoryNavegador(armazenamento, () => new Date(relogio));
    expect(await repositorio.lerMetadado('criado_em')).toBe(primeira);
  });

  it('mantém os dados entre instâncias, como ao recarregar a página', async () => {
    const salvo = await repositorio.salvar(pao());
    const outra = new ItemRepositoryNavegador(armazenamento);
    expect(await outra.listar()).toEqual([salvo]);
  });

  it('gera ids crescentes que não se repetem após excluir', async () => {
    const a = await repositorio.salvar(pao());
    await repositorio.excluir(a.id!);
    const b = await repositorio.salvar(pao());
    expect(b.id).toBe(a.id! + 1);
  });

  it('segue as mesmas regras de envio do repositório SQLite', async () => {
    const enviada = await repositorio.salvar(pao());
    relogio = enviada.atualizadoEm.getTime();
    await repositorio.salvar({ ...enviada, quantidade: 2 });

    await repositorio.marcarComoSincronizado(enviada);
    expect(await repositorio.listarNaoSincronizados()).toHaveLength(1);

    const [atual] = await repositorio.listar();
    await repositorio.marcarComoSincronizado(atual);
    expect(await repositorio.listarNaoSincronizados()).toEqual([]);
  });

  it('recusa quantidade fora de 1 a 99 e item inexistente', async () => {
    await expect(repositorio.salvar({ ...pao(), quantidade: 100 })).rejects.toThrow('1 a 99');
    await expect(repositorio.salvar({ ...pao(), id: 7 })).rejects.toThrow('O item 7 não existe');
  });
});
