// src/auth.ts
// Manages API key storage using VS Code's SecretStorage (encrypted, per-machine)
// Falls back to globalState for username/plan caching

import * as vscode from 'vscode';
import { verifyApiKey, UserInfo } from './api';

const KEY_SECRET  = 'cpg.apiKey';
const KEY_USER    = 'cpg.user';

export class AuthManager {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async getApiKey(): Promise<string | undefined> {
    return this.context.secrets.get(KEY_SECRET);
  }

  async setApiKey(key: string): Promise<void> {
    await this.context.secrets.store(KEY_SECRET, key);
  }

  async clearApiKey(): Promise<void> {
    await this.context.secrets.delete(KEY_SECRET);
    await this.context.globalState.update(KEY_USER, undefined);
  }

  async isLoggedIn(): Promise<boolean> {
    const key = await this.getApiKey();
    return !!key;
  }

  getCachedUser(): UserInfo | undefined {
    return this.context.globalState.get<UserInfo>(KEY_USER);
  }

  async setCachedUser(user: UserInfo): Promise<void> {
    await this.context.globalState.update(KEY_USER, user);
  }

  // Full login flow — prompts for key, verifies, caches user
  async login(): Promise<boolean> {
    const key = await vscode.window.showInputBox({
      title:       'CopyPasteGenius — Login',
      prompt:      'Paste your API key from copypastegenius.com/settings',
      placeHolder: 'cpg_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      password:    true,
      validateInput: v => v?.startsWith('cpg_') ? null : 'Key must start with cpg_',
    });

    if (!key) return false;

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'CopyPasteGenius: Verifying key...',
    }, async () => {
      try {
        const user = await verifyApiKey(key);
        await this.setApiKey(key);
        await this.setCachedUser(user);
        vscode.window.showInformationMessage(
          `CopyPasteGenius: Logged in as @${user.username} (${user.plan} plan) ✓`
        );
      } catch (err: any) {
        vscode.window.showErrorMessage(`CopyPasteGenius: Invalid API key — ${err.message}`);
        throw err;
      }
    });

    return true;
  }

  async logout(): Promise<void> {
    await this.clearApiKey();
    vscode.window.showInformationMessage('CopyPasteGenius: Logged out.');
  }

  // Require auth — prompt to login if not authenticated
  async requireAuth(): Promise<string | null> {
    const key = await this.getApiKey();
    if (key) return key;

    const action = await vscode.window.showWarningMessage(
      'CopyPasteGenius: Not logged in.',
      'Login now'
    );
    if (action === 'Login now') {
      const success = await this.login();
      if (success) return await this.getApiKey() || null;
    }
    return null;
  }
}
