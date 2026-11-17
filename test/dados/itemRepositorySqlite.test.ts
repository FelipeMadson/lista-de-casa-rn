import { BancoDeDados, versaoDoEsquema } from '../../src/dados/local/bancoDeDados';
import { ItemRepositorySqlite } from '../../src/dados/local/itemRepositorySqlite';
import { novoItem } from '../../src/dominio/item';
import { ConexaoNode } from '../apoio/conexaoNode';

describe('ItemRepositorySqlite (SQLite real)', () => {
  let conexao: ConexaoNode;
  let banco: BancoDeDados;
  let relogio: number;
  let repositorio: ItemRepositorySqlite;

  beforeEach(() => {
    conexao = new ConexaoNode();
    banco = new BancoDeDados(async () => conexao);
    relogio = 10_000;
    repositorio = new ItemRepositorySqlite(banco, () => new Date(relogio));
  });

  afterEach(() => banco.fechar());

  const leite = () =>
    novoItem({ nome: 'Leite', categoria: 'Mercearia', quantidade: 2 }, new Date(5_000));

  it('cria o esquema e registra a data de criação do banco', async () => {
    await banco.abrir();
    const versao = conexao.db.prepare('PRAGMA user_version').get() as { user_version: number };
    expect(versao.user_version).toBe(versaoDoEsquema);
    expect(await banco.lerMetadado('criado_em')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('não repete migrações ao reabrir o mesmo arquivo', async () => {
    await banco.abrir();
    const outro = new BancoDeDados(async () => conexao);
    await expect(outro.abrir()).resolves.toBe(conexao);
  });

  it('insere, lê de volta e converte booleanos e datas', async () => {
    const salvo = await repositorio.salvar(leite());
    expect(salvo.id).toBeGreaterThan(0);

    const [lido] = await repositorio.listar();
    expect(lido).toEqual({
      ...salvo,
      comprado: false,
      sincronizado: false,
      criadoEm: new Date(5_000),
      atualizadoEm: new Date(10_000),
    });
  });

  it('atualiza um item existente e o deixa pendente de envio', async () => {
    const salvo = await repositorio.salvar(leite());
    await repositorio.marcarComoSincronizado(salvo);
    relogio = 20_000;

    await repositorio.salvar({ ...salvo, comprado: true, sincronizado: true });

    const [lido] = await repositorio.listar();
    expect(lido.comprado).toBe(true);
    expect(lido.sincronizado).toBe(false);
    expect(lido.atualizadoEm).toEqual(new Date(20_000));
  });

  it('falha ao atualizar um item que não existe mais', async () => {
    await expect(repositorio.salvar({ ...leite(), id: 999 })).rejects.toThrow(
      'O item 999 não existe mais no aparelho.',
    );
  });

  it('exclui pelo id', async () => {
    const salvo = await repositorio.salvar(leite());
    await repositorio.excluir(salvo.id!);
    expect(await repositorio.listar()).toEqual([]);
  });

  it('a restrição do banco recusa quantidade fora de 1 a 99', async () => {
    await expect(repositorio.salvar({ ...leite(), quantidade: 0 })).rejects.toThrow(/CHECK/);
  });

  it('não marca como enviada uma versão alterada durante o envio', async () => {
    const enviada = await repositorio.salvar(leite());
    // Enquanto o envio estava em andamento, o usuário alterou o item.
    relogio = enviada.atualizadoEm.getTime(); // mesmo milissegundo
    await repositorio.salvar({ ...enviada, quantidade: 3 });

    await repositorio.marcarComoSincronizado(enviada);

    const pendentes = await repositorio.listarNaoSincronizados();
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0].quantidade).toBe(3);
  });

  it('marca como enviada a versão que continua atual', async () => {
    const salvo = await repositorio.salvar(leite());
    await repositorio.marcarComoSincronizado(salvo);
    expect(await repositorio.listarNaoSincronizados()).toEqual([]);
  });
});
