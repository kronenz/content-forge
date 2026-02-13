# ContentForge - Look and Feel Guide

## Design Direction

**Style: Production Ready (Style L)** — Dark immersive web app inspired by modern SaaS platforms.
Professional, data-rich, and efficient. Feels like a native app, not a website.

## Design Principles

- **Dark-first theme** with layered surface elevation
- Immersive web app experience (sidebar + main + bottom status bar)
- Information-dense but breathable — balanced whitespace
- Consistent spacing, typography, and color system across all pages
- Responsive design (desktop-first, mobile-friendly)
- Micro-interactions on all interactive elements (hover, focus, transitions)

## Icons

- **DO NOT** use emojis anywhere in the UI
- Always use the **Lucide** icon library for all icons
- Import from `lucide-vue-next` (Vue) or `lucide-react` (React)
- Icon sizing: `14px` (metadata), `16px` (inline), `18px` (navigation), `24px` (prominent)
- Icon color should inherit from parent text color unless explicitly styled

```vue
<script setup>
import { Settings, ChevronRight, BarChart3 } from 'lucide-vue-next'
</script>
<template>
  <Settings :size="18" />
</template>
```

## Color Palette

### Base (Dark Theme)
- `--cf-bg`: `#030712` (Slate 950) — Page background
- `--cf-surface`: `rgba(15, 23, 42, 0.5)` (Slate 900/50) — Elevated surfaces
- `--cf-surface-hover`: `rgba(30, 41, 59, 0.5)` (Slate 800/50) — Hover states
- `--cf-border`: `rgba(30, 41, 59, 0.5)` (Slate 800/50) — Borders (use `ring-1`)
- `--cf-text`: `#FFFFFF` — Primary text
- `--cf-text-secondary`: `#94A3B8` (Slate 400) — Secondary text
- `--cf-text-muted`: `#475569` (Slate 600) — Muted/disabled text
- `--cf-text-faint`: `#334155` (Slate 700) — Very faint text (timestamps)

### Primary
- `--cf-primary`: `#2563EB` (Blue 600) — Primary CTA buttons, active states
- `--cf-primary-hover`: `#3B82F6` (Blue 500) — Button hover
- `--cf-primary-tint`: `rgba(37, 99, 235, 0.1)` (Blue 600/10) — Active nav background
- `--cf-primary-shadow`: `rgba(37, 99, 235, 0.2)` — Button glow shadow

### Accent
- `--cf-accent`: `#06B6D4` (Cyan 500) — Processing states, highlights
- `--cf-accent-gradient`: `linear-gradient(135deg, #2563EB, #06B6D4)` — Logo, brand elements

### Semantic Status
- `--cf-success`: `#34D399` (Emerald 400) — Published, completed, positive trends
- `--cf-warning`: `#FBBF24` (Amber 400) — Scheduled, pending, processing
- `--cf-error`: `#FB7185` (Rose 400) — Failed, errors, negative trends
- `--cf-info`: `#8B5CF6` (Violet 400) — Analytics, insights

### Semantic Status (Background + Ring)
Each status has a bg/text/ring triplet for badges:
- Published: `bg-emerald-500/10 text-emerald-400 ring-emerald-500/20`
- Processing: `bg-blue-500/10 text-blue-400 ring-blue-500/20`
- Scheduled: `bg-amber-500/10 text-amber-400 ring-amber-500/20`
- Failed: `bg-rose-500/10 text-rose-400 ring-rose-500/20`
- Draft: `bg-slate-500/10 text-slate-400 ring-slate-500/20`

## Typography

- Font family: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- Korean: `'Pretendard', 'Noto Sans KR', sans-serif`
- Monospace: `'JetBrains Mono', 'Fira Code', monospace` (for code/IDs)

### Scale
| Usage | Size | Weight | Tracking |
|-------|------|--------|----------|
| Page title | 24px (text-2xl) | Bold (700) | tracking-tight |
| Section heading | 18px (text-lg) | Semibold (600) | — |
| Card title | 14px (text-sm) | Semibold (600) | — |
| Body | 14px (text-sm) | Regular (400) | — |
| Metadata | 12px (text-xs) | Medium (500) | — |
| Tiny labels | 10px (text-[10px]) | Medium (500) | — |
| Metrics/Numbers | Any size | Bold (700) | tabular-nums |

