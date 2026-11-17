import { useColorScheme } from 'react-native';

/**
 * Tokens de cor (Aula 10): os componentes usam os nomes, e só este arquivo
 * conhece os valores. Paleta monocromática derivada do cinza #343434, como na
 * versão Flutter. Todos os pares texto/fundo têm contraste de ao menos 4,5:1.
 */
const claro = {
  fundo: '#F6F6F4',
  superficie: '#FFFFFF',
  texto: '#181818',
  textoSecundario: '#4A4A4A',
  primaria: '#343434',
  sobrePrimaria: '#FFFFFF',
  contorno: '#767676',
  divisor: '#E2E2DF',
  trilhaProgresso: '#DCDCD8',
  avisoFundo: '#E4E4E0',
  avisoTexto: '#1F1F1F',
  erroFundo: '#F9DEDC',
  erroTexto: '#410E0B',
  snackbarFundo: '#2F2F2F',
  snackbarTexto: '#F2F2F2',
};

export type Cores = typeof claro;

const escuro: Cores = {
  fundo: '#131313',
  superficie: '#1F1F1F',
  texto: '#ECECEC',
  textoSecundario: '#BDBDBD',
  primaria: '#DADADA',
  sobrePrimaria: '#1A1A1A',
  contorno: '#9A9A9A',
  divisor: '#333333',
  trilhaProgresso: '#3A3A3A',
  avisoFundo: '#3A3A38',
  avisoTexto: '#EDEDED',
  erroFundo: '#8C1D18',
  erroTexto: '#FFDAD6',
  snackbarFundo: '#E6E6E6',
  snackbarTexto: '#1A1A1A',
};

export function useCores(): Cores {
  return useColorScheme() === 'dark' ? escuro : claro;
}

export const espaco = { p: 8, m: 16, g: 24, gg: 32 } as const;
export const raio = { cartao: 14, campo: 8, botao: 20 } as const;

/** Pontos de quebra das classes de tamanho de janela, em dp (Aula 3). */
export const pontosDeQuebra = { medio: 600, expandido: 840 } as const;

/** Largura máxima de formulários e textos em telas largas. */
export const larguraMaximaConteudo = 600;

/** Alvo mínimo de toque recomendado pelo Material Design (Aula 7). */
export const alvoMinimo = 48;
