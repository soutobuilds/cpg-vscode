// src/treeView.ts
// Sidebar panel showing skills grouped by category
// Click a skill to run it directly from the sidebar

import * as vscode from 'vscode';
import { Skill } from './api';
import { SkillsCache } from './skillsCache';

const CATEGORY_ICONS: Record<string, string> = {
  general:   '✦', marketing: '📣', writing:  '✍',
  coding:    '💻', seo:       '🔍', research: '🔬',
  creative:  '🎨', business:  '💼', social:   '📱',
  education: '📚', image:     '🖼', video:    '🎬',
};

// ── Tree items ────────────────────────────────────────────────

export class CategoryItem extends vscode.TreeItem {
  constructor(
    public readonly category: string,
    public readonly skills: Skill[]
  ) {
    const icon = CATEGORY_ICONS[category] || '✦';
    const label = category.charAt(0).toUpperCase() + category.slice(1);
    super(`${icon}  ${label}`, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `${skills.length} skill${skills.length !== 1 ? 's' : ''}`;
    this.contextValue = 'category';
  }
}

export class SkillItem extends vscode.TreeItem {
  constructor(public readonly skill: Skill) {
    super(skill.title, vscode.TreeItemCollapsibleState.None);
    this.description = skill.slug ? `cpg run ${skill.slug}` : undefined;
    this.tooltip = skill.description || skill.title;
    this.contextValue = 'skill';
    this.iconPath = new vscode.ThemeIcon('zap');

    // Clicking the item runs the skill
    this.command = {
      command:   'cpg.runSkillById',
      title:     'Run Skill',
      arguments: [skill],
    };
  }
}

export class NotLoggedInItem extends vscode.TreeItem {
  constructor() {
    super('Click to login', vscode.TreeItemCollapsibleState.None);
    this.description = 'CPG: Login';
    this.iconPath = new vscode.ThemeIcon('account');
    this.command = { command: 'cpg.login', title: 'Login' };
  }
}

export class LoadingItem extends vscode.TreeItem {
  constructor() {
    super('Loading skills...', vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('loading~spin');
  }
}

// ── Tree data provider ────────────────────────────────────────

export class SkillsTreeProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private loading = false;

  constructor(
    private cache: SkillsCache,
    private getApiKey: () => Promise<string | undefined>
  ) {}

  refresh(): void {
    this.cache.invalidate();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    // ── Top level: categories ─────────────────────────────────
    if (!element) {
      const key = await this.getApiKey();
      if (!key) return [new NotLoggedInItem()];

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
          if (a === 'coding') return -1;
          if (b === 'coding') return 1;
          return a.localeCompare(b);
        });

        return sorted.map(([cat, skills]) => new CategoryItem(cat, skills));

      } catch (err: any) {
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
