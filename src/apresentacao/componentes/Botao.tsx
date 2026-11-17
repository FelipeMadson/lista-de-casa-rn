import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { alvoMinimo, espaco, raio, useCores } from '../tema';

interface Props {
  rotulo: string;
  aoTocar: () => void;
  icone?: ComponentProps<typeof MaterialIcons>['name'];
  desabilitado?: boolean;
  variante?: 'preenchido' | 'texto';
}

/** Botão com área de toque mínima de 48 dp e estado desabilitado anunciado. */
export function Botao({ rotulo, aoTocar, icone, desabilitado = false, variante = 'preenchido' }: Props) {
  const cores = useCores();
  const preenchido = variante === 'preenchido';
  const corDoTexto = preenchido ? cores.sobrePrimaria : cores.primaria;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      style={({ pressed }) => [
        estilos.base,
        preenchido && { backgroundColor: cores.primaria },
        (pressed || desabilitado) && { opacity: desabilitado ? 0.45 : 0.8 },
      ]}
    >
      {icone && (
        <MaterialIcons name={icone} size={20} color={corDoTexto} importantForAccessibility="no" />
      )}
      <Text style={[estilos.rotulo, { color: corDoTexto }]}>{rotulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: alvoMinimo,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.p,
    paddingHorizontal: espaco.g,
    borderRadius: raio.botao,
  },
  rotulo: { fontSize: 15, fontWeight: '600' },
});
