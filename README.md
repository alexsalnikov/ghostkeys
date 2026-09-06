# GhostKeys 👻

GhostKeys is a quiet, offline keyboard-practice app for learning Vim and tmux. It provides separate learning paths for Vim editing commands and tmux terminal workflows, with guided exercises, demonstrations, and progress tracking. Built with Electron, React, TypeScript, and CodeMirror’s Vim engine.

## Open the app

From the project directory, the packaged application lives at:

```bash
./release/linux-unpacked/ghostkeys
```

Keep the entire `linux-unpacked` folder together. The executable needs its adjacent runtime files. Use `npm start` for a source checkout.

To build and launch from source, run these commands from the project directory:

```bash
npm ci
npm start
```

## Learn a little every day

Use **Vim path** or **tmux path** near the top of the sidebar. Each path keeps its own progress; the app remembers which path you last opened.

### Vim path

- **Chapter 01 — Vim essentials:** Eight essentials topics cover modes, whole-file copying with `ggVGy`, and separate keyboard simulations of `:w`, `:q`, `:wq`, and `:q!`. The simulations distinguish unsaved changes, saving, closing, and discarding; they never write real files or close GhostKeys. New learners start here; existing learners can open it from the learning path without losing progress.
- **105 Vim lessons, 420 exercise variations:** modes, undo/redo, home-row and word/WORD movement, counts, paragraph and line/file navigation, visual selection, text objects, rectangular selections, operators, editing, forward/backward search, and bracket jumps.
- **Motions with a purpose:** compare `w/W`, `e/E`, `ge/gE`, and `F/T`; follow a lantern trail with `;` and `,`; finish with a mixed “midnight delivery” challenge. Each drill uses original ghost-themed scenes and a practical explanation.
- **Editing spells:** compose `d2w`, `dt;`, and `ct;`; use `D`, `cc`, and `C`; compare inner and around text objects; repeat changes with `n` and `.`; repair typos; copy with registers; adjust case and indentation. Twenty-five original lessons join the Editing chapter. “Change the mood” also teaches quotes that seek forward on the current line.
- **Selection spells:** fourteen new lessons build on the five selection basics. Extend `v` and `V` with counts, motions, and text objects; cancel safely; delete, change, uppercase, or yank a selection. Use Visual Block with `I`, `$A`, and `c` to comment calls, seal line endings, complete chores, and turn a ghost-parade checklist into an HTML ordered list.
- **Copying keepsakes:** twenty new drills include whole-file yanking in First steps and nineteen copying/pasting tasks under Editing. Compare characterwise and linewise `p/P`, paste counts, cursor-aware `gp/gP`, moving code, copying a template, named and appended registers, yank register `0`, numbered delete history, small-delete `-`, black-hole `_`, `:reg a`, and Insert-mode `Ctrl+r` register insertion.
- **The right kind of buffer:** JavaScript examples, HTML tag exercises with working `cit`, and plain-text paragraphs use matching language support and file labels.
- **Four stages per lesson:** three guided attempts, then a variation from memory.
- **Live keycaps:** follow sequences and modifier combinations while working in the editor.
- **Demonstrations:** watch the editor perform the exercise, then try it yourself. Demonstrations never count as practice.
- **Daily review:** five skills, prioritizing practiced commands that needed hints, repeated attempts, or a later review.
- **Free practice:** a scratchpad saved automatically on the current device.
- **Progress:** learned skills, successful exercises, practice days, and recent activity.

Click the editor before typing. `Esc` returns to Normal mode. `u` undoes changes. Use the reset button to restore the current exercise. The lesson menu lets you jump directly to any topic.

After a successful exercise, press **Enter** to continue to the next repetition, lesson, or daily review. Focus returns to the editor automatically. Enter keeps its usual Vim behavior during practice; confirming a search or holding Enter will not skip the success screen.

The training layout adapts to the window height, keeping the task, editor, key guidance, and next/previous controls together on one screen at supported desktop sizes (880×650 and larger). Long code buffers and the lesson list can scroll independently; Vim motions and Tab keep them usable from the keyboard. Smaller browser windows retain a scrolling fallback.

