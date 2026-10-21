# 智能任务管理系统 - 需求拆解文档

## 产品概述

- **产品类型**: Web 任务管理工具
- **场景类型**: <scene_type>prototype-app</scene_type>
- **目标用户**: 需要管理日常待办事项的个人用户
- **核心价值**: 基于优先级的任务管理，通过 Supabase 实现数据持久化，支持多端同步
- **界面语言**: 中文
- **主题偏好**: 浅色（简洁美观）
- **导航模式**: 无导航（单页工具应用）
- **导航布局**: 无

---

## 页面结构总览

> **说明**：单页应用，所有功能集中在一个页面

**页面文件**: `TaskManagerPage.tsx`

| 区域 | 说明 |
|-----|------|
| 顶部标题区 | 系统标题 + Supabase 配置提示入口 |
| 配置面板（可折叠/弹窗） | Supabase URL 和密钥配置表单，带使用说明 |
| 任务添加区 | 任务标题输入框 + 优先级下拉选择 + 添加按钮 |
| 筛选区 | 优先级筛选下拉（全部/高/中/低） |
| 任务列表区 | 任务卡片列表，显示标题、优先级标签、完成状态、操作按钮 |
| 空状态区 | 无任务时的提示 |

---

## 页面布局建议

- **布局模式**: 单栏垂直布局 —— 任务管理是线性操作流（添加→筛选→查看→操作），单栏最符合直觉
- **视觉重心**: 任务列表 —— 用户主要在列表区进行状态切换和删除操作
- **结果承载区**: 任务列表区；初始态为空状态提示（"暂无任务，快来添加第一个吧"），加载中显示骨架屏
- **配置区**: 以右上角齿轮图标触发抽屉/弹窗，不占据主视觉空间

---

## 数据来源声明

| 数据/操作 | 来源类型 | 实现要求 | mock 兜底 |
|---|---|---|---|
| 任务数据的增删改查 | real-api | Node.js 后端封装 Supabase 客户端，提供 RESTful API（创建任务、切换完成状态、删除任务、按优先级筛选查询），配置项通过环境变量或前端配置面板注入 | 无配置时显示配置引导，不使用 mock 数据作为主链路 |
| Supabase 连接配置 | local-persist | localStorage 保存用户输入的 Supabase URL 和 anon key，键名 `__task_manager_supabase_config`；后端服务从环境变量读取配置 | 无 |

> **说明**：用户明确要求"真实接入 Supabase 数据存储，实现任务数据的持久化保存"，因此主链路为 real-api（Node.js + Supabase），禁止降级为 localStorage/mock 存储任务数据。Supabase 配置信息本身保存在 localStorage 中方便用户替换。

---

## 功能列表

- **页面**: 任务管理主页
  - **页面目标**: 完成任务的添加、查看、状态切换、删除和筛选，所有操作持久化到 Supabase
  - **功能点**:

    - **添加任务**
      - 触发: 任务添加区输入标题 + 选择优先级 + 点击"添加"按钮（或回车）
      - 交互: 表单校验（标题不能为空），调用后端 POST /api/tasks 接口
      - 提交: 后端通过 Supabase 客户端插入新任务记录（title, priority, is_completed=false, created_at）
      - 反馈: 添加成功后清空输入框，任务列表顶部显示新任务，toast 提示"任务添加成功"
      - 数据契约: 任务对象包含 id(UUID)、title(string)、priority('high'|'medium'|'low')、is_completed(boolean)、created_at(timestamp)

    - **切换任务完成状态**
      - 触发: 任务列表项的"完成/未完成"切换按钮
      - 交互: 点击后调用后端 PATCH /api/tasks/:id 接口，更新 is_completed 字段
      - 提交: 后端通过 Supabase 更新指定任务的完成状态
      - 反馈: 按钮文字切换，任务标题加/去删除线样式，toast 提示状态变更
      - 数据契约: is_completed 字段布尔切换

    - **删除任务**
      - 触发: 任务列表项的"删除"按钮
      - 交互: 弹出确认 Dialog（"确定要删除这个任务吗？"），确认后调用后端 DELETE /api/tasks/:id 接口
      - 提交: 后端通过 Supabase 删除指定任务记录
      - 反馈: 任务从列表中移除，toast 提示"任务已删除"
      - 数据契约: 按 id 物理删除

    - **按优先级筛选任务**
      - 触发: 筛选区下拉选择（全部/高/中/低）
      - 交互: 选择后调用后端 GET /api/tasks?priority=xxx 接口
      - 提交: 后端通过 Supabase 查询，priority 有值时加 where 条件过滤
      - 反馈: 列表刷新，显示筛选后的任务，空结果显示空状态
      - 数据契约: 列表始终按 created_at 倒序排列

    - **Supabase 配置管理**
      - 触发: 点击右上角齿轮/配置图标
      - 交互: 弹出配置抽屉，包含 URL 输入框、anon key 输入框、保存按钮、配置说明文字
      - 提交: 保存到 localStorage（键名 `__task_manager_supabase_config`），同时通知后端服务更新连接配置
      - 反馈: 保存成功 toast，配置无效（连接测试失败）时显示错误提示
      - 数据契约: 配置对象包含 url(string)、anonKey(string)

    - **连接状态提示**
      - 触发: 页面加载时自动检测配置
      - 交互: 未配置或配置无效时，列表区显示配置引导卡片（含"去配置"按钮）
      - 反馈: 配置有效时显示绿色连接状态标识
      - 数据契约: 无

