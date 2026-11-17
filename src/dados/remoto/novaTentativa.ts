/** Falha que tende a desaparecer sozinha: rede instável, servidor sobrecarregado. */
export class FalhaTransitoria extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'FalhaTransitoria';
  }
}

export interface OpcoesNovaTentativa {
  maxTentativas?: number;
  esperaBaseMs?: number;
  /** Devolve um número em [0, 1). Injetável para testes determinísticos. */
  aleatorio?: () => number;
  /** Substituível nos testes para não esperar de verdade. */
  esperar?: (ms: number) => Promise<void>;
}

const esperarDeVerdade = (ms: number) =>
  new Promise<void>((resolver) => setTimeout(resolver, ms));

/**
 * Repete `operacao` em caso de FalhaTransitoria, com espera exponencial
 * (base, 2 × base, 4 × base...) somada a um intervalo aleatório (jitter).
 * Qualquer outro erro é repassado de imediato, sem nova tentativa.
 */
export async function comNovaTentativa<T>(
  operacao: () => Promise<T>,
  {
    maxTentativas = 3,
    esperaBaseMs = 500,
    aleatorio = Math.random,
    esperar = esperarDeVerdade,
  }: OpcoesNovaTentativa = {},
): Promise<T> {
  let tentativa = 0;
  while (true) {
    try {
      return await operacao();
    } catch (erro) {
      if (!(erro instanceof FalhaTransitoria)) throw erro;
      tentativa++;
      if (tentativa >= maxTentativas) throw erro;
      const exponencial = esperaBaseMs * 2 ** (tentativa - 1);
      const jitter = Math.floor(aleatorio() * esperaBaseMs);
      await esperar(exponencial + jitter);
    }
  }
}
