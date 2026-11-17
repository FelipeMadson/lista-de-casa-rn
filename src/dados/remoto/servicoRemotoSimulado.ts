import type { Item } from '../../dominio/item';
import { FalhaTransitoria } from './novaTentativa';

/** O que o sincronizador precisa de um servidor: enviar um item. */
export interface ServicoRemoto {
  enviar(item: Item): Promise<void>;
}

/**
 * Ocupa o lugar de uma API real: demora a responder e falha em parte das
 * chamadas, o que permite observar nova tentativa e sincronização sem servidor.
 */
export class ServicoRemotoSimulado implements ServicoRemoto {
  /**
   * @param taxaDeFalha fração das chamadas que falham (0 = nunca, 1 = sempre).
   */
  constructor(
    private readonly taxaDeFalha = 0.3,
    private readonly aleatorio: () => number = Math.random,
  ) {}

  async enviar(_item: Item): Promise<void> {
    await new Promise((resolver) =>
      setTimeout(resolver, 200 + Math.floor(this.aleatorio() * 600)),
    );
    if (this.aleatorio() < this.taxaDeFalha) {
      throw new FalhaTransitoria('Servidor indisponível (simulação).');
    }
  }
}