## Spacing

- Base unit: `4px` (Tailwind default)
- Component padding: `16px` (p-4) to `24px` (p-6)
- Card internal padding: `16px–20px`
- Section gaps: `24px` (gap-6)
- Grid gaps: `16px` (gap-4)
- Page padding: `24px` (p-6)

## Components

### Cards
- Background: `bg-slate-900/50` (semi-transparent surface)
- Border: `ring-1 ring-slate-800/50` (ring pattern, NOT border)
- Border radius: `rounded-xl` (12px)
- Hover: `hover:bg-slate-800/50 hover:ring-slate-700/50`
- No box-shadow by default (use ring for elevation)

### Buttons
- **Primary**: `bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500`
- **Secondary**: `bg-slate-900/50 text-slate-400 ring-1 ring-slate-800/50 hover:bg-slate-800/50`
- **Ghost**: `text-slate-500 hover:bg-slate-800/50 hover:text-slate-300`
- **Danger**: `bg-rose-600 text-white hover:bg-rose-500`
- Border radius: `rounded-lg` (8px)
- Height: `py-2 px-4` (default), `py-1.5 px-3` (compact)
- Always include Lucide icon + text label for primary actions

### Status Badges
- Shape: `rounded-md` (6px) with `ring-1`
- Pattern: dot indicator + text label
- Use bg/text/ring triplets from semantic status section
- Example: `<div class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 ring-1 bg-emerald-500/10 text-emerald-400 ring-emerald-500/20">`

### Tables / Lists
- No traditional tables — use card-based list items
- Item: `rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50 p-4`
- Hover: `hover:bg-slate-800/50`
- Divider: `divide-y divide-slate-800/30`

## Layout

### App Shell
```
+--sidebar--+----------top-bar-----------+
| icon nav  | breadcrumb  search  create |
| icon nav  +----------------------------+
| icon nav  |   stats row               |
| icon nav  |   main content grid       |
| icon nav  |   materials + activity    |
| settings  |                           |
| expand    |                           |
+-----------+---------------------------+
+--------bottom-pipeline-status-bar-----+
```

### Sidebar
- Collapsed: `w-16` (icon-only), Expanded: `w-56` (icon + label)
- Background: `bg-slate-900/50 backdrop-blur-xl`
- Border: `border-r border-slate-800/50`
- Active item: `bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20`
- Inactive: `text-slate-400 hover:bg-slate-800/50 hover:text-slate-200`
- Toggle button at bottom with `rotate-180` animation

### Top Bar
- Height: `h-16`
- Background: `bg-slate-950/80 backdrop-blur-xl` (sticky)
- Contains: back link, page title, search, notifications, create button

### Bottom Status Bar
- Height: `h-14`
- Background: `bg-slate-900/80 backdrop-blur-xl`
- Border: `border-t border-slate-800/50`
- Shows: current processing material, progress bar, controls (pause/skip/stop)
- Progress: gradient bar `from-blue-600 to-cyan-500`

### Page Patterns
- **Dashboard**: Stats grid + Material cards + Activity feed
- **List pages**: Filter bar + Card list (NOT table) + Status badges
- **Detail pages**: Header + Content sections + Side panel
- **Settings**: Form groups with card-based sections

## Gradient Thumbnails

For material cards, use gradient thumbnails to add visual variety:
```
gradient-1: from-blue-600 to-cyan-600
gradient-2: from-violet-600 to-purple-600
gradient-3: from-emerald-600 to-teal-600
gradient-4: from-amber-600 to-orange-600
gradient-5: from-rose-600 to-pink-600
gradient-6: from-indigo-600 to-blue-600
```

## Sample Pages

Refer to `LookAndFeel/SamplePages/` for implementation reference:
- `DashboardPage.vue` — Stats + Materials + Activity
- `PipelineListPage.vue` — Pipeline cards with status
- `MaterialDetailPage.vue` — Material detail with pipeline assignments

## Tech Stack (Frontend)

- Framework: Vue 3 (Composition API, `<script setup>`)
- Build: Vite
- Styling: Tailwind CSS
- Icons: `lucide-vue-next`
- Charts: Chart.js or Apache ECharts
- State: Pinia
- Router: Vue Router 4
