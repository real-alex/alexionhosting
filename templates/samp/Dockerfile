# Alexion SA-MP server image.
#
# Base is Debian (via the Node image) so we can both (a) run the lightweight
# dev simulator out of the box, and (b) run the real 32-bit samp03svr binary
# once the operator provides it.
FROM node:20-bookworm-slim

# --- Real SA-MP support (optional) -------------------------------------------
# SA-MP's samp03svr is a 32-bit i386 ELF binary. To run it for real, uncomment
# the block below to install the 32-bit runtime libraries, then drop the
# samp03svr binary + gamemodes into templates/samp/server-files/.
#
# RUN dpkg --add-architecture i386 \
#   && apt-get update \
#   && apt-get install -y --no-install-recommends lib32stdc++6 lib32z1 ca-certificates \
#   && rm -rf /var/lib/apt/lists/*

WORKDIR /alexion

# Default server files (configs, gamemodes) and the dev simulator.
COPY entrypoint.sh /alexion/entrypoint.sh
COPY sim /alexion/sim
COPY server-files /alexion/server-files
RUN chmod +x /alexion/entrypoint.sh

# Per-server persistent data (configs, logs, scriptfiles) lives on a volume.
VOLUME ["/alexion/data"]

# UDP is the game/query transport for SA-MP. Actual published port is set at
# container creation time by the agent (defaults to 7777).
EXPOSE 7777/udp

ENTRYPOINT ["/alexion/entrypoint.sh"]
