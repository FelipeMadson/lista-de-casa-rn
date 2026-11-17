# Paridade Flutter × React Native

Conferência do [checklist de paridade](https://github.com/claulis/Desenvolvimento-para-Dispositivos-Moveis-2026/blob/main/recursos/checklist-paridade.md) entre a [versão Flutter](https://github.com/FelipeMadson/lista-de-casa) e esta versão.

## Rotas e navegação

| Requisito | Flutter | React Native |
|---|---|---|
| Mesmas rotas | `go_router`: `/`, `/item/novo`, `/item/:id`, `/sobre` | Expo Router: `/`, `/item/novo`, `/item/[id]`, `/sobre` |
| Rota desconhecida | `errorBuilder` → `TelaNaoEncontrada` | `+not-found.tsx` → `TelaNaoEncontrada` |
| Lista abaixo do item aberto por ligação profunda | Rotas filhas de `/` | `unstable_settings.anchor = 'index'` |
| Confirmação ao sair de formulário alterado | `PopScope` | `usePreventRemove` (evento `beforeRemove`) |
| Ligação profunda por `adb` | `compras://app/item/7` (exige o `intent-filter` no `AndroidManifest.xml`) | `listadecasa://item/7` (o `scheme` do `app.json` gera o `intent-filter`) |

## Estado e arquitetura

| Requisito | Flutter | React Native |
|---|---|---|
| Camadas | `dominio/`, `dados/`, `apresentacao/` | `src/dominio/`, `src/dados/`, `src/apresentacao/` |
| Contrato do repositório | `abstract interface class ItemRepository` | `interface ItemRepository` |
| Raiz de composição | `providers.dart` | `dependencias.ts` |
| Gerenciador de estado | Riverpod (`AsyncNotifier`, `Notifier`) | Zustand (stores criadas com as dependências) |
| Lógica de negócio fora da interface | `regras_item.dart` | `regrasItem.ts` |

## Dados e conectividade

| Requisito | Flutter | React Native |
|---|---|---|
| Banco local | `sqflite`, arquivo `compras.db`, mesmo esquema | `expo-sqlite`, arquivo `compras.db`, mesmo esquema |
| Concorrência otimista | `WHERE id = ? AND atualizado_em = ?` | Igual |
| Nova tentativa | 3 tentativas, base 500 ms, exponencial + jitter | Igual |
| Serviço remoto | Simulado, 30% de falhas, 200–800 ms | Igual |
| Detecção de rede | `connectivity_plus` | `@react-native-community/netinfo` |
| Envio automático ao reconectar | `ref.listen` no provider de conectividade | `conectividadeStore.subscribe` |
| Sem rede ao pedir envio | Mensagem, nada é enviado | Igual |

## Estados de interface

| Estado | Flutter | React Native |
|---|---|---|
| Carregando | `CircularProgressIndicator` | `ActivityIndicator` |
| Erro | Mensagem específica + "Tentar novamente" | Igual |
| Vazio | Cesta + "A lista está vazia." | Igual |
| Offline com dados em cache | Faixa "Sem conexão..." acima da lista salva | Igual |
| Resultado do envio | `SnackBar` | Componente `Aviso` |

## Responsividade e acessibilidade

| Requisito | Flutter | React Native |
|---|---|---|
| Três classes de janela | 1, 2 e 3 colunas em 600 e 840 dp (`LayoutBuilder`) | Igual (`useWindowDimensions` + `numColumns`) |
| Largura máxima de formulário | 600 dp | 600 dp |
| Fonte ampliada | Altura do cartão acompanha a escala | Cartão sem altura fixa |
| Rótulos acessíveis | `tooltip`, `semanticLabel` | `accessibilityLabel`, `accessibilityRole`, `accessibilityState` |
| Anúncio da faixa offline | `Semantics(liveRegion: true)` | `accessibilityLiveRegion="polite"` |
| Exclusão sem gesto | — | Ação acessível "Excluir" no cartão |
| Alvos de toque | 48 dp | 48 dp |
| Contraste | Tema monocromático | Pares texto/fundo de ao menos 4,5:1, claro e escuro |

## Integração nativa

| Requisito | Flutter | React Native |
|---|---|---|
| Mecanismo | `MethodChannel('compras/dispositivo')` | Módulo Expo `Dispositivo` em Kotlin |
| Dados | Fabricante, modelo, versão do Android, bateria | Igual |
| Plataforma sem implementação | `MissingPluginException` → `null` | `requireOptionalNativeModule` → `null` |

## Diferenças conhecidas

- O identificador do app é outro (`br.com.felipemadison.listadecasa`), para as duas versões poderem ficar instaladas no mesmo aparelho. Pelo mesmo motivo, o esquema da ligação profunda é `listadecasa://`, e não `compras://`.
- A versão React Native tem uma ação acessível de exclusão, porque o gesto de arrastar não é exposto ao leitor de tela.
- Categoria é escolhida por botões de opção, e não por lista suspensa: o React Native não tem um componente de lista suspensa nativo, e as quatro categorias cabem na tela.
