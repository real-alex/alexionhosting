# SA-MP server files

Everything in this folder is copied into a server's data volume on first boot.

## To run a **real** SA-MP server (not the simulator)

1. Download the Linux SA-MP server package (`samp03svrXXX.tar.gz`) from the
   official SA-MP site. You must provide this yourself — it is **not** committed
   to this repository.
2. Drop the extracted files here so this folder contains:
   - `samp03svr` (the Linux server binary, marked executable)
   - `announce`
   - `gamemodes/` (your `.amx` gamemodes)
   - `filterscripts/`
   - `plugins/` (`.so` plugins)
   - `scriptfiles/`
   - `samp-server.cfg`
3. In `templates/samp/Dockerfile`, uncomment the i386 runtime-library block so
   the 32-bit binary can run.
4. Rebuild the image (the agent does this automatically the next time it
   provisions a SA-MP server, or run `docker build -t alexion/samp-server templates/samp`).

If `samp03svr` is **not** present, the container runs the Alexion dev simulator
instead, so you can build and test the whole platform first.

> Binaries (`samp03svr`, `*.so`, `*.amx`) are git-ignored on purpose.