---

## 后端技术要求（Node.js + Supabase）

- **技术栈**: Node.js + Express（或 Koa/Fastify）+ Supabase JavaScript Client
- **数据库表**: 建议表名 `tasks`，字段如下：
  - `id`: uuid（主键，默认生成）
  - `title`: text（任务标题）
  - `priority`: text（'high' / 'medium' / 'low'）
  - `is_completed`: boolean（默认 false）
  - `created_at`: timestamptz（默认 now()）
- **API 接口**:
  - `GET /api/tasks?priority=` — 获取任务列表，支持按优先级筛选，按 created_at 倒序
  - `POST /api/tasks` — 新增任务（body: { title, priority }）
  - `PATCH /api/tasks/:id` — 更新任务完成状态（body: { is_completed }）
  - `DELETE /api/tasks/:id` — 删除任务
- **配置方式**: Supabase URL 和 Key 支持两种来源：
  1. 环境变量（`SUPABASE_URL`、`SUPABASE_ANON_KEY`）— 部署时使用
  2. 前端配置面板提交后动态更新运行时配置 — 演示/开发时使用
- **CORS**: 需配置允许前端跨域访问

---

## 数据共享配置

本项目为单页应用，无跨页面数据共享需求。Supabase 配置存储在 localStorage 中供前后端使用。

