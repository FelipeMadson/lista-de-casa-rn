import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { identidade } from '../../config/identidade';
import type { InfoDispositivo } from '../../dados/plataforma/dispositivoNativo';
import { banco, dispositivoNativo } from '../dependencias';
import { mensagemDeErro } from '../estado/mensagemDeErro';
import { espaco, larguraMaximaConteudo, useCores } from '../tema';

type Consulta<T> = { status: 'carregando' } | { status: 'pronto'; valor: T } | { status: 'erro'; mensagem: string };

/** Executa uma consulta assíncrona uma vez e expõe os três estados. */
function useConsulta<T>(consultar: () => Promise<T>): Consulta<T> {
  const [estado, setEstado] = useState<Consulta<T>>({ status: 'carregando' });
  useEffect(() => {
    let ativo = true;
    consultar().then(
      (valor) => ativo && setEstado({ status: 'pronto', valor }),
      (erro) => ativo && setEstado({ status: 'erro', mensagem: mensagemDeErro(erro) }),
    );
    return () => {
      ativo = false;
    };
    // A consulta roda só ao abrir a tela.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return estado;
}

function formatar(data: Date): string {
  const dois = (n: number) => String(n).padStart(2, '0');
  return `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()} às ${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

export function TelaSobre() {
  const cores = useCores();
  const dispositivo = useConsulta<InfoDispositivo | null>(() => dispositivoNativo.obterInformacoes());
  const criadoEm = useConsulta(() => banco.lerMetadado('criado_em'));

  const textoDispositivo = (() => {
    if (dispositivo.status === 'carregando') return null;
    if (dispositivo.status === 'erro') return `Falha na consulta: ${dispositivo.mensagem}`;
    const info = dispositivo.valor;
    if (!info) return 'Informação indisponível nesta plataforma.';
    return `${info.fabricante} ${info.modelo}\nAndroid ${info.versaoAndroid} · bateria em ${info.nivelBateria}%`;
  })();

  const textoBanco = (() => {
    if (criadoEm.status === 'carregando') return 'Consultando...';
    if (criadoEm.status === 'erro') return `Falha na consulta: ${criadoEm.mensagem}`;
    return criadoEm.valor
      ? `Criado neste aparelho em ${formatar(new Date(criadoEm.valor))}.`
      : 'Data de criação não registrada.';
  })();

  const texto = { color: cores.texto };
  const divisor = <View style={[estilos.divisor, { backgroundColor: cores.divisor }]} />;

  return (
    <ScrollView style={{ backgroundColor: cores.fundo }} contentContainerStyle={estilos.rolagem}>
      <View style={estilos.conteudo}>
        <Text accessibilityRole="header" style={[estilos.nome, texto]}>
          {identidade.nomeDoApp}
        </Text>
        <Text style={[estilos.corpo, texto]}>{identidade.descricao}</Text>

        {divisor}
        <Text accessibilityRole="header" style={[estilos.secao, texto]}>Autoria</Text>
        {identidade.integrantes.map((integrante) => (
          <Linha key={integrante.nome} icone="person-outline" texto={integrante.nome} />
        ))}
        <Linha icone="school" texto={identidade.turma} />

        {divisor}
        <Text accessibilityRole="header" style={[estilos.secao, texto]}>
          Dispositivo (módulo nativo)
        </Text>
        {textoDispositivo === null ? (
          <ActivityIndicator color={cores.primaria} accessibilityLabel="Consultando o aparelho" />
        ) : (
          <Text style={[estilos.corpo, texto]}>{textoDispositivo}</Text>
        )}

        {divisor}
        <Text accessibilityRole="header" style={[estilos.secao, texto]}>Banco de dados local</Text>
        <Text style={[estilos.corpo, texto]}>{textoBanco}</Text>
      </View>
    </ScrollView>
  );
}

function Linha({ icone, texto }: { icone: 'person-outline' | 'school'; texto: string }) {
  const cores = useCores();
  return (
    <View style={estilos.linha}>
      <MaterialIcons name={icone} size={24} color={cores.textoSecundario} importantForAccessibility="no" />
      <Text style={[estilos.corpo, { color: cores.texto, flex: 1 }]}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  rolagem: { padding: espaco.m, alignItems: 'center' },
  conteudo: { width: '100%', maxWidth: larguraMaximaConteudo, gap: espaco.p },
  nome: { fontSize: 24, fontWeight: '600' },
  secao: { fontSize: 16, fontWeight: '600' },
  corpo: { fontSize: 16, lineHeight: 22 },
  divisor: { height: 1, marginVertical: espaco.m },
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.m, minHeight: 48 },
});
