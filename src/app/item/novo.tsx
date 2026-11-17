import { TelaItem } from '../../apresentacao/telas/TelaItem';

// Rota "/item/novo". Arquivos estáticos têm prioridade sobre [id], então
// "novo" nunca é lido como um id.
export default function RotaNovoItem() {
  return <TelaItem />;
}
