# Lista de casa — React Native

Versão em React Native do aplicativo [Lista de casa](https://github.com/FelipeMadson/lista-de-casa), feito em Flutter para a Avaliação 1. As duas versões implementam o mesmo módulo, com as mesmas telas, regras, dados e comportamento offline, para a comparação da Aula 24. A equivalência item a item está em [PARIDADE.md](PARIDADE.md).

Disciplina Desenvolvimento para Dispositivos Móveis — IFB, 2026.

## O que faz

- Cadastra, edita e exclui itens com categoria, quantidade e observação.
- Marca itens comprados e mantém os dados em SQLite no aparelho.
- Mostra uma faixa quando o aparelho fica sem rede e simula o envio das alterações pendentes, com nova tentativa e espera progressiva em falhas transitórias. Ao voltar a rede, o envio recomeça sozinho.
- Abre itens por ligação profunda (`listadecasa://item/7`) e pede confirmação antes de descartar um formulário alterado.
- Mostra, na tela "Sobre", dados do aparelho obtidos por um módulo nativo em Kotlin.

A sincronização é **simulada**: nenhum servidor real recebe os dados.

## Arquitetura

O código fica em três camadas, como na versão Flutter:

| Camada | Pasta | Conteúdo |
|---|---|---|
| Domínio | `src/dominio/` | Entidade `Item`, regras puras (validação, quantidade, ordenação, resumo) e o contrato `ItemRepository`. Não importa React Native nem SQLite. |
| Dados | `src/dados/` | Repositório SQLite (`expo-sqlite`), migrações por `PRAGMA user_version`, serviço remoto simulado, nova tentativa com backoff e jitter, sincronizador e acesso ao módulo nativo. |
| Apresentação | `src/apresentacao/` | Telas, componentes, tema e estado (Zustand). `dependencias.ts` é a raiz de composição: o único arquivo que conhece as classes concretas da camada de dados. |

`src/app/` contém apenas as rotas do Expo Router; cada arquivo entrega a tela correspondente da camada de apresentação. O módulo nativo fica em `modules/dispositivo/` e é ligado ao app automaticamente no build.

### Fluxo de uma alteração

Ao salvar um item, a tela chama `itensStore.salvar`, que grava pelo contrato `ItemRepository`. O repositório SQLite marca o item como pendente de envio e atualiza `atualizado_em`. A store relê a lista, e a tela renderiza de novo. A sincronização lê os pendentes, envia cada um com nova tentativa e só marca como enviada a versão que não mudou durante o envio (a condição `WHERE atualizado_em = ?`).

### Gerenciamento de estado: por que Zustand

A versão Flutter usa Riverpod. Entre as opções da Aula 17 (Context, Redux, Zustand), o Zustand é o que mais se aproxima dele neste módulo:

- **Seletores**: `useItens((s) => s.lista)` faz o componente renderizar de novo só quando aquela fatia muda, como o `select` do Riverpod. Com Context, toda mudança no valor renderiza todos os consumidores.
- **Lógica fora dos componentes**: as stores são criadas por funções que recebem as dependências (`criarItensStore(repositorio)`). Os testes usam um repositório em memória sem montar nenhuma tela.
- **Custo baixo**: não há actions, reducers e middlewares como no Redux, que se pagariam em um app com muitos fluxos de estado, mas não em uma lista com três operações.

O preço é que não há injeção de dependência pronta, como os providers do Riverpod. Ela foi resolvida à mão em `dependencias.ts`.

## Executar

Requer Node.js 24 e, para rodar no aparelho, o ambiente Android (Android Studio, SDK e JDK 17).

```sh
npm install
npm run typecheck   # tipos do app e dos testes
npm run lint
npm test            # 33 testes, inclusive com SQLite real
npm run android     # compila e instala no emulador ou aparelho conectado
```

O app usa um módulo nativo próprio, por isso **não roda no Expo Go**: `npm run android` gera um *development build*.

### Ligação profunda

Com o app instalado:

```sh
adb shell am start -W -a android.intent.action.VIEW -d "listadecasa://item/1" br.com.felipemadison.listadecasa
```

Abre o item 1, com a lista abaixo na pilha: "voltar" leva à lista. Um id inexistente mostra "Página não encontrada".

## APK

O workflow [Verificação Android](.github/workflows/android.yml) roda a cada envio ao GitHub:

1. tipos, lint, testes e `expo-doctor`;
2. gera a pasta `android/` com `expo prebuild` e compila o APK de release;
3. instala o APK em um emulador Android 15 e confere, pela árvore de acessibilidade, a tela inicial, a ligação profunda, o módulo nativo, a data de criação do banco e a faixa offline ([script](scripts/verificar-no-emulador.sh)).

O APK (`lista-de-casa-rn-v1.0.0.apk`) e as capturas de tela ficam nos artefatos de cada execução. Ele é assinado com a chave de depuração e serve apenas para demonstração acadêmica.

## Testes

| Arquivo | O que cobre |
|---|---|
| `test/dominio/regrasItem.test.ts` | Validação do nome, limites da quantidade, ordenação e resumo |
| `test/dados/itemRepositorySqlite.test.ts` | Esquema, migração, CRUD, restrição `CHECK` e concorrência otimista, com SQLite real (`node:sqlite`) e o mesmo SQL do app |
| `test/dados/novaTentativa.test.ts` | Espera exponencial com jitter, limite de tentativas e erros não transitórios |
| `test/dados/sincronizador.test.ts` | Envio dos pendentes e item que continua pendente após falhar |
| `test/apresentacao/estado.test.ts` | Estados de carregamento, erro e conteúdo, remoção otimista desfeita, sincronização offline e leitura do id da rota |

## Autoria

Felipe Madison da Silva Veloso. Base técnica: aulas 16 a 20 do [repositório da disciplina](https://github.com/claulis/Desenvolvimento-para-Dispositivos-Moveis-2026).
