"use strict";
// src/commands/runSkill.ts
// Core command: pick a skill, fill variables, deliver the assembled prompt
// Used by both "Run Skill" and "Run Skill on Selection"
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSkillCommand = runSkillCommand;
const vscode = __importStar(require("vscode"));
const api_1 = require("../api");
const CATEGORY_ICONS = {
    general: '✦', marketing: '📣', writing: '✍',
    coding: '💻', seo: '🔍', research: '🔬',
    creative: '🎨', business: '💼', social: '📱',
    education: '📚', image: '🖼', video: '🎬',
};
// Detect language from VS Code's language ID
function detectLanguage() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return undefined;
    const lang = editor.document.languageId;
    const map = {
        typescript: 'TypeScript', javascript: 'JavaScript',
        python: 'Python', java: 'Java', csharp: 'C#',
        cpp: 'C++', c: 'C', go: 'Go', rust: 'Rust',
        ruby: 'Ruby', php: 'PHP', swift: 'Swift',
        kotlin: 'Kotlin', html: 'HTML', css: 'CSS',
        sql: 'SQL', bash: 'Bash', powershell: 'PowerShell',
    };
    return map[lang] || lang;
}
// Get selected text from the active editor
function getSelection() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return undefined;
    const selection = editor.selection;
    if (selection.isEmpty)
        return undefined;
    return editor.document.getText(selection);
}
// Fill a single variable via input box
async function fillVariable(v, autoValues) {
    // Use auto-detected value if available
    if (autoValues[v.name] !== undefined) {
        return autoValues[v.name];
    }
    const label = v.label || v.name;
    const value = await vscode.window.showInputBox({
        title: `CPG: Fill variable — ${label}`,
        prompt: v.required ? `${label} (required)` : `${label} (optional — press Enter to skip)`,
        placeHolder: v.placeholder || `Enter ${label}...`,
        ignoreFocusOut: true,
        validateInput: val => {
            if (v.required && !val?.trim())
                return `${label} is required`;
            return null;
        },
    });
    return value;
}
// Deliver the assembled prompt based on user's insert mode setting
async function deliverPrompt(prompt, skillTitle) {
    const mode = vscode.workspace.getConfiguration('cpg').get('insertMode') || 'clipboard';
    if (mode === 'clipboard') {
        await vscode.env.clipboard.writeText(prompt);
        vscode.window.showInformationMessage(`CPG: "${skillTitle}" copied to clipboard ✓`, 'Open Panel').then(action => {
            if (action === 'Open Panel')
                showPromptPanel(prompt, skillTitle);
        });
    }
    else if (mode === 'insert') {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.edit(edit => {
                edit.replace(editor.selection, prompt);
            });
        }
        else {
            // No editor open — fall back to clipboard
            await vscode.env.clipboard.writeText(prompt);
            vscode.window.showInformationMessage(`CPG: "${skillTitle}" copied to clipboard ✓`);
        }
    }
    else if (mode === 'panel') {
        showPromptPanel(prompt, skillTitle);
    }
}
// Show assembled prompt in a read-only panel
function showPromptPanel(prompt, title) {
    const panel = vscode.window.createWebviewPanel('cpgPrompt', `CPG: ${title}`, vscode.ViewColumn.Beside, { enableScripts: false });
    const wordCount = prompt.split(/\s+/).filter(Boolean).length;
    const lineCount = prompt.split('\n').length;
    panel.webview.html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body {
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
    color: var(--vscode-foreground);
    background: var(--vscode-editor-background);
    padding: 16px 20px;
    margin: 0;
    line-height: 1.6;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }
  .title { font-weight: 600; font-size: 14px; }
  .meta { font-size: 11px; opacity: 0.6; margin-left: auto; }
  pre {
    font-family: var(--vscode-editor-font-family, monospace);
    font-size: var(--vscode-editor-font-size, 13px);
    background: var(--vscode-textBlockQuote-background);
    border: 1px solid var(--vscode-panel-border);
    border-radius: 4px;
    padding: 14px 16px;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
  }
  .hint {
    margin-top: 12px;
    font-size: 11px;
    opacity: 0.5;
  }
</style>
</head>
<body>
<div class="header">
  <span class="title">⚡ ${title}</span>
  <span class="meta">${wordCount} words · ${lineCount} lines</span>
</div>
<pre>${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<div class="hint">Tip: Change "insertMode" in CPG settings to auto-copy or insert at cursor.</div>
</body>
</html>`;
}
// ── Main run command ──────────────────────────────────────────
async function runSkillCommand(apiKey, cache, preselectedSkill) {
    // Get or pick a skill
    let skill = preselectedSkill;
    if (!skill) {
        // Show quick pick of all skills
        const skills = await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'CPG: Loading skills...',
        }, () => cache.get(apiKey));
        if (!skills.length) {
            vscode.window.showWarningMessage('CPG: No skills found. Create one at copypastegenius.com/skills');
            return;
        }
        const items = skills.map(s => ({
            label: `${CATEGORY_ICONS[s.category] || '✦'}  ${s.title}`,
            description: s.variables?.length
                ? `${s.variables.length} variable${s.variables.length !== 1 ? 's' : ''}`
                : 'no variables',
            detail: s.description || undefined,
            skill: s,
        }));
        const picked = await vscode.window.showQuickPick(items, {
            title: 'CPG: Run Skill',
            placeHolder: 'Search skills...',
            matchOnDescription: true,
            matchOnDetail: true,
        });
        if (!picked)
            return;
        skill = picked.skill;
    }
    // Build auto-values from context
    const autoValues = {};
    const selection = getSelection();
    const language = detectLanguage();
    const config = vscode.workspace.getConfiguration('cpg');
    if (config.get('autoDetectLanguage') && language) {
        // Auto-fill any variable named 'language', 'lang', or 'programming_language'
        const langVars = ['language', 'lang', 'programming_language'];
        langVars.forEach(name => {
            if (skill.variables?.find(v => v.name === name)) {
                autoValues[name] = language;
            }
        });
    }
    if (selection) {
        // Auto-fill any variable named 'code', 'text', 'content', 'selection', 'input'
        const selectionVars = ['code', 'text', 'content', 'selection', 'input', 'function', 'snippet'];
        selectionVars.forEach(name => {
            if (skill.variables?.find(v => v.name === name)) {
                autoValues[name] = selection;
            }
        });
    }
    // Fill each variable
    const variables = {};
    const vars = skill.variables || [];
    for (const v of vars) {
        const value = await fillVariable(v, autoValues);
        // User pressed Escape
        if (value === undefined && v.required)
            return;
        variables[v.name] = value || '';
    }
    // Run the skill via API
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `CPG: Assembling "${skill.title}"...`,
    }, async () => {
        const slug = skill.slug;
        if (!slug) {
            // No slug — assemble locally
            let assembled = skill.prompt;
            for (const [key, val] of Object.entries(variables)) {
                assembled = assembled.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val);
            }
            await deliverPrompt(assembled, skill.title);
            return;
        }
        const result = await (0, api_1.runSkill)(apiKey, slug, variables);
        if (!result.ready && result.unfilled_variables?.length) {
            vscode.window.showWarningMessage(`CPG: Missing variables: ${result.unfilled_variables.join(', ')}`);
            return;
        }
        await deliverPrompt(result.assembled_prompt, skill.title);
    });
}
//# sourceMappingURL=runSkill.js.map