import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { espaco, useCores } from '../tema';

/** Aviso de ausência de rede. A região viva faz o leitor de tela anunciá-lo. */
export function FaixaOffline() {
  const cores = useCores();
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[estilos.faixa, { backgroundColor: cores.avisoFundo }]}
    >
      <MaterialIcons
        name="wifi-off"
        size={20}
        color={cores.avisoTexto}
        importantForAccessibility="no"
      />
      <Text style={[estilos.texto, { color: cores.avisoTexto }]}>
        Sem conexão. As alterações ficam salvas no aparelho e a simulação será
        retomada depois.
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.p,
    paddingHorizontal: espaco.m,
    paddingVertical: espaco.p,
  },
  texto: { flex: 1, fontSize: 14 },
});
