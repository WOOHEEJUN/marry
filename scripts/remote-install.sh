#!/usr/bin/env bash
# 서버에서 실행되는 설치 스크립트 (deploy.ps1 이 전송해서 실행)
set -e

mkdir -p /opt/marry
rm -rf /opt/marry/dist /opt/marry/server
tar -xzf /tmp/marry.tar.gz -C /opt/marry
rm -f /tmp/marry.tar.gz

# config.json 은 서버 것이 우선 (당일 수정분 보존)
if [ ! -f /opt/marry/config.json ]; then
  cp /opt/marry/config.default.json /opt/marry/config.json
  echo "  config.json 신규 생성"
else
  echo "  기존 config.json 유지"
fi

cd /opt/marry
npm install --omit=dev --no-audit --no-fund --silent

systemctl daemon-reload
systemctl restart marry
sleep 2
systemctl is-active marry
