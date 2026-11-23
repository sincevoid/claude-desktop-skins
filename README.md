# Claude Desktop Skins

<p>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-555?style=flat-square"></a>
  <img alt="Claude Code 2.1.287+" src="https://img.shields.io/badge/Claude%20Code-2.1.287%2B-555?style=flat-square">
  <img alt="Built for the Claude desktop app" src="https://img.shields.io/badge/built%20for-Claude%20desktop-555?style=flat-square">
</p>

A skin for the Code tab of the Claude desktop app. It redraws Claude's replies and tool calls: code, diffs, tables, math and Mermaid charts become cards, a live band above the prompt shows what Claude is doing right now, and you can pick or repaint the colours with `/skin`.

This is a fork of [hellosverre/claude-skins](https://github.com/hellosverre/claude-skins), rebuilt around the desktop app. The terminal still works for now, but new work targets the desktop, and terminal support may be trimmed later.

## What's different from the original

- A band above the prompt follows the turn as it runs: elapsed time, the action running now (reading a file, running a command, calling a tool), a coloured dot per tool call, and counts of files edited and commands run. When the turn ends, it shows how long it took, and turns longer than a minute send a desktop notification.
- Table cells keep bold and italic, and `<br>` breaks a line inside a cell. Long cells wrap inside their column.
- Code cards have a header with the language icon and name, and a copy button lined up with it.
- Task lists show a progress bar and draw inline formatting. Alerts have more space around them.
- Cards use Inter, Geist and CaskaydiaCove Nerd Font when they are installed, and system fonts otherwise.
- Strikethrough is drawn as faded text, which is easier to read than a line through the words.
- The interface is in Brazilian Portuguese for now. More languages are planned.

## Install

Needs Claude Code **2.1.287** or later. Run both inside Claude Code:

```
/plugin marketplace add sincevoid/claude-desktop-skins
```

```
/plugin install skins@sincevoid
```

Then run `/reload-plugins`, or restart the app. Type `/skin` to pick a theme.

### Recommended fonts

The cards look best with these installed. Without them, they fall back to your system fonts.

- [Inter](https://rsms.me/inter/) for text
- [Geist](https://vercel.com/font) for headers
- [CaskaydiaCove Nerd Font](https://www.nerdfonts.com/font-downloads) for code and the language icons

## Update and uninstall

```bash
claude plugin marketplace update sincevoid
claude plugin update skins@sincevoid
```

```bash
claude plugin uninstall skins@sincevoid
```

To keep it installed but go back to Claude Code's own drawing, run `/skin off`.

## Use

| Command | What it does |
|---|---|
| `/skin` | Settings: pick a skin with a live preview, toggle parts, repaint any colour |
| `/skin <name>` | Switch skin |
| `/skin list` | Every skin and setting |
| `/skin help` | Every command |
| `/skin gallery` | Every element the skin draws, numbered |
| `/skin off` · `on` | Turn the skin off or back on |
| `/skin <part> on` · `off` | Switch one part, such as `band`, `tables`, `charts`, `math` or `copy` |

Built-in skins: `noir`, `tokyo-night`, `dracula`, `catppuccin`, `rose-pine`, `nord`, `gruvbox`, `kanagawa`, `everforest`, `one-dark`, `solarized`, `night-owl`, `ayu`, `github`, `mono`, `terminal`.

You can also ask Claude to design a skin ("make me a skin that feels like a sunset"): the plugin gives Claude a `design` tool that builds and applies it while you watch.

## Develop

Clone the repo, then point Claude Code at your copy:

```bash
git clone https://github.com/sincevoid/claude-desktop-skins
claude plugin marketplace add ./claude-desktop-skins
claude plugin install skins@sincevoid
```

To have Claude read your working copy directly, replace the installed copy under `~/.claude/plugins/cache/sincevoid/skins/<version>` with a link to the repo (a junction on Windows, a symlink elsewhere). After an edit, `/reload-plugins` picks it up.

Tests: `claude plugin test .`. Validation: `claude plugin validate .`.

## Privacy

The skin draws and remembers, nothing else. It reads the session directory, your context and plan usage, and the theme setting, and keeps its settings in the mod store. Its one network call is a daily version check: a GET of this repo's [`plugin.json`](.claude-plugin/plugin.json) on `raw.githubusercontent.com`, sending nothing.

## Credits

Built on [claude-skins](https://github.com/hellosverre/claude-skins) by hellosverre. Terminal diagrams use [beautiful-mermaid](https://github.com/lukilabs/beautiful-mermaid) (MIT), bundled in `hooks/vendor/mermaid-ascii.js`.

## License

MIT. See [LICENSE](LICENSE), which keeps the original author's copyright.
