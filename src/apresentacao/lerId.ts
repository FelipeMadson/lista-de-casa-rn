/** Converte o segmento da URL em id; aceita apenas inteiros positivos. */
export function lerId(valor: string | string[] | undefined): number | null {
  if (typeof valor !== 'string' || !/^\d+$/.test(valor)) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
