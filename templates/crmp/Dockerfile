# Alexion CRMP server image.
#
# CRMP (Criminal Russia Multiplayer) is a SA-MP-derived server, so the layout
# mirrors the SA-MP template. Base is Debian (via the Node image) so we can run
# the dev simulator out of the box and the real 32-bit binary once provided.
FROM node:20-bookworm-slim

# --- Real CRMP support (optional) --------------------------------------------
# The CRMP server is a 32-bit i386 ELF binary. To run it for real, uncomment the
# block below to install the 32-bit runtime libraries, then drop the
# crmp-server binary + gamemodes into templates/crmp/server-files/.
#
# RUN dpkg --add-architecture i386 \
#   && apt-get update \
#   && apt-get install -y --no-install-recommends lib32stdc++6 lib32z1 ca-certificates \
#   && rm -rf /var/lib/apt/lists/*

WORKDIR /alexion

COPY entrypoint.sh /alexion/entrypoint.sh
COPY sim /alexion/sim
COPY server-files /alexion/server-files
RUN chmod +x /alexion/entrypoint.sh

VOLUME ["/alexion/data"]
EXPOSE 7777/udp

ENTRYPOINT ["/alexion/entrypoint.sh"]
