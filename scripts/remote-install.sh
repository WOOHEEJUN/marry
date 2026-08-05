#!/usr/bin/env bash
# 서버에서 실행되는 설치 스크립트 (deploy.ps1 이 전송해서 실행)
set -e

mkdir -p /opt/marry
rm -rf /opt/marry/dist /opt/marry/server /opt/marry/scripts
tar -xzf /tmp/marry.tar.gz -C /opt/marry
rm -f /tmp/marry.tar.gz

if [ ! -f /opt/marry/config.json ]; then
  cp /opt/marry/config.default.json /opt/marry/config.json
  echo "  config.json 신규 생성"
else
  # schema 가 바뀐 경우에만 교체하고, 사람이 채운 값은 옮겨 담는다
  node /opt/marry/scripts/migrate-config.mjs
fi

cd /opt/marry
npm install --omit=dev --no-audit --no-fund --silent

systemctl daemon-reload
systemctl restart marry
sleep 2
systemctl is-active marry
