// src/extension.ts
// VS Code extension entry point — registers all commands and the sidebar

import * as vscode from 'vscode';
import { AuthManager } from './auth';
import { SkillsCache } from './skillsCache';
import { SkillsTreeProvider } from './treeView';
import { runSkillCommand } from './commands/runSkill';
import { Skill } from './api';

export function activate(context: vscode.ExtensionContext) {
  const auth  = new AuthManager(context);
  const cache = new SkillsCache();

  // ── Sidebar tree view ─────────────────────────────────────
  const treeProvider = new SkillsTreeProvider(
    cache,
    () => auth.getApiKey()
  );

  const treeView = vscode.window.createTreeView('cpgSkillsView', {
    treeDataProvider: treeProvider,
    showCollapseAll:  true,
  });

  // Update tree view title with username when logged in
  auth.getApiKey().then(key => {
    if (key) {
      const user = auth.getCachedUser();
      if (user) treeView.message = `@${user.username} · ${user.plan}`;
    }
  });

  // ── Commands ──────────────────────────────────────────────

  // cpg.login
  context.subscriptions.push(
    vscode.commands.registerCommand('cpg.login', async () => {
      const success = await auth.login();
      if (success) {
        const user = auth.getCachedUser();
        if (user) treeView.message = `@${user.username} · ${user.plan}`;
        treeProvider.refresh();
      }
    })
  );

  // cpg.logout
  context.subscriptions.push(
    vscode.commands.registerCommand('cpg.logout', async () => {
      await auth.logout();
      treeView.message = undefined;
      treeProvider.refresh();
    })
  );

  // cpg.refreshSkills
  context.subscriptions.push(
    vscode.commands.registerCommand('cpg.refreshSkills', () => {
      treeProvider.refresh();
    })
  );

  // cpg.runSkill — pick from quick-pick list
  context.subscriptions.push(
    vscode.commands.registerCommand('cpg.runSkill', async () => {
      const key = await auth.requireAuth();
      if (!key) return;
      try {
        await runSkillCommand(key, cache);
      } catch (err: any) {
        if (err.status === 401) {
          vscode.window.showErrorMessage('CPG: Session expired. Please login again.', 'Login')
            .then(a => { if (a === 'Login') vscode.commands.executeCommand('cpg.login'); });
        } else {
          vscode.window.showErrorMessage(`CPG: ${err.message}`);
        }
      }
    })
  );

  // cpg.runSkillOnSelection — same but auto-fills selection variable
  context.subscriptions.push(
    vscode.commands.registerCommand('cpg.runSkillOnSelection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.selection.isEmpty) {
        vscode.window.showWarningMessage('CPG: Select some text first, then run this command.');
        return;
      }
      const key = await auth.requireAuth();
      if (!key) return;
      try {
        await runSkillCommand(key, cache);
      } catch (err: any) {
        vscode.window.showErrorMessage(`CPG: ${err.message}`);
      }
    })
  );

  // cpg.runSkillById — called from tree view item click
  context.subscriptions.push(
    vscode.commands.registerCommand('cpg.runSkillById', async (skill: Skill) => {
      const key = await auth.requireAuth();
      if (!key) return;
      try {
        await runSkillCommand(key, cache, skill);
      } catch (err: any) {
        vscode.window.showErrorMessage(`CPG: ${err.message}`);
      }
    })
  );

  // ── Status bar item ───────────────────────────────────────
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right, 100
  );
  statusBar.command = 'cpg.runSkill';
  statusBar.tooltip = 'CopyPasteGenius — Run a skill';

  auth.getApiKey().then(key => {
    if (key) {
      const user = auth.getCachedUser();
      statusBar.text = `$(zap) CPG${user ? `: @${user.username}` : ''}`;
      statusBar.show();
    } else {
      statusBar.text = '$(zap) CPG: Login';
      statusBar.show();
    }
  });

  context.subscriptions.push(statusBar, treeView);
}

export function deactivate() {}
