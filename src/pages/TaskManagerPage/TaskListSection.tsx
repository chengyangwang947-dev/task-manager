import { useState, useMemo } from 'react';
import { Check, X, Trash2, Filter, Loader2, Inbox, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getSupabaseClient } from '@/lib/supabase';
import { PRIORITY_LABELS, type ITask, type Priority } from '@/data/task';

interface TaskListSectionProps {
  tasks: ITask[];
  loading: boolean;
  hasConfig: boolean;
  onTasksChange: () => void;
  onOpenConfig: () => void;
}

type FilterValue = 'all' | Priority;

const PRIORITY_VARIANT: Record<Priority, 'destructive' | 'default' | 'secondary'> = {
  '高': 'destructive',
  '中': 'default',
  '低': 'secondary',
};

export default function TaskListSection({
  tasks,
  loading,
  hasConfig,
  onTasksChange,
  onOpenConfig,
}: TaskListSectionProps) {
  const [filter, setFilter] = useState<FilterValue>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const list = filter === 'all' ? tasks : tasks.filter((t) => t.priority === filter);
    return [...list].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [tasks, filter]);

  async function handleToggle(task: ITask) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setTogglingId(task.id);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);
      if (error) throw error;
      onTasksChange();
      toast.success(task.completed ? '已标记为未完成' : '已标记为完成');
    } catch (err) {
      toast.error('操作失败：' + (err as Error).message);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: number) {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      setDeleteId(null);
      onTasksChange();
      toast.success('任务已删除');
    } catch (err) {
      toast.error('删除失败：' + (err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  if (!hasConfig) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center">
          <Database className="size-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">尚未配置数据库</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            请先配置 Supabase 数据库连接，以便保存和管理您的任务数据。
          </p>
        </div>
        <Button onClick={onOpenConfig} className="gap-2">
          去配置
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">任务列表</h2>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部优先级</SelectItem>
              <SelectItem value="高">高优先级</SelectItem>
              <SelectItem value="中">中优先级</SelectItem>
              <SelectItem value="低">低优先级</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="size-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 flex flex-col items-center justify-center text-center gap-3">
          <Inbox className="size-12 text-muted-foreground/60" />
          <p className="text-muted-foreground">
            {filter === 'all' ? '暂无任务，快来添加第一个吧' : '该优先级下暂无任务'}
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((task) => (
              <motion.li
                key={task.id}
                layout
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 30, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card
                  className={`p-4 flex items-center gap-3 border-l-4 transition-colors ${
                    task.completed ? 'bg-muted/30' : ''
                  }`}
                  style={{
                    borderLeftColor:
                      task.priority === '高'
                        ? 'hsl(var(--destructive))'
                        : task.priority === '中'
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--muted-foreground) / 0.5)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium truncate ${
                        task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={PRIORITY_VARIANT[task.priority]} className="text-xs">
                        {PRIORITY_LABELS[task.priority]}优先级
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(task.created_at).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(task)}
                      disabled={togglingId === task.id}
                      className="h-8 gap-1"
                    >
                      {task.completed ? (
                        <>
                          <X className="size-3.5" />
                          未完成
                        </>
                      ) : (
                        <>
                          <Check className="size-3.5" />
                          完成
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(task.id)}
                      disabled={deletingId === task.id}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </Card>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个任务吗？删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId !== null && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deletingId === deleteId && <Loader2 className="size-4 animate-spin mr-1" />}
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
