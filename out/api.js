"use strict";
// src/api.ts
// HTTP client for CopyPasteGenius API
// Mirrors the CLI's api.js but typed for TypeScript
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
exports.fetchSkills = fetchSkills;
exports.fetchSkill = fetchSkill;
exports.runSkill = runSkill;
exports.fetchPacks = fetchPacks;
exports.installPack = installPack;
exports.verifyApiKey = verifyApiKey;
const vscode = __importStar(require("vscode"));
const fetch = require('node-fetch');
function getApiUrl() {
    return vscode.workspace.getConfiguration('cpg').get('apiUrl')
        || 'https://www.copypastegenius.com';
}
async function request(method, path, apiKey, body) {
    const url = getApiUrl() + path;
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
    };
    if (body)
        opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    if (!res.ok) {
        const err = new Error(data.error || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }
    return data;
}
async function fetchSkills(apiKey, params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/api/skills${qs ? '?' + qs : ''}`, apiKey);
}
async function fetchSkill(apiKey, slug) {
    return request('GET', `/api/skills?slug=${encodeURIComponent(slug)}`, apiKey);
}
async function runSkill(apiKey, slug, variables) {
    return request('POST', '/api/skills', apiKey, { slug, variables });
}
async function fetchPacks(apiKey) {
    return request('GET', '/api/packs', apiKey);
}
async function installPack(apiKey, slug) {
    return request('POST', '/api/packs', apiKey, { slug });
}
// Verify an API key is valid — returns user info or throws
async function verifyApiKey(apiKey) {
    const data = await request('GET', '/api/skills?limit=1', apiKey);
    return data.user;
}
//# sourceMappingURL=api.js.map