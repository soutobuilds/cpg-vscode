// src/skillsCache.ts
// Fetches and caches skills so the sidebar and quick-pick are fast

import { Skill, fetchSkills } from './api';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface Cache {
  skills: Skill[];
  fetchedAt: number;
  username: string;
}

export class SkillsCache {
  private cache: Cache | null = null;

  async get(apiKey: string, force = false): Promise<Skill[]> {
    const now = Date.now();
    if (
      !force &&
      this.cache &&
      now - this.cache.fetchedAt < CACHE_TTL_MS
    ) {
      return this.cache.skills;
    }

    const data = await fetchSkills(apiKey);
    this.cache = {
      skills:    data.skills,
      fetchedAt: now,
      username:  data.user?.username || '',
    };
    return this.cache.skills;
  }

  invalidate(): void {
    this.cache = null;
  }

  getUsername(): string {
    return this.cache?.username || '';
  }

  // Group skills by category for the tree view
  byCategory(): Record<string, Skill[]> {
    if (!this.cache) return {};
    const groups: Record<string, Skill[]> = {};
    for (const skill of this.cache.skills) {
      const cat = skill.category || 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(skill);
    }
    return groups;
  }
}
