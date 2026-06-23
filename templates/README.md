# Server templates

Each subfolder is a Docker build context that produces the image used to run a
customer's game server:

| Folder  | Image tag                     | Game type |
| ------- | ----------------------------- | --------- |
| `samp/` | `alexion/samp-server:latest`  | SA-MP     |
| `crmp/` | `alexion/crmp-server:latest`  | CRMP      |

## How it works

- The node agent builds these images on demand the first time it provisions a
  server of that type (see `apps/agent/src/server-manager.ts`).
- Each image bundles a **dev simulator** (`sim/server.js`) that stands in for
  the real game server, so the whole platform runs without proprietary binaries.
- To run real servers, drop the official Linux binaries into the matching
  `server-files/` folder and uncomment the i386 library install in the
  Dockerfile. See each `server-files/README.md` for details.

## Layout of a template

```
samp/
├── Dockerfile          # how the image is built
├── entrypoint.sh       # seeds data volume, runs real binary or simulator
├── sim/server.js       # dev simulator (placeholder game server)
└── server-files/       # default configs + where real binaries go
```

Real binaries (`samp03svr`, `crmp-server`, `*.so`, `*.amx`) are git-ignored.
