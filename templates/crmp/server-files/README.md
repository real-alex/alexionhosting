# CRMP server files

Everything in this folder is copied into a server's data volume on first boot.

## To run a **real** CRMP server (not the simulator)

1. Obtain the Linux CRMP server package. You must provide this yourself — it is
   **not** committed to this repository.
2. Drop the extracted files here so this folder contains at least:
   - `crmp-server` (the Linux server binary, marked executable)
   - your gamemodes / config files
   - `plugins/` (`.so` plugins)
3. In `templates/crmp/Dockerfile`, uncomment the i386 runtime-library block so
   the 32-bit binary can run.
4. Rebuild the image (the agent rebuilds automatically when it next provisions a
   CRMP server, or run `docker build -t alexion/crmp-server templates/crmp`).

If `crmp-server` is **not** present, the container runs the Alexion dev
simulator instead, so you can build and test the whole platform first.

> Binaries (`crmp-server`, `*.so`, `*.amx`) are git-ignored on purpose.
