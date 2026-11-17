#!/usr/bin/env bash
# Instala o APK no emulador e confere, pela árvore de acessibilidade, as
# telas principais, a ligação profunda, o módulo nativo e o aviso offline.
# Uso: bash scripts/verificar-no-emulador.sh caminho/do/app.apk pasta/das/capturas
set -euo pipefail

APK="$1"
SAIDA="$2"
PACOTE="br.com.felipemadison.listadecasa"
mkdir -p "$SAIDA"

capturar() {
  adb exec-out screencap -p > "$SAIDA/$1.png"
}

# Em caso de falha, guarda a tela e o log do Android para diagnóstico.
# As linhas "::error::" viram anotações visíveis no resumo da execução.
diagnosticar() {
  capturar falha || true
  adb logcat -d > "$SAIDA/logcat.txt" 2>&1 || true
  local erros
  erros=$(grep -E "FATAL EXCEPTION|AndroidRuntime|ReactNativeJS.*(Error|error)" "$SAIDA/logcat.txt" | head -n 25 | paste -sd ' ' || true)
  echo "::error::Log do Android: ${erros:-nenhum erro registrado}"
}
trap 'diagnosticar' ERR

# Copia a árvore de acessibilidade da tela atual para um arquivo local.
# A resposta do uiautomator fica em dump.txt para o diagnóstico.
ler_tela() {
  adb shell uiautomator dump /sdcard/tela.xml > "$SAIDA/dump.txt" 2>&1 || return 1
  adb pull /sdcard/tela.xml "$SAIDA/tela.xml" > /dev/null 2>&1 || return 1
}

# Espera o texto aparecer na tela (até ~60 s) ou falha mostrando o que havia.
esperar_texto() {
  for _ in $(seq 1 20); do
    if ler_tela && grep -qF "$1" "$SAIDA/tela.xml"; then
      echo "ok: \"$1\""
      return 0
    fi
    sleep 3
  done
  local textos
  textos=$(grep -o 'text="[^"]*"' "$SAIDA/tela.xml" 2>/dev/null | sort -u | paste -sd ' ' || true)
  echo "::error::\"$1\" não apareceu. Textos na tela: ${textos:-nenhum}. uiautomator: $(paste -sd ' ' "$SAIDA/dump.txt" 2>/dev/null)"
  return 1
}

abrir_link() {
  adb shell am start -W -a android.intent.action.VIEW -d "$1" "$PACOTE" > /dev/null
}

adb install -r "$APK"

echo "== Abertura"
adb shell am start -W -n "$PACOTE/.MainActivity" > /dev/null
esperar_texto "Lista de casa"
esperar_texto "A lista está vazia."
capturar 01-lista-vazia

echo "== Formulário de novo item (ligação profunda)"
abrir_link "listadecasa://item/novo"
esperar_texto "Adicionar à lista"
capturar 02-novo-item

echo "== Item inexistente (ligação profunda)"
abrir_link "listadecasa://item/999"
esperar_texto "não corresponde a nenhum item"
capturar 03-nao-encontrado

echo "== Sobre: módulo nativo e banco"
abrir_link "listadecasa://sobre"
esperar_texto "Felipe Madison da Silva Veloso"
esperar_texto "bateria em"
esperar_texto "Criado neste aparelho em"
capturar 04-sobre

echo "== Voltar à lista"
# "Voltar" desempilha Sobre, item inexistente e formulário (sem alterações,
# então não há diálogo). A ligação profunda manteve a lista na base da pilha.
for _ in 1 2 3; do
  adb shell input keyevent KEYCODE_BACK
  sleep 1
done
esperar_texto "A lista está vazia."

echo "== Sem conexão"
adb shell svc wifi disable
adb shell svc data disable
esperar_texto "Sem conexão"
capturar 05-offline
adb shell svc wifi enable
adb shell svc data enable

echo "Todas as verificações passaram."
