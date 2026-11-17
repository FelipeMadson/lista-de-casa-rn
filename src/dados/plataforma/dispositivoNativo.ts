import { requireOptionalNativeModule } from 'expo';

export interface InfoDispositivo {
  fabricante: string;
  modelo: string;
  versaoAndroid: string;
  nivelBateria: number;
}

interface RespostaNativa {
  fabricante: string;
  modelo: string;
  versaoAndroid: string;
  bateria: number;
}

interface ModuloDispositivo {
  obterInformacoes(): Promise<RespostaNativa>;
}

/**
 * Lado JavaScript do módulo nativo (Aula 19). O lado Kotlin fica em
 * modules/dispositivo/android. Devolve null quando a plataforma não tem o
 * módulo (Expo Go, web, iOS) ou quando o código nativo responde com erro.
 */
export class DispositivoNativo {
  async obterInformacoes(): Promise<InfoDispositivo | null> {
    const modulo = requireOptionalNativeModule<ModuloDispositivo>('Dispositivo');
    if (!modulo) return null;
    try {
      const r = await modulo.obterInformacoes();
      return {
        fabricante: r.fabricante,
        modelo: r.modelo,
        versaoAndroid: r.versaoAndroid,
        nivelBateria: r.bateria,
      };
    } catch {
      return null;
    }
  }
}
