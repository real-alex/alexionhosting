#!/bin/sh
# Alexion SA-MP/CRMP container entrypoint.
# Seeds the data volume, then runs the real server binary if present, otherwise
# the bundled dev simulator so the platform is fully testable.
set -eu

DATA="/alexion/data"
SRC="/alexion/server-files"
TYPE="${SERVER_TYPE:-samp}"
PORT="${GAME_PORT:-7777}"

echo "[alexion] Booting ${TYPE} server '${SERVER_HOSTNAME:-Alexion Server}' on UDP ${PORT}"

# Seed defaults into the persistent volume on first boot only.
if [ ! -f "${DATA}/.seeded" ]; then
  echo "[alexion] Seeding default server files into data volume..."
  cp -r "${SRC}/." "${DATA}/" 2>/dev/null || true
  touch "${DATA}/.seeded"
fi

# Real server binary names differ per game type.
if [ "${TYPE}" = "crmp" ]; then
  BIN="crmp-server"
else
  BIN="samp03svr"
fi

if [ -x "${DATA}/${BIN}" ]; then
  echo "[alexion] Found real ${BIN} in data volume — launching."
  cd "${DATA}"
  exec "./${BIN}"
elif [ -x "${SRC}/${BIN}" ]; then
  echo "[alexion] Found real ${BIN} in image — launching."
  cd "${SRC}"
  exec "./${BIN}"
else
  echo "[alexion] No ${BIN} binary found — starting the Alexion dev simulator."
  echo "[alexion] Drop the real ${BIN} into templates/${TYPE}/server-files/ for a real server."
  exec node /alexion/sim/server.js
fi
