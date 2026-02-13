---
globs: ["**/*.vue", "**/*.css", "**/*.scss", "LookAndFeel/**/*"]
---
# Frontend Rules

## Design System
- Refer to LookAndFeel/LookAndFeel.md for the full design guide
- Sample page designs are in LookAndFeel/SamplePages/
- Reference implementation: LookAndFeel/preview/src/StyleL_Dashboard.vue

## Theme
- Dark-first theme (Slate-950 base, NOT light theme)
- Layered surfaces: bg-slate-900/50 with ring-1 ring-slate-800/50
- Use ring pattern for borders, NOT border- utility
- Hover states: hover:bg-slate-800/50

## Colors
- Primary: Blue-600 (#2563EB) for CTAs and active states
- Accent: Cyan-500 (#06B6D4) for processing/highlights
- Success: Emerald-400, Warning: Amber-400, Error: Rose-400, Info: Violet-400
- Status badges use bg/text/ring triplets (e.g., bg-emerald-500/10 text-emerald-400 ring-emerald-500/20)

## Icons
- DO NOT use emojis - always use Lucide (lucide-vue-next)
- Sizes: 14px (meta), 16px (inline), 18px (nav), 24px (prominent)

## Layout
- App shell: expandable sidebar (w-16/w-56) + sticky top bar + bottom status bar
- Cards: rounded-xl bg-slate-900/50 ring-1 ring-slate-800/50
- Use card-based lists, NOT traditional tables

## Typography
- Font: Inter (system font stack)
- Metrics: tabular-nums, font-bold
- Headlines: tracking-tight

## Framework
- Vue 3 with Composition API (<script setup>)
- Styling: Tailwind CSS utility classes
- State management: Pinia
- Router: Vue Router 4
- Korean font: Pretendard, fallback Noto Sans KR

## Vue Template Rules
- Do NOT use both :class and class on the same element (duplicate attribute error)
- Merge dynamic and static classes into a single :class array binding
- Do NOT use HTML comments inside <script> blocks (use // JS comments)
