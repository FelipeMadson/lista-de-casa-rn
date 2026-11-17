import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { alvoMinimo, useCores } from '../tema';

interface Props {
  /** Lido pelo leitor de tela; o ícone sozinho não descreve a ação. */
  rotulo: string;
  aoTocar: () => void;
  icone: ComponentProps<typeof MaterialIcons>['name'];
  desabilitado?: boolean;
  contornado?: boolean;
  /** Substitui o ícone (por exemplo, por um indicador de progresso). */
  children?: ReactNode;
}

export function BotaoIcone({ rotulo, aoTocar, icone, desabilitado = false, contornado = false, children }: Props) {
  const cores = useCores();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={aoTocar}
      hitSlop={4}
      style={({ pressed }) => [
        estilos.base,
        contornado && { borderWidth: 1, borderColor: cores.contorno },
        pressed && { backgroundColor: cores.divisor },
        desabilitado && { opacity: 0.4 },
      ]}
    >
      {children ?? <MaterialIcons name={icone} size={24} color={cores.texto} />}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    width: alvoMinimo,
    height: alvoMinimo,
    borderRadius: alvoMinimo / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