Guided exercises check both the taught key sequence and the actual resulting cursor, selection, text, or register contents. Whole-file copy checks the full linewise yank and unchanged document; `gp/gP` exercises also check the final cursor. Recall accepts other correct Vim solutions. A skill becomes learned after a successful final recall without revealing its hint.

### tmux path

Start with **Why tmux?** for the session → window → pane model and the reason to use it: keep terminal programs organized and return to them after detaching or reconnecting over SSH to the same machine. tmux does not replace SSH or preserve running programs through a reboot.

The path has **24 lessons and 96 exercise variations**, with three guided repetitions and a final recall, live key guidance, demonstrations, keyboard continuation, and separate progress:

- **Sessions:** create with `tmux new -s NAME`, detach with `Ctrl+b` then `d`, list with `tmux ls`, attach with `tmux attach -t NAME`, practice the entire round trip, create-or-attach with `-A`, rename, switch through the chooser, and deliberately end a named session.
- **Windows:** create, move next/previous, select by number, rename, and close with confirmation.
- **Panes:** split left/right or top/bottom, focus with arrows, cycle, zoom and restore, and close one pane while preserving another.
- **Help & history:** inspect common shortcuts, enter and leave history mode, and use tmux’s own command prompt.

Shortcuts use **default tmux bindings and zero-based window numbering**. `Ctrl+b → d` means press Ctrl and b together, release both, then press d alone. Copy-mode selection bindings vary between emacs and vi settings; this introduction uses their shared arrow and q keys for history navigation.

