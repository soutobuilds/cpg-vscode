"use strict";
// src/skillsCache.ts
// Fetches and caches skills so the sidebar and quick-pick are fast
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsCache = void 0;
const api_1 = require("./api");
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
class SkillsCache {
    constructor() {
        this.cache = null;
    }
    async get(apiKey, force = false) {
        const now = Date.now();
        if (!force &&
            this.cache &&
            now - this.cache.fetchedAt < CACHE_TTL_MS) {
            return this.cache.skills;
        }
        const data = await (0, api_1.fetchSkills)(apiKey);
        this.cache = {
            skills: data.skills,
            fetchedAt: now,
            username: data.user?.username || '',
        };
        return this.cache.skills;
    }
    invalidate() {
        this.cache = null;
    }
    getUsername() {
        return this.cache?.username || '';
    }
    // Group skills by category for the tree view
    byCategory() {
        if (!this.cache)
            return {};
        const groups = {};
        for (const skill of this.cache.skills) {
            const cat = skill.category || 'general';
            if (!groups[cat])
                groups[cat] = [];
            groups[cat].push(skill);
        }
        return groups;
    }
}
exports.SkillsCache = SkillsCache;
//# sourceMappingURL=skillsCache.js.map