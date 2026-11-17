import { comNovaTentativa, FalhaTransitoria } from '../../src/dados/remoto/novaTentativa';

describe('comNovaTentativa', () => {
  const opcoes = (esperas: number[]) => ({
    esperaBaseMs: 100,
    aleatorio: () => 0.5,
    esperar: async (ms: number) => {
      esperas.push(ms);
    },
  });

  it('devolve o resultado sem esperar quando a operação dá certo', async () => {
    const esperas: number[] = [];
    await expect(comNovaTentativa(async () => 'ok', opcoes(esperas))).resolves.toBe('ok');
    expect(esperas).toEqual([]);
  });

  it('repete falhas transitórias com espera exponencial e jitter', async () => {
    const esperas: number[] = [];
    let chamadas = 0;
    const resultado = await comNovaTentativa(async () => {
      chamadas++;
      if (chamadas < 3) throw new FalhaTransitoria('instável');
      return chamadas;
    }, opcoes(esperas));

    expect(resultado).toBe(3);
    // 100 × 2^0 + 50 de jitter, depois 100 × 2^1 + 50.
    expect(esperas).toEqual([150, 250]);
  });

  it('desiste depois do número máximo de tentativas', async () => {
    const esperas: number[] = [];
    let chamadas = 0;
    await expect(
      comNovaTentativa(async () => {
        chamadas++;
        throw new FalhaTransitoria('fora do ar');
      }, { ...opcoes(esperas), maxTentativas: 3 }),
    ).rejects.toBeInstanceOf(FalhaTransitoria);
    expect(chamadas).toBe(3);
    expect(esperas).toHaveLength(2);
  });

  it('não repete erros que não são transitórios', async () => {
    let chamadas = 0;
    await expect(
      comNovaTentativa(async () => {
        chamadas++;
        throw new Error('dado inválido');
      }, opcoes([])),
    ).rejects.toThrow('dado inválido');
    expect(chamadas).toBe(1);
  });
});
