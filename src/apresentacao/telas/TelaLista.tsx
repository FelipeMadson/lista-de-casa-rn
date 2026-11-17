import { MaterialIcons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Item } from '../../dominio/item';
import { resumir, type Resumo } from '../../dominio/regrasItem';
import { Aviso } from '../componentes/Aviso';
import { Botao } from '../componentes/Botao';
import { BotaoIcone } from '../componentes/BotaoIcone';
import { CartaoItem } from '../componentes/CartaoItem';
import { FaixaOffline } from '../componentes/FaixaOffline';
import { useConectividade, useItens, useSincronizacao, itensStore, sincronizacaoStore } from '../dependencias';
import { espaco, pontosDeQuebra, raio, useCores } from '../tema';

/** Classe de tamanho de janela → número de colunas da grade (Aula 3). */
function colunasPara(largura: number): number {
  if (largura < pontosDeQuebra.medio) return 1;
  if (largura < pontosDeQuebra.expandido) return 2;
  return 3;
}

const alturaDoBotaoFlutuante = 56;

export function TelaLista() {
  const cores = useCores();
  const insets = useSafeAreaInsets();
  const lista = useItens((s) => s.lista);
  // Enquanto o estado da rede é desconhecido, não há alerta.
  const offline = useConectividade((s) => s.online === false);
  const sincronizando = useSincronizacao((s) => s.emAndamento);
  const mensagem = useSincronizacao((s) => s.mensagem);
  const versaoDaMensagem = useSincronizacao((s) => s.versaoDaMensagem);

  const sincronizar = () => sincronizacaoStore.getState().sincronizar();
  const baseDoBotao = espaco.m + insets.bottom;

  return (
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={estilos.acoes}>
              <BotaoIcone
                rotulo="Simular envio de alterações"
                icone="cloud-upload"
                desabilitado={sincronizando}
                aoTocar={sincronizar}
              >
                {sincronizando ? <ActivityIndicator size="small" color={cores.texto} /> : undefined}
              </BotaoIcone>
              <BotaoIcone
                rotulo="Sobre o aplicativo"
                icone="info-outline"
                aoTocar={() => router.push('/sobre')}
              />
            </View>
          ),
        }}
      />

      {offline && <FaixaOffline />}

      <View style={estilos.conteudo}>
        {lista.status === 'carregando' && (
          <View style={estilos.centro}>
            <ActivityIndicator size="large" color={cores.primaria} accessibilityLabel="Carregando a lista" />
          </View>
        )}
        {lista.status === 'erro' && (
          <Falha mensagem={lista.mensagem} aoTentarNovamente={() => itensStore.getState().carregar()} />
        )}
        {lista.status === 'pronto' &&
          (lista.itens.length === 0 ? (
            <EstadoVazio />
          ) : (
            <Grade itens={lista.itens} margemInferior={baseDoBotao + alturaDoBotaoFlutuante + espaco.g} />
          ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Novo item"
        onPress={() => router.push('/item/novo')}
        style={({ pressed }) => [
          estilos.botaoFlutuante,
          { backgroundColor: cores.primaria, bottom: baseDoBotao },
          pressed && { opacity: 0.85 },
        ]}
      >
        <MaterialIcons name="add" size={24} color={cores.sobrePrimaria} />
        <Text style={[estilos.rotuloFlutuante, { color: cores.sobrePrimaria }]}>Novo item</Text>
      </Pressable>

      <Aviso
        mensagem={mensagem}
        versao={versaoDaMensagem}
        distanciaDaBase={baseDoBotao + alturaDoBotaoFlutuante + espaco.m}
      />
    </View>
  );
}

function Grade({ itens, margemInferior }: { itens: Item[]; margemInferior: number }) {
  const { width } = useWindowDimensions();
  const colunas = colunasPara(width);
  const resumo = resumir(itens);

  // Funções estáveis: com memo, os cartões não renderizam de novo à toa.
  const abrir = useCallback((item: Item) => router.push(`/item/${item.id}`), []);
  const alternar = useCallback((item: Item) => {
    void itensStore.getState().alternarComprado(item);
  }, []);
  const excluir = useCallback((item: Item) => {
    void itensStore.getState().excluir(item);
  }, []);

  return (
    <FlatList
      // numColumns não pode mudar em uma lista já montada: a chave a recria.
      key={`grade-${colunas}`}
      data={itens}
      numColumns={colunas}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={<CabecalhoResumo resumo={resumo} />}
      contentContainerStyle={[estilos.grade, { paddingBottom: margemInferior }]}
      columnWrapperStyle={colunas > 1 ? estilos.linhaDaGrade : undefined}
      ItemSeparatorComponent={() => <View style={{ height: espaco.p }} />}
      renderItem={({ item }) => (
        <View style={estilos.celula}>
          <CartaoItem item={item} aoAbrir={abrir} aoAlternarComprado={alternar} aoExcluir={excluir} />
        </View>
      )}
    />
  );
}

function CabecalhoResumo({ resumo }: { resumo: Resumo }) {
  const cores = useCores();
  const porcentagem = Math.round(resumo.progresso * 100);
  return (
    <View style={estilos.resumo}>
      <Text style={[estilos.tituloResumo, { color: cores.texto }]}>
        {resumo.comprados} de {resumo.total} itens comprados
      </Text>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Progresso das compras"
        accessibilityValue={{ min: 0, max: 100, now: porcentagem }}
        style={[estilos.trilha, { backgroundColor: cores.trilhaProgresso }]}
      >
        <View style={[estilos.preenchimento, { width: `${porcentagem}%`, backgroundColor: cores.primaria }]} />
      </View>
      {resumo.aguardandoEnvio > 0 && (
        <Text style={[estilos.pendentes, { color: cores.textoSecundario }]}>
          {resumo.aguardandoEnvio} alteração(ões) aguardando envio simulado
        </Text>
      )}
    </View>
  );
}

function EstadoVazio() {
  const cores = useCores();
  return (
    <View style={estilos.centro}>
      <MaterialIcons name="shopping-basket" size={64} color={cores.contorno} importantForAccessibility="no" />
      <Text style={[estilos.tituloVazio, { color: cores.texto }]}>A lista está vazia.</Text>
      <Text style={[estilos.textoCentral, { color: cores.textoSecundario }]}>
        Toque em &quot;Novo item&quot; para começar.
      </Text>
    </View>
  );
}

function Falha({ mensagem, aoTentarNovamente }: { mensagem: string; aoTentarNovamente: () => void }) {
  const cores = useCores();
  return (
    <View style={estilos.centro} accessibilityLiveRegion="polite">
      <Text style={[estilos.tituloVazio, { color: cores.texto }]}>
        Não foi possível ler a lista salva no aparelho.
      </Text>
      <Text style={[estilos.textoCentral, { color: cores.textoSecundario }]}>{mensagem}</Text>
      <Botao rotulo="Tentar novamente" icone="refresh" aoTocar={aoTentarNovamente} />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { flex: 1 },
  acoes: { flexDirection: 'row' },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaco.gg,
    gap: espaco.p,
  },
  tituloVazio: { fontSize: 18, fontWeight: '500', textAlign: 'center', marginTop: espaco.p },
  textoCentral: { fontSize: 15, textAlign: 'center', marginBottom: espaco.p },
  grade: { paddingHorizontal: espaco.m },
  linhaDaGrade: { gap: espaco.p },
  celula: { flex: 1 },
  resumo: { paddingTop: espaco.m, paddingBottom: espaco.m, gap: espaco.p },
  tituloResumo: { fontSize: 16, fontWeight: '500' },
  trilha: { height: 4, borderRadius: 2, overflow: 'hidden' },
  preenchimento: { height: 4 },
  pendentes: { fontSize: 13 },
  botaoFlutuante: {
    position: 'absolute',
    right: espaco.m,
    height: alturaDoBotaoFlutuante,
    borderRadius: raio.cartao + 2,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.p,
    elevation: 4,
  },
  rotuloFlutuante: { fontSize: 15, fontWeight: '600' },
});
