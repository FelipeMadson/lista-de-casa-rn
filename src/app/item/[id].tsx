import { useLocalSearchParams } from 'expo-router';

import { lerId } from '../../apresentacao/lerId';
import { TelaItem } from '../../apresentacao/telas/TelaItem';
import { TelaNaoEncontrada } from '../../apresentacao/telas/TelaNaoEncontrada';

// Rota "/item/:id", também alcançada por ligação profunda:
// listadecasa://item/7
export default function RotaItem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const numero = lerId(id);
  return numero === null ? <TelaNaoEncontrada /> : <TelaItem id={numero} />;
}