```ts
// 任务数据类型定义
interface Task {
  /** 任务唯一标识（UUID） */
  id: string;
  /** 任务标题 */
  title: string;
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
  /** 是否已完成 */
  is_completed: boolean;
  /** 创建时间 */
  created_at: string;
}

// Supabase 配置类型定义
interface SupabaseConfig {
  /** Supabase 项目 URL */
  url: string;
  /** Supabase anon key */
  anonKey: string;
}

-------

<scene_type>prototype-app</scene_type>

# UI 设计指南

## 1. 设计推导依据

- **参考意图**: Free —— 无参考材料，按产品语义与功能需求自主设计
- **核心情绪 / 应用类型**: 轻量效率工具，追求专注、清晰、低认知负担的任务处理体验
- **独特记忆点**: 优先级用左侧细色条 + 圆角徽章双重表达，完成态通过灰色淡化 + 删除线形成明显视觉下沉

## 2. Art Direction

- **方向名**: 极简效率卡
- **Design Style**: Swiss Minimalist + Soft Rounded —— 任务管理需要信息清晰、操作直接，柔和圆角降低工具的冷硬感
- **DNA 参数**: 圆角 `rounded-lg`；阴影 `shadow-sm`；间距 `gap-3 / p-5`；字体方向 无衬线正文；装饰手法 左侧色条标识优先级
- **应用类型**: Tool —— 单页居中卡片式布局，操作区 + 列表区垂直堆叠

## 3. Color System

**色彩关系**: 深蓝主色 + 冷白工作台背景 + 三级优先级色条（红/橙/绿），整体低饱和、高对比
**配色设计理由**: 深蓝作为主交互色传递可靠与专注；冷白背景降低长时间使用的视觉疲劳；优先级色条饱和度克制，只作状态辅助识别，不抢主操作视线
**主色推导**: 从任务管理的"专注、可靠、高效"语义出发，选用偏冷的中深蓝，比亮蓝更沉稳，适合长时间操作界面
**使用比例**: 65% 中性 / 28% 辅助 / 7% primary；primary 仅用于主按钮与关键状态，优先级色归语义色管理

| 角色 | CSS 变量 | Tailwind Class | HSL 值 | 设计说明 |
|---|---|---|---|---|
| bg | `--background` | `bg-background` | hsl(210 20% 98%) | 页面背景，冷调浅灰 |
| card | `--card` | `bg-card` | hsl(0 0% 100%) | 任务卡片、表单容器 |
| text | `--foreground` | `text-foreground` | hsl(222 20% 16%) | 标题与正文 |
| textMuted | `--muted-foreground` | `text-muted-foreground` | hsl(215 10% 48%) | 辅助说明、时间戳 |
| primary | `--primary` | `bg-primary` / `text-primary` | hsl(221 70% 48%) | 添加按钮、主交互 |
| primaryForeground | `--primary-foreground` | `text-primary-foreground` | hsl(0 0% 100%) | 主按钮文字 |
| accent | `--accent` | `bg-accent` | hsl(216 20% 95%) | hover 浅底、筛选激活底 |
| accentForeground | `--accent-foreground` | `text-accent-foreground` | hsl(222 20% 20%) | accent 上的文字图标 |
| border | `--border` | `border-border` | hsl(216 12% 90%) | 卡片、输入框边界 |

**语义色提示**: 优先级三态，饱和度与 primary 对齐（±10%），仅用于左侧色条与徽章文字/背景：
- 高优先级：bg `hsl(0 70% 96%)` / border `hsl(0 70% 55%)` / text `hsl(0 65% 40%)`
- 中优先级：bg `hsl(32 85% 95%)` / border `hsl(32 80% 55%)` / text `hsl(30 75% 38%)`
- 低优先级：bg `hsl(140 50% 94%)` / border `hsl(142 55% 45%)` / text `hsl(142 50% 32%)`
- 完成态：文字降至 `textMuted`，背景减白，加删除线，视觉权重整体下沉

## 4. 字体与节奏

- **font-display**: Noto Sans SC —— 中文任务标题清晰易读，现代无衬线气质
- **font-body**: Noto Sans SC —— 正文与控件文字统一，减少视觉割裂
- **字号**: 页面标题 text-2xl；任务标题 text-base；辅助信息 text-sm；按钮 text-sm
- **圆角**: 中（`rounded-lg`）—— 任务卡片与按钮统一大圆角，输入框与徽章中圆角

## 5. 全局布局契约

- **Reference Layout Use**: 按需求结构推导
- **Page / Section Order**: 顶部标题 → 配置提示条 → 添加任务区（输入框 + 优先级下拉 + 添加按钮）→ 筛选标签栏 → 任务列表 → 空状态
- **Standard Content Zone**: Tool max-w-2xl + `mx-auto`
- **Shell / Frame Alignment**: 独立居中卡片，无侧栏导航；内容容器即主操作区
- **Padding & Rhythm**: `px-4 md:px-6 py-10 md:py-14`，区块间距 `space-y-6`
- **Full-bleed Zones**: 无全宽区域，所有内容受 max-w-2xl 约束
- **Local Narrowing**: 配置说明文本在卡片内保持 `text-sm` 与左右 padding 一致
- **Overflow Strategy**: 任务列表垂直滚动；长任务标题截断加省略号
- **Flexibility Boundary**: 移动端可缩小卡片内边距至 `p-4`；不允许改动主色、圆角系统和优先级色条表达

## 6. 视觉与动效

- **装饰**: 左侧优先级色条 + 极简徽章
- **阴影/边界**: 轻 —— 卡片 `shadow-sm`，hover 时 `shadow-md` 微提升
- **动效**: 克制 —— 状态切换 150ms 透明度与灰度过渡；删除任务 200ms 左滑淡出；hover 轻微抬升

## 7. 组件原则

- 添加按钮使用 primary 填充；筛选使用 accent 背景激活态；删除按钮使用 outline + 危险色文字
- 任务卡片左侧 4px 色条对应优先级，是第一视觉识别点，不依赖纯颜色
- 完成态任务整体降饱和度、加删除线、checkbox 填充；切换操作文字在"完成/未完成"间切换
- 输入框、下拉、按钮必须有 focus-visible 环（`ring-2 ring-primary/30`）
- Supabase 配置提示用浅底边框条放在页面顶部，不干扰主操作流

## 8. Image Direction

- **Image Role**: 无强制图片需求，优先通过排版、色彩和优先级色条建立视觉记忆点
- **Image Art Direction**: 无
- **Image Prompt Keywords**: 无
- **Image Avoidance**: 避免无意义插画、商务人物素材图、抽象渐变背景

## 9. Anti-patterns

- **Split personality**: 任务卡片、筛选条、输入框各自使用不同圆角或阴影；全站统一 `rounded-lg` + `shadow-sm`
- **Phantom tokens**: 编造 shadcn 不存在的 CSS 变量；只用已定义 9 角色 + 语义色
- **Default SaaS drift**: 回到默认亮蓝按钮 + 紫色渐变装饰；用深蓝主色 + 优先级色条的专属语言
- **Invisible interaction**: 只做 hover 不做 focus-visible；所有可交互元素必须有键盘焦点环
- **Mono-hue tyranny**: 主按钮、筛选激活、图标、边框全部用 primary；primary 只给添加按钮和焦点环
- **Status color drift**: 优先级色饱和度过高导致刺眼；语义色饱和度与 primary 对齐 ±10%
- **Color-only status**: 只用颜色区分优先级；必须同时有色条位置 + 文字徽章双重表达