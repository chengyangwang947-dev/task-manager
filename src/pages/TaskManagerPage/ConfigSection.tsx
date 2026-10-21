import { useState, useEffect } from 'react';
import { Settings, Check, AlertCircle, Database } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  clearSupabaseConfig,
  getDefaultConfig,
} from '@/lib/supabase';
import type { SupabaseConfig } from '@/data/task';

interface ConfigSectionProps {
  onConfigChange?: () => void;
}

export default function ConfigSection({ onConfigChange }: ConfigSectionProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (open) {
      const config = getSupabaseConfig();
      if (config) {
        setUrl(config.url);
        setAnonKey(config.anonKey);
      }
    }
  }, [open]);

  useEffect(() => {
    const config = getSupabaseConfig();
    setConnected(!!config);
  }, []);

  async function handleSave() {
    if (!url.trim() || !anonKey.trim()) {
      toast.error('请填写完整的 Supabase URL 和 anon key');
      return;
    }
    const config: SupabaseConfig = { url: url.trim(), anonKey: anonKey.trim() };
    setTesting(true);
    try {
      const ok = await testSupabaseConnection(config);
      if (ok) {
        saveSupabaseConfig(config);
        setConnected(true);
        toast.success('配置已保存，连接成功');
        setOpen(false);
        onConfigChange?.();
      } else {
        toast.error('连接失败，请检查 URL 和 anon key 是否正确');
      }
    } catch {
      toast.error('连接测试出错，请稍后重试');
    } finally {
      setTesting(false);
    }
  }

  function handleClear() {
    clearSupabaseConfig();
    const def = getDefaultConfig();
    setUrl(def.url);
    setAnonKey(def.anonKey);
    setConnected(false);
    toast.info('配置已清除，已恢复默认凭据');
    onConfigChange?.();
  }

  function handleResetDefault() {
    const def = getDefaultConfig();
    setUrl(def.url);
    setAnonKey(def.anonKey);
    toast.info('已填入默认凭据，请点击"保存并测试"');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="size-4" />
          <span className="hidden sm:inline">数据库配置</span>
          {connected ? (
            <span className="flex items-center gap-1 text-success">
              <Check className="size-3" />
              已连接
            </span>
          ) : (
            <span className="flex items-center gap-1 text-warning">
              <AlertCircle className="size-3" />
              未配置
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="size-5 text-primary" />
            Supabase 数据库配置
          </DialogTitle>
          <DialogDescription>
            配置 Supabase 连接信息，实现任务数据的持久化存储。已预置默认凭据，可直接使用或替换为您自己的配置。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="supabase-url">Supabase URL</Label>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" onClick={handleResetDefault}>
                使用默认凭据
              </Button>
            </div>
            <Input
              id="supabase-url"
              type="url"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supabase-key">anon key / publishable key</Label>
            <Input
              id="supabase-key"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              公钥，可在 Supabase 控制台 → Project Settings → API 中获取
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/40 p-4 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="size-4 text-warning" />
              建表说明
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              请在 Supabase SQL Editor 中执行以下 SQL 创建{' '}
              <code className="px-1 py-0.5 bg-muted rounded">tasks</code> 表：
            </p>
            <pre className="text-xs bg-card border border-border rounded-md p-3 overflow-x-auto">
{`create table tasks (
  id bigint generated always as identity primary key,
  title text not null,
  priority text not null default '中',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "public read" on tasks
  for select using (true);

create policy "public insert" on tasks
  for insert with check (true);

create policy "public update" on tasks
  for update using (true);

create policy "public delete" on tasks
  for delete using (true);`}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {connected && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-destructive">
              清除配置
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={testing}>
              {testing ? '测试连接中...' : '保存并测试'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
