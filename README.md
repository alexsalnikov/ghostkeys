# GhostKeys 👻

GhostKeys is an offline desktop app for practicing Vim and tmux keyboard commands through guided, hands-on exercises.

## Features

- Vim practice for modes, motions, editing, search, registers, text objects, and visual selections.
- tmux practice for sessions, windows, panes, shortcuts, and history.
- Guided exercises, demonstrations, daily review, free practice, and local progress.
- No account, telemetry, or network connection required.

## Run from source

The project can be checked out to any folder and run on Linux, macOS, or Windows. Install Node.js and npm, then run:

```bash
git clone https://github.com/alexsalnikov/ghostkeys.git
cd ghostkeys
npm ci
npm start
```

## Development

```bash
npm run dev       # Start the Vite development server
npm run build     # Type-check and build the app
npm test          # Run the Electron keyboard tests
npm run package   # Create an unpacked build for the current OS
```

Packaged output is written under `release/` in an operating-system-specific folder.

## Precompiled releases

Version tags publish precompiled x64 downloads to GitHub Releases:

- Linux: AppImage
- Windows: NSIS `.exe` installer

The release workflow intentionally does not build or publish a macOS package. The tag
should match the version in `package.json`, for example `v1.0.0`.

## Privacy and scope

Everything runs locally. Progress and scratchpad data stay in the operating system's application-data directory.

Vim behavior is provided by CodeMirror's Vim emulation. The tmux terminal is a safe local simulation: it does not execute shell commands or access real tmux sessions.

Built with Electron, React, TypeScript, and CodeMirror.
