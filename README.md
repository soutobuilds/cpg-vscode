# CopyPasteGenius for VS Code

Run your AI skills directly from the editor. Highlight code, pick a skill, get your prompt assembled and copied — without leaving VS Code.

## Setup

1. Install the extension
2. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Run **CPG: Login**
4. Paste your API key from [copypastegenius.com/settings](https://www.copypastegenius.com/settings)

## Commands

| Command | Description |
|---------|-------------|
| `CPG: Login` | Authenticate with your API key |
| `CPG: Logout` | Remove saved credentials |
| `CPG: Run Skill` | Pick a skill from your library and run it |
| `CPG: Run Skill on Selection` | Run a skill — selected text auto-fills `{{code}}`, `{{text}}`, etc. |
| `CPG: Refresh Skills` | Force refresh the skills sidebar |

## Right-click menu

Right-click anywhere in the editor to see **CPG: Run Skill**. If you have text selected, **CPG: Run Skill on Selection** appears at the top.

## Sidebar

The **CopyPasteGenius** panel in the Explorer sidebar shows all your skills grouped by category. Click any skill to run it immediately.

## Smart auto-fill

When you run a skill, the extension automatically fills:

- **`{{language}}`** — detected from the file type (Python, TypeScript, etc.)
- **`{{code}}`**, **`{{text}}`**, **`{{content}}`**, **`{{selection}}`** — filled with your selected text

You only need to fill the remaining variables manually.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `cpg.insertMode` | `clipboard` | Where to put the result: `clipboard`, `insert` (at cursor), or `panel` |
| `cpg.autoDetectLanguage` | `true` | Auto-fill `{{language}}` from file type |
| `cpg.apiUrl` | `https://www.copypastegenius.com` | API URL (don't change unless self-hosting) |

## Example workflow

1. Open a Python file
2. Highlight a function you want reviewed
3. Right-click → **CPG: Run Skill on Selection**
4. Pick "Code Review" from the quick-pick
5. `{{language}}` auto-fills as "Python", `{{code}}` auto-fills with your selection
6. Fill any remaining variables
7. Prompt is copied to clipboard — paste into Claude or ChatGPT

## Requirements

- VS Code 1.85+
- A [CopyPasteGenius](https://www.copypastegenius.com) Pro account
- API key from Settings → API Keys
