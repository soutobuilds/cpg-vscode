// src/api.ts
// HTTP client for CopyPasteGenius API
// Mirrors the CLI's api.js but typed for TypeScript

import * as vscode from 'vscode';
const fetch = require('node-fetch');

export interface Variable {
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  multiline: boolean;
}

export interface Skill {
  id: string;
  title: string;
  description?: string;
  prompt: string;
  variables: Variable[];
  model?: string;
  type: string;
  category: string;
  tags: string[];
  slug?: string;
  output_example?: string;
  use_count: number;
  is_public: boolean;
}

export interface Pack {
  id: string;
  title: string;
  description?: string;
  category: string;
  slug?: string;
  cover_color: string;
  is_public: boolean;
  install_count: number;
  skills: Skill[];
  profiles?: { username: string };
}

export interface UserInfo {
  username: string;
  plan: string;
}

function getApiUrl(): string {
  return vscode.workspace.getConfiguration('cpg').get('apiUrl') as string
    || 'https://www.copypastegenius.com';
}

async function request<T>(
  method: string,
  path: string,
  apiKey: string,
  body?: object
): Promise<T> {
  const url = getApiUrl() + path;
  const opts: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));

  if (!res.ok) {
    const err: any = new Error(data.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return data as T;
}

export async function fetchSkills(
  apiKey: string,
  params: { category?: string; search?: string } = {}
): Promise<{ skills: Skill[]; user: UserInfo }> {
  const qs = new URLSearchParams(params as any).toString();
  return request('GET', `/api/skills${qs ? '?' + qs : ''}`, apiKey);
}

export async function fetchSkill(
  apiKey: string,
  slug: string
): Promise<{ skill: Skill }> {
  return request('GET', `/api/skills?slug=${encodeURIComponent(slug)}`, apiKey);
}

export async function runSkill(
  apiKey: string,
  slug: string,
  variables: Record<string, string>
): Promise<{ assembled_prompt: string; skill: Skill; unfilled_variables: string[]; ready: boolean }> {
  return request('POST', '/api/skills', apiKey, { slug, variables });
}

export async function fetchPacks(apiKey: string): Promise<{ packs: Pack[] }> {
  return request('GET', '/api/packs', apiKey);
}

export async function installPack(
  apiKey: string,
  slug: string
): Promise<{ installed: { id: string; title: string; slug?: string }[]; count: number; message: string }> {
  return request('POST', '/api/packs', apiKey, { slug });
}

// Verify an API key is valid — returns user info or throws
export async function verifyApiKey(apiKey: string): Promise<UserInfo> {
  const data: any = await request('GET', '/api/skills?limit=1', apiKey);
  return data.user as UserInfo;
}
