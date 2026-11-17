import type { PedidoDeConfirmacao } from './confirmar';

/**
 * Na web, Alert.alert do React Native não mostra botões; usa-se o diálogo
 * de confirmação do navegador.
 */
export function confirmar(p: PedidoDeConfirmacao): Promise<boolean> {
  return Promise.resolve(window.confirm(`${p.titulo}\n\n${p.mensagem}`));
}
