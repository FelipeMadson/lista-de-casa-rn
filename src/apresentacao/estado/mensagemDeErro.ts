/** Texto legível para exibir ao usuário a partir de qualquer valor lançado. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof Error && erro.message) return erro.message;
  if (typeof erro === 'string' && erro) return erro;
  return 'Erro desconhecido.';
}
