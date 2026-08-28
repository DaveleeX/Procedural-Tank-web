# Cross-agent deployment contract

## Capability boundary

Support Codex, Claude Code, OpenCode, and other agents that can execute shell commands, write files, and access the network. A chat-only agent without a filesystem or command execution cannot download a project, install ForgeCAD, render, or export; do not claim one-click support in that environment.

## Single-entry bootstrap

Use one of the bundled scripts:

```powershell
./scripts/bootstrap.ps1 -Repo https://github.com/OWNER/REPO.git -Target ./procedural-cad
```

```bash
./scripts/bootstrap.sh --repo https://github.com/OWNER/REPO.git --target ./procedural-cad
```

The scripts must:

1. Clone or fast-forward the complete project instead of relying on another Agent's workspace.
2. Install the npm `forgecad` package locally under `<project>/.tools`, never require a global/admin install.
3. Install ForgeCAD's public skill library for a selected Agent when `--agent`/`-Agent` is supplied.
4. Validate `main.forge.js` before handing control to the reconstruction loop.
5. Write `.bootstrap/forgecad-path.txt` so any Agent can find the exact CLI executable.

## Distribution layout

Publish a public or access-controlled GitHub repository containing:

```text
bootstrap.ps1
bootstrap.sh
skills/forgecad-procedural-image-to-model/
project-template/
.github/workflows/
```

Keep the bootstrap scripts at repository root so a user or Agent only needs one URL. Pin releases/tags for reproducibility. For a private repository, authentication must already be available through the Agent host; never request a token in chat.

## ForgeCAD source alternatives

- **GitHub project:** preferred for cross-Agent source, versioning, checkpoints, Actions, and releases.
- **ForgeCAD hosted project:** use `forgecad project clone <slug>` after CLI installation; hosted authentication may be required.
- **Archive URL:** acceptable fallback only when Git is unavailable; verify archive integrity and retain a version identifier.

GitHub solves distribution, not autonomous persistence. Long reconstruction still needs an Agent/runtime that can keep executing or resume from committed checkpoints.
