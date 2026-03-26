"use strict";
// src/extension.ts
// VS Code extension entry point — registers all commands and the sidebar
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const auth_1 = require("./auth");
const skillsCache_1 = require("./skillsCache");
const treeView_1 = require("./treeView");
const runSkill_1 = require("./commands/runSkill");
function activate(context) {
    const auth = new auth_1.AuthManager(context);
    const cache = new skillsCache_1.SkillsCache();
    // ── Sidebar tree view ─────────────────────────────────────
    const treeProvider = new treeView_1.SkillsTreeProvider(cache, () => auth.getApiKey());
    const treeView = vscode.window.createTreeView('cpgSkillsView', {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
    });
    // Update tree view title with username when logged in
    auth.getApiKey().then(key => {
        if (key) {
            const user = auth.getCachedUser();
            if (user)
                treeView.message = `@${user.username} · ${user.plan}`;
        }
    });
    // ── Commands ──────────────────────────────────────────────
    // cpg.login
    context.subscriptions.push(vscode.commands.registerCommand('cpg.login', async () => {
        const success = await auth.login();
        if (success) {
            const user = auth.getCachedUser();
            if (user)
                treeView.message = `@${user.username} · ${user.plan}`;
            treeProvider.refresh();
        }
    }));
    // cpg.logout
    context.subscriptions.push(vscode.commands.registerCommand('cpg.logout', async () => {
        await auth.logout();
        treeView.message = undefined;
        treeProvider.refresh();
    }));
    // cpg.refreshSkills
    context.subscriptions.push(vscode.commands.registerCommand('cpg.refreshSkills', () => {
        treeProvider.refresh();
    }));
    // cpg.runSkill — pick from quick-pick list
    context.subscriptions.push(vscode.commands.registerCommand('cpg.runSkill', async () => {
        const key = await auth.requireAuth();
        if (!key)
            return;
        try {
            await (0, runSkill_1.runSkillCommand)(key, cache);
        }
        catch (err) {
            if (err.status === 401) {
                vscode.window.showErrorMessage('CPG: Session expired. Please login again.', 'Login')
                    .then(a => { if (a === 'Login')
                    vscode.commands.executeCommand('cpg.login'); });
            }
            else {
                vscode.window.showErrorMessage(`CPG: ${err.message}`);
            }
        }
    }));
    // cpg.runSkillOnSelection — same but auto-fills selection variable
    context.subscriptions.push(vscode.commands.registerCommand('cpg.runSkillOnSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.selection.isEmpty) {
            vscode.window.showWarningMessage('CPG: Select some text first, then run this command.');
            return;
        }
        const key = await auth.requireAuth();
        if (!key)
            return;
        try {
            await (0, runSkill_1.runSkillCommand)(key, cache);
        }
        catch (err) {
            vscode.window.showErrorMessage(`CPG: ${err.message}`);
        }
    }));
    // cpg.runSkillById — called from tree view item click
    context.subscriptions.push(vscode.commands.registerCommand('cpg.runSkillById', async (skill) => {
        const key = await auth.requireAuth();
        if (!key)
            return;
        try {
            await (0, runSkill_1.runSkillCommand)(key, cache, skill);
        }
        catch (err) {
            vscode.window.showErrorMessage(`CPG: ${err.message}`);
        }
    }));
    // ── Status bar item ───────────────────────────────────────
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.command = 'cpg.runSkill';
    statusBar.tooltip = 'CopyPasteGenius — Run a skill';
    auth.getApiKey().then(key => {
        if (key) {
            const user = auth.getCachedUser();
            statusBar.text = `$(zap) CPG${user ? `: @${user.username}` : ''}`;
            statusBar.show();
        }
        else {
            statusBar.text = '$(zap) CPG: Login';
            statusBar.show();
        }
    });
    context.subscriptions.push(statusBar, treeView);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map