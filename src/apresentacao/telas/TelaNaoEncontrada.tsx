import { router, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Botao } from '../componentes/Botao';
import { espaco, useCores } from '../tema';

export function TelaNaoEncontrada() {
  const cores = useCores();
  return (
    <View style={[estilos.centro, { backgroundColor: cores.fundo }]}>
      <Stack.Screen options={{ title: 'Página não encontrada' }} />
      <Text style={[estilos.texto, { color: cores.texto }]}>
        O endereço solicitado não corresponde a nenhum item da lista.
      </Text>
      <Botao rotulo="Ir para a lista" aoTocar={() => router.dismissTo('/')} />
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaco.g, gap: espaco.m },
  texto: { fontSize: 16, textAlign: 'center' },
});
