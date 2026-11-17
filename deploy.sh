#!/usr/bin/env bash
#
# Deploy do site estatico para a Hostinger via rsync/SSH.
#
#   ./deploy.sh              simulacao (nao envia nada) - PADRAO
#   ./deploy.sh --apply      envia de verdade
#   ./deploy.sh --apply --prune   envia E apaga do servidor o que nao existe aqui
#
set -euo pipefail

HOST="jcp-site-hostinger"                          # ver ~/.ssh/config
REMOTE="domains/justcodepeople.com/public_html/"
SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/"

# Nunca subir para um servidor web: historico do git, config e docs internas.
EXCLUDES=(
  --exclude '.git'
  --exclude '.gitignore'
  --exclude '.github'
  --exclude '.claude'                              # agentes, venv do QA, planos: nunca publicar
  --exclude '.DS_Store'
  --exclude 'deploy.sh'
  --exclude 'stamp-assets.sh'
  --exclude '/README.md'
)

APPLY=0; PRUNE=0
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY=1 ;;
    --prune) PRUNE=1 ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "erro: argumento desconhecido '$arg'" >&2; exit 2 ;;
  esac
done

# --- Verificacoes antes de publicar -----------------------------------------
cd "$SRC"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "AVISO: ha alteracoes nao commitadas. O servidor vai ficar diferente do repo."
  git status --short
  echo
fi
if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  git fetch -q origin || true
  if [[ "$(git rev-parse HEAD)" != "$(git rev-parse '@{u}')" ]]; then
    echo "AVISO: seu branch nao esta sincronizado com o remoto."
    echo
  fi
fi

# --- Versao dos assets ------------------------------------------------------
# Sem ?v=<hash> na URL, o cache de 7 dias do servidor entrega CSS velho junto
# com HTML novo. Carimba e aborta se isso gerou mudanca ainda nao commitada.
./stamp-assets.sh >/dev/null
if [[ -n "$(git status --porcelain -- '*.html' assets/js/main.js)" ]]; then
  echo "ERRO: a versao dos assets estava desatualizada e acabou de ser corrigida."
  echo "Revise e commite antes de publicar, para o repo e o servidor baterem:"
  git status --short -- '*.html' assets/js/main.js
  exit 1
fi

RSYNC=(rsync -avz "${EXCLUDES[@]}")
(( PRUNE )) && RSYNC+=(--delete)
(( APPLY )) || RSYNC+=(-n)

# --- Confirmacao para operacao destrutiva -----------------------------------
if (( APPLY && PRUNE )); then
  echo "ATENCAO: --prune APAGA no servidor todo arquivo que nao existe aqui."
  echo "Alvo: $HOST:$REMOTE"
  read -r -p "Digite APAGAR para confirmar: " ok
  [[ "$ok" == "APAGAR" ]] || { echo "cancelado."; exit 1; }
fi

(( APPLY )) || echo ">>> SIMULACAO - nada sera enviado. Use --apply para valer."
echo ">>> $HOST:$REMOTE"
echo

"${RSYNC[@]}" "$SRC" "$HOST:$REMOTE"

echo
if (( APPLY )); then
  echo "Deploy concluido. Confira: https://www.justcodepeople.com"
  echo "O .git NAO foi enviado (verifique: curl -sI https://www.justcodepeople.com/.git/HEAD)"
else
  echo "Simulacao concluida. Reveja a lista acima e rode: ./deploy.sh --apply"
fi