The interactive terminal is a local simulation with modeled sessions, windows, pane layouts, attachment, prompts, and program lifetimes. It supports the commands taught by the course, not a full shell or full tmux installation. No input is executed, no real sessions are accessed, and no terminal configuration is changed. Exercise outcomes validate the resulting state and relevant transitions. The content follows the official [tmux getting-started guide](https://github.com/tmux/tmux/wiki/Getting-Started) and [tmux manual](https://man.openbsd.org/tmux.1).

## Data and privacy

Everything runs locally. There is no account, server, telemetry, or AI API dependency. Lessons, artwork, and code are bundled with the application.

Vim progress uses `ghostkeys.progress.v1`; tmux progress uses `ghostkeys.tmux.v1`; the selected path uses `ghostkeys.path.v1`. Desktop progress is stored in Chromium local storage under Electron’s `GhostKeys` application-data directory (normally `~/.config/GhostKeys` on Linux). Development-browser progress is separate. Progress and scratchpad survive app restarts; removing that application-data directory removes them.

## Development

```bash
npm run dev       # Vite on http://127.0.0.1:5173
npm run build     # Type-check and build the interface
npm run desktop   # Launch the most recent built interface
npm test          # Automated keyboard tests in hidden Electron windows
npm run package   # Build release/linux-unpacked
node tests/packaged-smoke.mjs # Check the packaged app's offline launch
```

Tmux tests exercise all 96 variations, model transitions, detach versus closing, prefix handling, invalid commands, progress separation, demonstrations, and layout. Tests use the installed Electron runtime, not a separately downloaded browser. On Linux they require a graphical session, or a virtual display such as Xvfb. Each test has an isolated temporary profile and leaves normal desktop progress untouched.

Verification uses real Electron key input for every variation, plus motion contrasts, daily review, hints, demonstrations, scratchpad persistence, and progress reload. Layout checks cover all lessons at four desktop sizes down to 880×650. Packaged builds are checked for offline loading and renderer isolation.

## Project map

- `src/lessons.ts`: lesson descriptions, four variations, expected commands, and outcome validators’ targets.
- `src/motionLessons.ts`: original motion contrasts, counts, backward searches, and a mixed challenge, integrated into Movement and Search & jumps.
- `src/operatorLessons.ts`: composed edits, repeatable changes, text objects, registers, indentation, and small repairs.
- `src/copyLessons.ts`: whole-file copy essentials, put behavior, code templates, cut/move, and register practice.
- `src/visualLessons.ts`: selecting with motions, applying operators to selections, block insertion/change, and an HTML list challenge.
- `src/Editor.tsx`: CodeMirror integration, Vim mode reporting, demonstrations, and state validation.
- `src/App.tsx`: path selection and Vim lesson flow, hints, daily practice, progress, and navigation.
- `src/LearningPaths.tsx`: shared Vim/tmux path switcher.
- `src/TmuxApp.tsx`: tmux overview, simulated terminal UI, repetitions, demonstrations, and separate saved progress.
- `src/tmuxModel.ts`: pure local state transitions for supported tmux commands and default shortcuts.
- `src/tmuxLessons.ts`: tmux curriculum and state-based exercise goals.
- `src/tmux.css`: tmux screens and compact shared path selector.
- `src/Introduction.tsx`: modes chapter and simulated quit prompt.
- `src/progress.ts`: validated local progress loading and review scheduling.
- `src/styles.css`: offline ghost-themed interface and responsive layout.
- `electron/main.cjs`: sandboxed desktop window and app lifecycle.
- `tests/`: actual Electron keyboard interactions and persistence checks.

## Scope

The editor uses Vim emulation. The commands included in the lessons are tested; this is not a full Neovim installation. Advanced macros, marks, substitution lessons, cloud sync, and automatic updates are outside this first release. The daily session is five exercises rather than a hard time limit.

The motion expansion adapts teaching ideas from the user-provided “Moving Blazingly Fast with Vim Motions” tutorial into original scenes and explanations. Command semantics were checked against the [Vim motion reference](https://vimhelp.org/motion.txt.html) and [search reference](https://vimhelp.org/pattern.txt.html), then tested in the actual editor. The missing `g_` motion is registered through the Vim engine’s motion API, including counts and operator/Visual support. Definition/file jumps (`gd`, `gf`), regex lessons, and viewport-dependent half-page drills remain future curriculum work.

The operator expansion similarly adapts the user-provided “Editing Like Magic With Vim Operators” tutorial into original ghost-themed tasks. Explanations follow the [Vim change reference](https://vimhelp.org/change.txt.html): `cw` changes through the end of a word when starting on a nonblank character; `s` changes the character under the cursor; deleted/yanked text goes into Vim registers; and `=` reindents according to the editor’s rules. `p` and `.` are commands, not operators awaiting a motion. The `d/search` lesson uses a same-line match because the bundled engine leaves a blank line in the cross-line, column-one case. Tests check precise resulting documents and these important operator boundaries.

The selection expansion adapts the user-provided “Selecting Text” tutorial into original ghost scenes and code, following the [Vim Visual mode reference](https://vimhelp.org/visual.txt.html). Examples compare operator-first Normal commands with selection-first Visual commands. Multi-line `I` and `A` are taught in Visual Block; the VSCodeVim-specific linewise extension is excluded. `$A` appends at each selected line’s own ending. HTML automatic closing tags are disabled so typed practice sequences and demonstrations produce the same explicit edits. Tests cover cancellation without changes, block edits, boundaries, demonstrations, and all four variations.

The copying expansion adapts the user-provided “Copying and Pasting” material into original ghost-themed tasks. The [Vim register and put reference](https://vimhelp.org/change.txt.html) distinguishes characterwise/linewise puts, the unnamed register, named registers, yank register 0, and delete registers. Small within-line deletions normally go to `-`; the 1–9 history is not a record of every tiny cut. Explicit named yanks do not replace register 0. Internal Vim registers are taught separately from the system clipboard; the clipboard variant is explained in essentials without making desktop clipboard access part of a scored drill.

The bundled engine lacks `gp/gP`. The trainer registers them as Normal-mode actions using its existing paste implementation, with cursor placement, named registers, counts, block columns, undo, and dot-repeat checks. Demonstrations now dispatch pending Insert-mode key sequences before inserting literal characters, so `Ctrl+r` followed by a register works when watching as well as when typing. Essentials simulations follow the [Vim write/quit reference](https://vimhelp.org/editing.txt.html#write-quit) and show the saved contents separately from the simulated edited buffer.

Lesson prose uses JavaScript, HTML, and plain-text examples with English keyboard labels. Punctuation keys follow your active keyboard layout; an operating-system shortcut can still intercept a key before it reaches any application.
