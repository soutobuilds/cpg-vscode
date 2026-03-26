"use strict";
// src/treeView.ts
// Sidebar panel showing skills grouped by category
// Click a skill to run it directly from the sidebar
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
exports.SkillsTreeProvider = exports.LoadingItem = exports.NotLoggedInItem = exports.SkillItem = exports.CategoryItem = void 0;
const vscode = __importStar(require("vscode"));
const CATEGORY_ICONS = {
    general: '✦', marketing: '📣', writing: '✍',
    coding: '💻', seo: '🔍', research: '🔬',
    creative: '🎨', business: '💼', social: '📱',
    education: '📚', image: '🖼', video: '🎬',
};
// ── Tree items ────────────────────────────────────────────────
class CategoryItem extends vscode.TreeItem {
    constructor(category, skills) {
        const icon = CATEGORY_ICONS[category] || '✦';
        const label = category.charAt(0).toUpperCase() + category.slice(1);
        super(`${icon}  ${label}`, vscode.TreeItemCollapsibleState.Collapsed);
        this.category = category;
        this.skills = skills;
        this.description = `${skills.length} skill${skills.length !== 1 ? 's' : ''}`;
        this.contextValue = 'category';
    }
}
exports.CategoryItem = CategoryItem;
class SkillItem extends vscode.TreeItem {
    constructor(skill) {
        super(skill.title, vscode.TreeItemCollapsibleState.None);
        this.skill = skill;
        this.description = skill.slug ? `cpg run ${skill.slug}` : undefined;
        this.tooltip = skill.description || skill.title;
        this.contextValue = 'skill';
        this.iconPath = new vscode.ThemeIcon('zap');
        // Clicking the item runs the skill
        this.command = {
            command: 'cpg.runSkillById',
            title: 'Run Skill',
            arguments: [skill],
        };
    }
}
exports.SkillItem = SkillItem;
class NotLoggedInItem extends vscode.TreeItem {
    constructor() {
        super('Click to login', vscode.TreeItemCollapsibleState.None);
        this.description = 'CPG: Login';
        this.iconPath = new vscode.ThemeIcon('account');
        this.command = { command: 'cpg.login', title: 'Login' };
    }
}
exports.NotLoggedInItem = NotLoggedInItem;
class LoadingItem extends vscode.TreeItem {
    constructor() {
        super('Loading skills...', vscode.TreeItemCollapsibleState.None);
        this.iconPath = new vscode.ThemeIcon('loading~spin');
    }
}
exports.LoadingItem = LoadingItem;
// ── Tree data provider ────────────────────────────────────────
class SkillsTreeProvider {
    constructor(cache, getApiKey) {
        this.cache = cache;
        this.getApiKey = getApiKey;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.loading = false;
    }
    refresh() {
        this.cache.invalidate();
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        // ── Top level: categories ─────────────────────────────────
        if (!element) {
            const key = await this.getApiKey();
            if (!key)
                return [new NotLoggedInItem()];
            try {
                this.loading = true;
                const skills = await this.cache.get(key);
                this.loading = false;
                if (!skills.length) {
                    const empty = new vscode.TreeItem('No skills yet');
                    empty.description = 'Create one at copypastegenius.com/skills';
                    empty.iconPath = new vscode.ThemeIcon('info');
                    return [empty];
                }
                const grouped = this.cache.byCategory();
                // Sort categories: coding first, then alphabetical
                const sorted = Object.entries(grouped).sort(([a], [b]) => {
                    if (a === 'coding')
                        return -1;
                    if (b === 'coding')
                        return 1;
                    return a.localeCompare(b);
                });
                return sorted.map(([cat, skills]) => new CategoryItem(cat, skills));
            }
            catch (err) {
                this.loading = false;
                const errItem = new vscode.TreeItem('Error loading skills');
                errItem.description = err.message;
                errItem.iconPath = new vscode.ThemeIcon('error');
                return [errItem];
            }
        }
        // ── Second level: skills within a category ────────────────
        if (element instanceof CategoryItem) {
            return element.skills.map(s => new SkillItem(s));
        }
        return [];
    }
}
exports.SkillsTreeProvider = SkillsTreeProvider;
//# sourceMappingURL=treeView.js.map