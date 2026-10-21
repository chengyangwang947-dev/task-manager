import { useState, type FormEvent } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { getSupabaseClient } from '@/lib/supabase';
import { PRIORITY_LABELS, PRIORITY_VALUES, type ITask, type Priority } from '@/data/task';

interface AddTaskSectionProps {
  onTaskAdded: (task: ITask) => void;
}

export default function AddTaskSection({ onTaskAdded }: AddTaskSectionProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('中');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      toast.error('请先配置 Supabase 数据库连接');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ title: title.trim(), priority, completed: false })
        .select()
        .single();

      if (error) throw error;
      onTaskAdded(data as ITask);
      setTitle('');
      setPriority('中');
      toast.success('任务添加成功');
    } catch (err) {
      toast.error('添加失败：' + (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入新任务..."
          className="flex-1 h-11"
          disabled={submitting}
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)} disabled={submitting}>
          <SelectTrigger className="w-full sm:w-[140px] h-11">
            <SelectValue placeholder="优先级" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_VALUES.map((p) => (
              <SelectItem key={p} value={p}>
                优先级：{PRIORITY_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" disabled={submitting || !title.trim()} className="h-11 px-6 gap-2">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          添加
        </Button>
      </div>
    </form>
  );
}
