import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckSquare2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image } from '@/components/ui/image';
import ConfigSection from './ConfigSection';
import AddTaskSection from './AddTaskSection';
import TaskListSection from './TaskListSection';
import { getSupabaseClient, getSupabaseConfig } from '@/lib/supabase';
import type { ITask } from '@/data/task';

const HERO_IMAGE =
  '/spark/app/app_17gg4v8mqt6/runtime/api/v1/storage/object/bucket_aadk3ce7sigdu_static/static%2Faadk3cdnrlwka_ve_miaoda';

export default function TaskManagerPage() {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  const configTriggerRef = useRef<HTMLButtonElement>(null);

  const fetchTasks = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setHasConfig(false);
      setTasks([]);
      return;
    }
    setHasConfig(true);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTasks((data as ITask[]) || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const config = getSupabaseConfig();
    setHasConfig(!!config);
    if (config) {
      fetchTasks();
    }
  }, [fetchTasks]);

  function handleConfigChange() {
    fetchTasks();
  }

  function handleTaskAdded(task: ITask) {
    setTasks((prev) => [task, ...prev]);
  }

  function openConfig() {
    configTriggerRef.current?.click();
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-linear-to-br from-primary/5 via-background to-secondary/10">
      {/* Hero 区 */}
      <section className="w-full relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={HERO_IMAGE} alt="Hero" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/60 to-background" />
        </div>
        <div className="max-w-4xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                <CheckSquare2 className="size-5" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">智能任务管理</h1>
                <p className="text-xs text-muted-foreground">基于 Supabase 的云端任务管理系统</p>
              </div>
            </div>
            <div ref={configTriggerRef as any}>
              <ConfigSection onConfigChange={handleConfigChange} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline" className="gap-1 bg-background/60 backdrop-blur-sm">
                <Sparkles className="size-3 text-primary" />
                简洁高效
              </Badge>
              <Badge variant="outline" className="gap-1 bg-background/60 backdrop-blur-sm">
                云端持久化
              </Badge>
              <Badge variant="outline" className="gap-1 bg-background/60 backdrop-blur-sm">
                优先级管理
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
              让每一个任务
              <br />
              <span className="text-primary">都井然有序</span>
            </h2>
            <p className="text-muted-foreground max-w-md">
              快速添加任务，按优先级排序，一键切换完成状态。
              所有数据安全存储在 Supabase 云端，随时访问。
            </p>
            {hasConfig && totalCount > 0 && (
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div>
                  <span className="text-2xl font-bold text-primary">{totalCount}</span>
                  <span className="text-muted-foreground ml-1">总任务</span>
                </div>
                <div className="w-px h-6 bg-border" />
                <div>
                  <span className="text-2xl font-bold text-success">{completedCount}</span>
                  <span className="text-muted-foreground ml-1">已完成</span>
                </div>
                {totalCount > 0 && (
                  <>
                    <div className="w-px h-6 bg-border" />
                    <div>
                      <span className="text-2xl font-bold">
                        {Math.round((completedCount / totalCount) * 100)}%
                      </span>
                      <span className="text-muted-foreground ml-1">完成率</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 主内容区 */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 pb-20 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-5">
            <h3 className="text-base font-semibold mb-4">添加新任务</h3>
            <AddTaskSection onTaskAdded={handleTaskAdded} />
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-5">
            <TaskListSection
              tasks={tasks}
              loading={loading}
              hasConfig={hasConfig}
              onTasksChange={fetchTasks}
              onOpenConfig={openConfig}
            />
          </Card>
        </motion.div>
      </main>

      {/* 页脚 */}
      <footer className="w-full border-t border-border/40 py-6">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center text-xs text-muted-foreground">
          智能任务管理系统 · 基于 Supabase 构建
        </div>
      </footer>
    </div>
  );
}
