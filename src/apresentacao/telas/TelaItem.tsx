import { router, Stack, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { identidade } from '../../config/identidade';
import { novoItem, type Item } from '../../dominio/item';
import {
  ajustarQuantidade,
  quantidadeMaxima,
  quantidadeMinima,
  tamanhoMaximoNome,
  validarNome,
} from '../../dominio/regrasItem';
import { Aviso } from '../componentes/Aviso';
import { Botao } from '../componentes/Botao';
import { BotaoIcone } from '../componentes/BotaoIcone';
import { confirmar } from '../confirmar';
import { itensStore, useItens } from '../dependencias';
import { mensagemDeErro } from '../estado/mensagemDeErro';
import { alvoMinimo, espaco, larguraMaximaConteudo, raio, useCores } from '../tema';
import { TelaNaoEncontrada } from './TelaNaoEncontrada';

/**
 * Localiza o item a editar (ou nenhum, para criar) e entrega ao formulário.
 * Aberta por ligação profunda, esta tela pode surgir antes da lista carregar.
 */
export function TelaItem({ id }: { id?: number }) {
  const cores = useCores();
  const lista = useItens((s) => s.lista);

  if (id === undefined) return <FormularioItem />;

  if (lista.status === 'carregando') {
    return (
      <View style={[estilos.centro, { backgroundColor: cores.fundo }]}>
        <ActivityIndicator size="large" color={cores.primaria} accessibilityLabel="Carregando o item" />
      </View>
    );
  }
  if (lista.status === 'erro') {
    return (
      <View style={[estilos.centro, { backgroundColor: cores.fundo }]}>
        <Text style={{ color: cores.texto, textAlign: 'center' }}>
          Falha ao carregar: {lista.mensagem}
        </Text>
      </View>
    );
  }
  const item = lista.itens.find((i) => i.id === id);
  // A chave recria o formulário se outro item for aberto na mesma tela.
  return item ? <FormularioItem key={item.id} item={item} /> : <TelaNaoEncontrada />;
}

function FormularioItem({ item }: { item?: Item }) {
  const cores = useCores();
  const editando = item !== undefined;

  const [nome, setNome] = useState(item?.nome ?? '');
  const [categoria, setCategoria] = useState<string>(item?.categoria ?? identidade.categorias[0]);
  const [quantidade, setQuantidade] = useState(item?.quantidade ?? 1);
  const [observacao, setObservacao] = useState(item?.observacao ?? '');
  const [alterado, setAlterado] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [falha, setFalha] = useState<{ mensagem: string; versao: number }>({ mensagem: '', versao: 0 });

  const erroNome = tentouSalvar ? validarNome(nome) : null;
  // Mantém a categoria atual entre as opções, mesmo que a lista de
  // categorias da identidade tenha mudado depois de o item ser salvo.
  const categorias = [...new Set<string>([...identidade.categorias, categoria])];

  // Equivalente ao PopScope do Flutter (Aula 19): bloqueia "voltar" — botão
  // do sistema ou do cabeçalho — enquanto houver alterações não salvas.
  usePreventRemove(alterado && !concluido, ({ repeat }) => {
    void confirmar({
      titulo: 'Descartar alterações?',
      mensagem: 'As alterações feitas neste formulário serão perdidas.',
      cancelar: 'Continuar editando',
      confirmar: 'Descartar',
    }).then((descartar) => {
      if (!descartar) return;
      setConcluido(true); // desliga a proteção
      repeat(); // reenvia a navegação que foi bloqueada
    });
  });

  // Depois de salvar, a proteção já está desligada e a tela pode sair.
  useEffect(() => {
    if (concluido && !alterado) router.back();
  }, [concluido, alterado]);

  const alterar = <T,>(definir: (valor: T) => void) => (valor: T) => {
    definir(valor);
    setAlterado(true);
  };

  async function salvar() {
    setTentouSalvar(true);
    if (validarNome(nome) !== null || salvando) return;
    setSalvando(true);

    const dados = {
      nome: nome.trim(),
      quantidade,
      categoria,
      observacao: observacao.trim(),
    };
    const paraSalvar: Item = item ? { ...item, ...dados } : novoItem(dados);

    try {
      await itensStore.getState().salvar(paraSalvar);
      setAlterado(false);
      setConcluido(true);
    } catch (erro) {
      setSalvando(false);
      setFalha((f) => ({ mensagem: `Não foi possível salvar: ${mensagemDeErro(erro)}`, versao: f.versao + 1 }));
    }
  }

  const estiloCampo = [estilos.campo, { borderColor: cores.contorno, color: cores.texto }];

  return (
    <KeyboardAvoidingView behavior="padding" style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <Stack.Screen options={{ title: editando ? 'Editar item' : 'Novo item' }} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={estilos.rolagem}>
        <View style={estilos.formulario}>
          <View>
            <Text nativeID="rotulo-nome" style={[estilos.rotulo, { color: cores.texto }]}>
              Nome do item
            </Text>
            <TextInput
              accessibilityLabel="Nome do item"
              accessibilityLabelledBy="rotulo-nome"
              value={nome}
              onChangeText={alterar(setNome)}
              autoFocus={!editando}
              autoCapitalize="sentences"
              maxLength={tamanhoMaximoNome}
              returnKeyType="done"
              style={[estiloCampo, erroNome ? { borderColor: cores.erroTexto, borderWidth: 2 } : null]}
            />
            <View style={estilos.linhaAjuda}>
              <Text accessibilityLiveRegion="polite" style={[estilos.ajuda, { color: cores.erroTexto }]}>
                {erroNome ?? ''}
              </Text>
              <Text style={[estilos.ajuda, { color: cores.textoSecundario }]}>
                {nome.length}/{tamanhoMaximoNome}
              </Text>
            </View>
          </View>

          <View>
            <Text style={[estilos.rotulo, { color: cores.texto }]}>Categoria</Text>
            <View accessibilityRole="radiogroup" style={estilos.opcoes}>
              {categorias.map((c) => {
                const selecionada = c === categoria;
                return (
                  <Pressable
                    key={c}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selecionada }}
                    onPress={() => alterar(setCategoria)(c)}
                    style={[
                      estilos.opcao,
                      { borderColor: cores.contorno },
                      selecionada && { backgroundColor: cores.primaria, borderColor: cores.primaria },
                    ]}
                  >
                    <Text style={{ color: selecionada ? cores.sobrePrimaria : cores.texto, fontSize: 15 }}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={estilos.linhaQuantidade}>
            <Text style={[estilos.rotuloQuantidade, { color: cores.texto }]}>Quantidade</Text>
            <BotaoIcone
              rotulo="Diminuir quantidade"
              icone="remove"
              contornado
              desabilitado={quantidade <= quantidadeMinima}
              aoTocar={() => alterar(setQuantidade)(ajustarQuantidade(quantidade, -1))}
            />
            <Text
              accessibilityLabel={`Quantidade: ${quantidade}`}
              accessibilityLiveRegion="polite"
              style={[estilos.valorQuantidade, { color: cores.texto }]}
            >
              {quantidade}
            </Text>
            <BotaoIcone
              rotulo="Aumentar quantidade"
              icone="add"
              contornado
              desabilitado={quantidade >= quantidadeMaxima}
              aoTocar={() => alterar(setQuantidade)(ajustarQuantidade(quantidade, 1))}
            />
          </View>

          <View>
            <Text style={[estilos.rotulo, { color: cores.texto }]}>Observação (opcional)</Text>
            <TextInput
              accessibilityLabel="Observação (opcional)"
              value={observacao}
              onChangeText={alterar(setObservacao)}
              placeholder="Marca, tamanho, sabor..."
              placeholderTextColor={cores.textoSecundario}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={[estiloCampo, estilos.campoLongo]}
            />
          </View>

          <Botao
            rotulo={editando ? 'Salvar alterações' : 'Adicionar à lista'}
            icone="check"
            desabilitado={salvando}
            aoTocar={salvar}
          />
        </View>
      </ScrollView>
      <Aviso mensagem={falha.mensagem || null} versao={falha.versao} />
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espaco.g },
  rolagem: { padding: espaco.m, alignItems: 'center' },
  // Em telas largas, o formulário não passa de 600 dp (Aula 3).
  formulario: { width: '100%', maxWidth: larguraMaximaConteudo, gap: espaco.g },
  rotulo: { fontSize: 14, fontWeight: '500', marginBottom: 6 },
  campo: {
    minHeight: alvoMinimo + 8,
    borderWidth: 1,
    borderRadius: raio.campo,
    paddingHorizontal: espaco.m,
    paddingVertical: 12,
    fontSize: 16,
  },
  campoLongo: { minHeight: 96 },
  linhaAjuda: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, gap: espaco.p },
  ajuda: { fontSize: 12, flexShrink: 1 },
  opcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.p },
  opcao: {
    minHeight: alvoMinimo,
    justifyContent: 'center',
    paddingHorizontal: espaco.m,
    borderWidth: 1,
    borderRadius: alvoMinimo / 2,
  },
  linhaQuantidade: { flexDirection: 'row', alignItems: 'center', gap: espaco.p },
  rotuloQuantidade: { flex: 1, fontSize: 16, fontWeight: '500' },
  valorQuantidade: { minWidth: 48, textAlign: 'center', fontSize: 22 },
});
