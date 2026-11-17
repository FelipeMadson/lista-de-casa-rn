/**
 * Identificação do aplicativo e da autoria. É o único arquivo a editar para
 * definir nome, créditos, cores do tema e categorias da lista.
 */
export const identidade = {
  /** Nome exibido no cabeçalho e na tela "Sobre". */
  nomeDoApp: 'Lista de casa',

  /** Frase curta que descreve o propósito do aplicativo. */
  descricao:
    'Lista de compras com armazenamento local em SQLite e envio posterior ' +
    'a um serviço simulado.',

  turma: 'Desenvolvimento para Dispositivos Móveis — 2026',

  integrantes: [{ nome: 'Felipe Madison da Silva Veloso' }],

  /** Categorias oferecidas no formulário. A primeira é o valor padrão. */
  categorias: ['Hortifrúti', 'Mercearia', 'Limpeza', 'Higiene'],
} as const;
