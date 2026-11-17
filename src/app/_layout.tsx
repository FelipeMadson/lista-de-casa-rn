import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { identidade } from '../config/identidade';
import {
  conectividadeStore,
  itensStore,
  sincronizacaoStore,
} from '../apresentacao/dependencias';
import { estaOnline } from '../apresentacao/estado/conectividadeStore';
import { useCores } from '../apresentacao/tema';

// A lista fica sempre na base da pilha: aberto por ligação profunda em
// /item/7, o app coloca a lista abaixo, e "voltar" leva a ela (Aula 19).
export const unstable_settings = { anchor: 'index' };

export default function Layout() {
  const cores = useCores();
  const esquema = useColorScheme();

  useEffect(() => {
    void itensStore.getState().carregar();

    const pararRede = NetInfo.addEventListener((estado) =>
      conectividadeStore.getState().definir(estaOnline(estado)),
    );

    // Ao recuperar a conexão, envia automaticamente o que ficou pendente.
    const pararReconexao = conectividadeStore.subscribe((atual, anterior) => {
      if (anterior.online === false && atual.online === true) {
        void sincronizacaoStore.getState().sincronizar();
      }
    });

    return () => {
      pararRede();
      pararReconexao();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <StatusBar style={esquema === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cores.fundo },
          headerTintColor: cores.texto,
          headerTitleStyle: { fontSize: 21, fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Screen name="index" options={{ title: identidade.nomeDoApp }} />
        <Stack.Screen name="item/novo" options={{ title: 'Novo item' }} />
        <Stack.Screen name="item/[id]" options={{ title: 'Editar item' }} />
        <Stack.Screen name="sobre" options={{ title: 'Sobre' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
