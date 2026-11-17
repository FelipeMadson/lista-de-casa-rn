import type { ItemRepository } from '../dominio/itemRepository';
import {
  comNovaTentativa,
  FalhaTransitoria,
  type OpcoesNovaTentativa,
} from './remoto/novaTentativa';
import type { ServicoRemoto } from './remoto/servicoRemotoSimulado';

export interface ResultadoSincronizacao {
  enviados: number;
  falhas: number;
}

/** Envia ao servidor tudo o que foi alterado localmente e ainda não foi enviado. */
export class Sincronizador {
  constructor(
    private readonly repositorio: ItemRepository,
    private readonly remoto: ServicoRemoto,
    private readonly opcoes: OpcoesNovaTentativa = {},
  ) {}

  async sincronizar(): Promise<ResultadoSincronizacao> {
    const pendentes = await this.repositorio.listarNaoSincronizados();
    let enviados = 0;
    let falhas = 0;
    for (const item of pendentes) {
      try {
        await comNovaTentativa(() => this.remoto.enviar(item), this.opcoes);
        await this.repositorio.marcarComoSincronizado(item);
        enviados++;
      } catch (erro) {
        if (!(erro instanceof FalhaTransitoria)) throw erro;
        falhas++; // continua pendente e será reenviado na próxima vez
      }
    }
    return { enviados, falhas };
  }
}
