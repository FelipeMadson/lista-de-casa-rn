import { Alert } from 'react-native';

export interface PedidoDeConfirmacao {
  titulo: string;
  mensagem: string;
  cancelar: string;
  confirmar: string;
}

/** Diálogo nativo de confirmação. Resolve true quando o usuário confirma. */
export function confirmar(p: PedidoDeConfirmacao): Promise<boolean> {
  return new Promise((resolver) => {
    Alert.alert(
      p.titulo,
      p.mensagem,
      [
        { text: p.cancelar, style: 'cancel', onPress: () => resolver(false) },
        { text: p.confirmar, style: 'destructive', onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) },
    );
  });
}
