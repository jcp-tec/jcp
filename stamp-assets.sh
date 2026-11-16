#!/usr/bin/env bash
#
# Carimba a versao do conteudo nas URLs dos assets: style.css?v=<hash>
#
# Por que existe: o servidor manda "cache-control: max-age=604800" para CSS e JS.
# Sem versao na URL, quem ja visitou recebe HTML novo com CSS de ate 7 dias atras.
# Foi o que quebrou o site em 05/09/2026 — hero novo com regra antiga, titulo
# branco sobre fundo branco. O hash vem do conteudo, entao a URL so muda quando
# o arquivo muda.
#
# Rode antes de commitar. O deploy.sh chama e aborta se algo ficou por carimbar.
#
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

# md5 -q existe so no macOS; no Linux usa md5sum. Saida: 8 primeiros caracteres do hash.
hash8() {
  if command -v md5 >/dev/null 2>&1; then md5 -q "$1" | cut -c1-8
  else md5sum "$1" | cut -c1-8; fi
}

stamp_in() {  # stamp_in <arquivo-alvo> <caminho-do-asset> <hash>
  perl -i -pe "s{\Q$2\E(\?v=[0-9a-f]+)?}{$2?v=$3}g" "$1"
}

# 1) hero-motion.js e importado de dentro do main.js. Carimba primeiro, senao o
#    hash do main.js mudaria depois de ja ter sido calculado.
hm=$(hash8 assets/js/hero-motion.js)
stamp_in assets/js/main.js "./hero-motion.js" "$hm"
echo "  assets/js/hero-motion.js  ->  v=$hm  (import dentro do main.js)"

# 2) agora o main.js esta na forma final; carimba os tres nas paginas
for a in assets/css/style.css assets/js/i18n.js assets/js/main.js; do
  h=$(hash8 "$a")
  for f in *.html; do stamp_in "$f" "$a" "$h"; done
  echo "  $a  ->  v=$h"
done
