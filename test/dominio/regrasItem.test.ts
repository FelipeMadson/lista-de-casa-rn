import { novoItem, type Item } from '../../src/dominio/item';
import {
  ajustarQuantidade,
  ordenarParaExibicao,
  resumir,
  validarNome,
} from '../../src/dominio/regrasItem';

const item = (dados: Partial<Item> & { nome: string }): Item => ({
  ...novoItem({ nome: dados.nome, categoria: dados.categoria ?? 'Mercearia' }, new Date(0)),
  ...dados,
});

describe('validarNome', () => {
  it('rejeita nome vazio ou só com espaços', () => {
    expect(validarNome('')).toBe('Informe o nome do item.');
    expect(validarNome('   ')).toBe('Informe o nome do item.');
  });

  it('exige o tamanho mínimo e o máximo, ignorando espaços nas pontas', () => {
    expect(validarNome(' a ')).toBe('Use ao menos 2 caracteres.');
    expect(validarNome('a'.repeat(41))).toBe('Use no máximo 40 caracteres.');
  });

  it('aceita nomes dentro do limite', () => {
    expect(validarNome('Pão')).toBeNull();
    expect(validarNome('a'.repeat(40))).toBeNull();
  });
});

describe('ajustarQuantidade', () => {
  it('soma a variação', () => {
    expect(ajustarQuantidade(3, 1)).toBe(4);
    expect(ajustarQuantidade(3, -1)).toBe(2);
  });

  it('não sai do intervalo de 1 a 99', () => {
    expect(ajustarQuantidade(1, -1)).toBe(1);
    expect(ajustarQuantidade(99, 1)).toBe(99);
    expect(ajustarQuantidade(50, 500)).toBe(99);
  });
});

describe('ordenarParaExibicao', () => {
  it('põe os itens a comprar primeiro, depois ordena por categoria e nome', () => {
    const itens = [
      item({ nome: 'Sabão', categoria: 'Limpeza', comprado: true }),
      item({ nome: 'banana', categoria: 'Hortifrúti' }),
      item({ nome: 'Arroz', categoria: 'Mercearia' }),
      item({ nome: 'Alface', categoria: 'hortifrúti' }),
    ];
    expect(ordenarParaExibicao(itens).map((i) => i.nome)).toEqual([
      'Alface',
      'banana',
      'Arroz',
      'Sabão',
    ]);
  });

  it('não altera a lista original', () => {
    const itens = [item({ nome: 'B' }), item({ nome: 'A' })];
    ordenarParaExibicao(itens);
    expect(itens.map((i) => i.nome)).toEqual(['B', 'A']);
  });
});

describe('resumir', () => {
  it('conta total, comprados e pendentes de envio', () => {
    const resumo = resumir([
      item({ nome: 'A', comprado: true, sincronizado: true }),
      item({ nome: 'B', comprado: true }),
      item({ nome: 'C' }),
      item({ nome: 'D', sincronizado: true }),
    ]);
    expect(resumo).toEqual({ total: 4, comprados: 2, aguardandoEnvio: 2, progresso: 0.5 });
  });

  it('tem progresso zero para a lista vazia', () => {
    expect(resumir([]).progresso).toBe(0);
  });
});
