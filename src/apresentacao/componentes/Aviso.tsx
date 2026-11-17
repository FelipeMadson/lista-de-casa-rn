import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { espaco, useCores } from '../tema';

interface Props {
  mensagem: string | null;
  /** Mudar este valor reexibe o aviso, mesmo com a mesma mensagem. */
  versao: number;
  duracaoMs?: number;
  /** Distância da base, para não cobrir um botão flutuante. */
  distanciaDaBase?: number;
}

/**
 * Aviso temporário na base da tela, no papel da SnackBar do Material Design.
 * A região viva faz o leitor de tela anunciar a mensagem.
 */
export function Aviso({ mensagem, versao, duracaoMs = 4000, distanciaDaBase = espaco.m }: Props) {
  const cores = useCores();
  // Guarda a última versão já escondida; uma versão nova volta a aparecer.
  const [versaoEscondida, setVersaoEscondida] = useState(0);
  const visivel = !!mensagem && versao !== 0 && versao !== versaoEscondida;

  useEffect(() => {
    if (!visivel) return;
    const temporizador = setTimeout(() => setVersaoEscondida(versao), duracaoMs);
    return () => clearTimeout(temporizador);
  }, [visivel, versao, duracaoMs]);

  if (!visivel) return null;

  return (
    <View pointerEvents="box-none" style={[estilos.posicao, { bottom: distanciaDaBase }]}>
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[estilos.aviso, { backgroundColor: cores.snackbarFundo }]}
      >
        <Text style={[estilos.texto, { color: cores.snackbarTexto }]}>{mensagem}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  posicao: {
    position: 'absolute',
    left: espaco.m,
    right: espaco.m,
    alignItems: 'center',
  },
  aviso: {
    width: '100%',
    maxWidth: 560,
    borderRadius: 8,
    paddingHorizontal: espaco.m,
    paddingVertical: 14,
    elevation: 6,
  },
  texto: { fontSize: 14 },
});
