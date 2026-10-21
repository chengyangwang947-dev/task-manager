import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { scopedStorage } from '@lark-apaas/client-toolkit-lite';
import type { SupabaseConfig } from '@/data/task';

const STORAGE_KEY = 'task_manager_supabase_config';

// 预置默认 Supabase 连接凭据（可在配置面板中替换）
const DEFAULT_CONFIG: SupabaseConfig = {
  url: 'https://terxvmrhhfjbfoogsecw.supabase.co',
  anonKey: 'sb_publishable_mFWxUawqAJ6IvsUHivj13g_s4_w0rVO',
};

let client: SupabaseClient | null = null;
let currentConfig: SupabaseConfig | null = null;

export function getSupabaseConfig(): SupabaseConfig | null {
  if (currentConfig) return currentConfig;
  const stored = scopedStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      currentConfig = JSON.parse(stored) as SupabaseConfig;
      return currentConfig;
    } catch {
      currentConfig = null;
    }
  }
  // 无存储配置时使用默认凭据
  currentConfig = { ...DEFAULT_CONFIG };
  return currentConfig;
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  currentConfig = config;
  scopedStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  client = null; // 重置 client 以便下次用新配置重建
}

export function clearSupabaseConfig(): void {
  currentConfig = null;
  client = null;
  scopedStorage.removeItem(STORAGE_KEY);
}

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config?.url || !config?.anonKey) return null;
  if (client) return client;
  try {
    client = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  } catch {
    client = null;
  }
  return client;
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<boolean> {
  try {
    const testClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    const { error } = await testClient.from('tasks').select('id').limit(1);
    if (error) {
      // 表不存在但连接成功也视为配置有效（用户可能还没建表）
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return true;
      }
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getDefaultConfig(): SupabaseConfig {
  return { ...DEFAULT_CONFIG };
}
