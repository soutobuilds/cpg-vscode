"use strict";
// src/auth.ts
// Manages API key storage using VS Code's SecretStorage (encrypted, per-machine)
// Falls back to globalState for username/plan caching
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
exports.AuthManager = void 0;
const vscode = __importStar(require("vscode"));
const api_1 = require("./api");
const KEY_SECRET = 'cpg.apiKey';
const KEY_USER = 'cpg.user';
class AuthManager {
    constructor(context) {
        this.context = context;
    }
    async getApiKey() {
        return this.context.secrets.get(KEY_SECRET);
    }
    async setApiKey(key) {
        await this.context.secrets.store(KEY_SECRET, key);
    }
    async clearApiKey() {
        await this.context.secrets.delete(KEY_SECRET);
        await this.context.globalState.update(KEY_USER, undefined);
    }
    async isLoggedIn() {
        const key = await this.getApiKey();
        return !!key;
    }
    getCachedUser() {
        return this.context.globalState.get(KEY_USER);
    }
    async setCachedUser(user) {
        await this.context.globalState.update(KEY_USER, user);
    }
    // Full login flow — prompts for key, verifies, caches user
    async login() {
        const key = await vscode.window.showInputBox({
            title: 'CopyPasteGenius — Login',
            prompt: 'Paste your API key from copypastegenius.com/settings',
            placeHolder: 'cpg_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            password: true,
            validateInput: v => v?.startsWith('cpg_') ? null : 'Key must start with cpg_',
        });
        if (!key)
            return false;
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'CopyPasteGenius: Verifying key...',
        }, async () => {
            try {
                const user = await (0, api_1.verifyApiKey)(key);
                await this.setApiKey(key);
                await this.setCachedUser(user);
                vscode.window.showInformationMessage(`CopyPasteGenius: Logged in as @${user.username} (${user.plan} plan) ✓`);
            }
            catch (err) {
                vscode.window.showErrorMessage(`CopyPasteGenius: Invalid API key — ${err.message}`);
                throw err;
            }
        });
        return true;
    }
    async logout() {
        await this.clearApiKey();
        vscode.window.showInformationMessage('CopyPasteGenius: Logged out.');
    }
    // Require auth — prompt to login if not authenticated
    async requireAuth() {
        const key = await this.getApiKey();
        if (key)
            return key;
        const action = await vscode.window.showWarningMessage('CopyPasteGenius: Not logged in.', 'Login now');
        if (action === 'Login now') {
            const success = await this.login();
            if (success)
                return await this.getApiKey() || null;
        }
        return null;
    }
}
exports.AuthManager = AuthManager;
//# sourceMappingURL=auth.js.map