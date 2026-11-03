#!/usr/bin/env bash
# 공통 모듈을 각 시안 폴더에 복사하고 index.html을 만든다 (Vercel이 시안 폴더만 배포하므로).
set -e
cd "$(dirname "$0")"
declare -A TITLE=([a]="PersonaLab 시안 A · 정밀" [b]="PersonaLab 시안 B · 스튜디오" [c]="PersonaLab 시안 C · 리포트")
declare -A FONTS=(
 [a]=""
 [b]='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700\&display=swap">'
 [c]='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Han+Sans\&family=Hahmlet:wght@500;700\&display=swap">'
)
for v in a b c; do
  rm -rf "$v/shared"; mkdir -p "$v/shared"; cp shared/*.js shared/*.css "$v/shared/"
  sed -e "s|__TITLE__|${TITLE[$v]}|" -e "s|__FONTS__|${FONTS[$v]}|" index.tmpl.html > "$v/index.html"
done
echo "built a b c"
