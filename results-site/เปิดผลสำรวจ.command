#!/bin/zsh
cd -- "$(dirname -- "$0")" || exit 1
if /usr/bin/curl --silent --max-time 2 http://127.0.0.1:3035/health | /usr/bin/grep -q 'happiness-private-results'; then
  /usr/bin/open http://127.0.0.1:3035
  exit 0
fi
NODE_BIN="$(command -v node)"
if [[ -z "$NODE_BIN" && -x /usr/local/bin/node ]]; then NODE_BIN=/usr/local/bin/node; fi
if [[ -z "$NODE_BIN" ]]; then print 'ไม่พบ Node.js กรุณาติดต่อผู้ดูแล'; read -k 1; exit 1; fi
(sleep 1; /usr/bin/open http://127.0.0.1:3035) &
print 'ปิดหน้าต่างนี้เพื่อหยุดเว็บดูผล หรือกด Control+C'
"$NODE_BIN" local-server.cjs
