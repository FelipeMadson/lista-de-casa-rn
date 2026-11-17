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

# Espera o texto aparecer na tela (até ~30 s) ou falha mostrando o que havia.
esperar_texto() {
  for _ in $(seq 1 15); do
    adb shell uiautomator dump /sdcard/tela.xml > /dev/null 2>&1 || true
    if adb shell cat /sdcard/tela.xml | grep -q "$1"; then
      echo "ok: \"$1\""
      return 0
    fi
    sleep 2
  done
  echo "FALHA: \"$1\" não apareceu. Textos na tela:"
  adb shell cat /sdcard/tela.xml | grep -o 'text="[^"]*"' | sort -u || true
  exit 1
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

echo "== Sem conexão"
adb shell am start -W -n "$PACOTE/.MainActivity" > /dev/null
adb shell svc wifi disable
adb shell svc data disable
esperar_texto "Sem conexão"
capturar 05-offline
adb shell svc wifi enable
adb shell svc data enable

echo "Todas as verificações passaram."
