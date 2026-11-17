import { MaterialIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import type { Item } from '../../dominio/item';
import { alvoMinimo, espaco, raio, useCores } from '../tema';

interface Props {
  item: Item;
  aoAbrir: (item: Item) => void;
  aoAlternarComprado: (item: Item) => void;
  aoExcluir: (item: Item) => void;
}

/**
 * Cartão de um item. Arrastar para a esquerda exclui; para quem usa leitor de
 * tela, a mesma ação aparece no menu de ações acessíveis ("Excluir").
 * memo: o cartão só renderiza de novo quando o próprio item muda (Aula 23).
 */
function CartaoItemBase({ item, aoAbrir, aoAlternarComprado, aoExcluir }: Props) {
  const cores = useCores();
  const situacaoDeEnvio = item.sincronizado
    ? 'Envio simulado concluído'
    : 'Aguardando simulação de envio';

  return (
    <ReanimatedSwipeable
      friction={1.5}
      rightThreshold={64}
      overshootRight={false}
      onSwipeableOpen={() => aoExcluir(item)}
      renderRightActions={() => (
        <View style={[estilos.fundoExcluir, { backgroundColor: cores.erroFundo }]}>
          <MaterialIcons name="delete-outline" size={24} color={cores.erroTexto} />
        </View>
      )}
    >
      <View style={[estilos.cartao, { backgroundColor: cores.superficie }]}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={`Comprado: ${item.nome}`}
          accessibilityState={{ checked: item.comprado }}
          onPress={() => aoAlternarComprado(item)}
          style={estilos.caixa}
        >
          <MaterialIcons
            name={item.comprado ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={item.comprado ? cores.primaria : cores.contorno}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.nome}, ${item.categoria}, ${item.quantidade} unidade(s). ${situacaoDeEnvio}`}
          accessibilityHint="Abre o item para edição"
          accessibilityActions={[{ name: 'delete', label: 'Excluir' }]}
          onAccessibilityAction={(evento) => {
            if (evento.nativeEvent.actionName === 'delete') aoExcluir(item);
          }}
          onPress={() => aoAbrir(item)}
          style={({ pressed }) => [estilos.corpo, pressed && { opacity: 0.7 }]}
        >
          <View style={estilos.textos}>
            <Text
              numberOfLines={1}
              style={[
                estilos.titulo,
                { color: item.comprado ? cores.textoSecundario : cores.texto },
                item.comprado && estilos.riscado,
              ]}
            >
              {item.nome}
            </Text>
            <Text numberOfLines={1} style={[estilos.subtitulo, { color: cores.textoSecundario }]}>
              {item.categoria} · {item.quantidade} un.
            </Text>
          </View>
          <MaterialIcons
            name={item.sincronizado ? 'cloud-done' : 'cloud-upload'}
            size={22}
            color={item.sincronizado ? cores.primaria : cores.contorno}
          />
        </Pressable>
      </View>
    </ReanimatedSwipeable>
  );
}

export const CartaoItem = memo(CartaoItemBase);

const estilos = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    borderRadius: raio.cartao,
    paddingLeft: espaco.p / 2,
    paddingRight: espaco.m,
  },
  caixa: {
    width: alvoMinimo,
    height: alvoMinimo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: espaco.p,
    paddingVertical: espaco.p,
  },
  textos: { flex: 1, gap: 2 },
  titulo: { fontSize: 16, fontWeight: '500' },
  riscado: { textDecorationLine: 'line-through' },
  subtitulo: { fontSize: 14 },
  fundoExcluir: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: espaco.g,
    borderRadius: raio.cartao,
  },
});
