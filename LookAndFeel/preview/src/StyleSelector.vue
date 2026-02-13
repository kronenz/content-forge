<script setup lang="ts">
import { Palette, ArrowRight } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white">
    <div class="mx-auto max-w-5xl px-8 py-16">
      <div class="mb-12 text-center">
        <h1 class="mb-3 text-4xl font-bold tracking-tight">ContentForge Design Styles</h1>
        <p class="text-lg text-slate-400">Pick a style that fits the platform's identity</p>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Style A: Dark Command Center -->
        <router-link
          to="/style-a"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10"
        >
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">
            <Palette :size="12" />
            Style A
          </div>
          <h2 class="mb-1.5 text-xl font-bold text-white">Dark Command Center</h2>
          <p class="mb-3 text-sm leading-relaxed text-slate-400">
            Vercel/Linear inspired. Dark bg, violet/cyan accents. High-tech, premium.
          </p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span class="h-5 w-5 rounded-full bg-slate-950 ring-1 ring-slate-700"></span>
              <span class="h-5 w-5 rounded-full bg-violet-500"></span>
              <span class="h-5 w-5 rounded-full bg-cyan-400"></span>
              <span class="h-5 w-5 rounded-full bg-emerald-400"></span>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-violet-400" />
          </div>
        </router-link>

        <!-- Style B: Warm Editorial -->
        <router-link
          to="/style-b"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-amber-950/30 to-slate-950 p-6 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10"
        >
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
            <Palette :size="12" />
            Style B
          </div>
          <h2 class="mb-1.5 text-xl font-bold text-white">Warm Editorial</h2>
          <p class="mb-3 text-sm leading-relaxed text-slate-400">
            Medium/Substack inspired. Cream bg, warm tones. Typography-focused.
          </p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span class="h-5 w-5 rounded-full bg-amber-50 ring-1 ring-amber-200"></span>
              <span class="h-5 w-5 rounded-full bg-amber-600"></span>
              <span class="h-5 w-5 rounded-full bg-orange-500"></span>
              <span class="h-5 w-5 rounded-full bg-stone-600"></span>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-amber-400" />
          </div>
        </router-link>

        <!-- Style C: Glass Gradient -->
        <router-link
          to="/style-c"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-blue-950/30 to-slate-950 p-6 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10"
        >
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
            <Palette :size="12" />
            Style C
          </div>
          <h2 class="mb-1.5 text-xl font-bold text-white">Glass Gradient</h2>
          <p class="mb-3 text-sm leading-relaxed text-slate-400">
            Notion/Raycast inspired. Light bg, glass morphism, soft gradients.
          </p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span class="h-5 w-5 rounded-full bg-white ring-1 ring-slate-200"></span>
              <span class="h-5 w-5 rounded-full bg-blue-600"></span>
              <span class="h-5 w-5 rounded-full bg-indigo-500"></span>
              <span class="h-5 w-5 rounded-full bg-rose-500"></span>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-blue-400" />
          </div>
        </router-link>

        <!-- Style D: Monochrome Minimal -->
        <router-link
          to="/style-d"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-neutral-900 to-slate-950 p-6 transition-all hover:border-neutral-400/50 hover:shadow-lg hover:shadow-neutral-500/10"
        >
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-neutral-300">
            <Palette :size="12" />
            Style D
          </div>
          <h2 class="mb-1.5 text-xl font-bold text-white">Monochrome Minimal</h2>
          <p class="mb-3 text-sm leading-relaxed text-slate-400">
            Stripe/Apple inspired. Pure B&W, ultra-clean. Professional through restraint.
          </p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span class="h-5 w-5 rounded-full bg-white ring-1 ring-neutral-300"></span>
              <span class="h-5 w-5 rounded-full bg-black"></span>
              <span class="h-5 w-5 rounded-full bg-neutral-400"></span>
              <span class="h-5 w-5 rounded-full bg-neutral-200 ring-1 ring-neutral-300"></span>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-white" />
          </div>
        </router-link>

        <!-- Style E: Data Dense -->
        <router-link
          to="/style-e"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#161b22] to-[#0d1117] p-6 transition-all hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10"
        >
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
            <Palette :size="12" />
            Style E
          </div>
          <h2 class="mb-1.5 text-xl font-bold text-white">Data Dense</h2>
          <p class="mb-3 text-sm leading-relaxed text-slate-400">
            Datadog/GitHub inspired. Dark monospace, dense metrics. Ops-oriented.
          </p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span class="h-5 w-5 rounded-full bg-[#0d1117] ring-1 ring-slate-600"></span>
              <span class="h-5 w-5 rounded-full bg-green-400"></span>
              <span class="h-5 w-5 rounded-full bg-blue-400"></span>
              <span class="h-5 w-5 rounded-full bg-amber-400"></span>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-green-400" />
          </div>
        </router-link>

        <!-- Style F: Soft Professional -->
        <router-link
          to="/style-f"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-violet-950/30 to-slate-950 p-6 transition-all hover:border-violet-400/50 hover:shadow-lg hover:shadow-violet-400/10"
        >
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-300">
            <Palette :size="12" />
            Style F
          </div>
          <h2 class="mb-1.5 text-xl font-bold text-white">Soft Professional</h2>
          <p class="mb-3 text-sm leading-relaxed text-slate-400">
            Linear/Figma inspired. Light bg, compact sidebar, violet accents, clean density.
          </p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span class="h-5 w-5 rounded-full bg-[#f8f9fc] ring-1 ring-slate-300"></span>
              <span class="h-5 w-5 rounded-full bg-violet-600"></span>
              <span class="h-5 w-5 rounded-full bg-sky-500"></span>
              <span class="h-5 w-5 rounded-full bg-emerald-500"></span>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-violet-400" />
          </div>
        </router-link>
      </div>

      <!-- Benchmarked Styles -->
      <div class="mb-6 mt-16 text-center">
        <h2 class="mb-2 text-2xl font-bold tracking-tight">Benchmarked Styles</h2>
        <p class="text-sm text-slate-500">Inspired by real content platforms</p>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Style G: Growth Green (Sprout Social) -->
        <router-link
          to="/style-g"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-emerald-950/40 to-slate-950 p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <Palette :size="12" />
            Style G
          </div>
          <h2 class="mb-1.5 text-xl font-bold text-white">Growth Green</h2>
          <p class="mb-1 text-sm leading-relaxed text-slate-400">
            Sprout Social inspired. Nature/growth theme, organic feel, professional warmth.
          </p>
          <p class="mb-3 text-xs text-slate-600">Seeds design system benchmark</p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span class="h-5 w-5 rounded-full bg-[#f5f7f5] ring-1 ring-emerald-300"></span>
              <span class="h-5 w-5 rounded-full bg-emerald-600"></span>
              <span class="h-5 w-5 rounded-full bg-teal-500"></span>
              <span class="h-5 w-5 rounded-full bg-emerald-300"></span>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-emerald-400" />
          </div>
        </router-link>

        <!-- Style H: Minimal Blue (Buffer) -->
        <router-link
          to="/style-h"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-sky-950/30 to-slate-950 p-6 transition-all hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10"
        >
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
            <Palette :size="12" />
            Style H
          </div>
          <h2 class="mb-1.5 text-xl font-bold text-white">Minimal Blue</h2>
          <p class="mb-1 text-sm leading-relaxed text-slate-400">
            Buffer inspired. Ultra-minimal, efficiency-focused, clean flat cards.
          </p>
          <p class="mb-3 text-xs text-slate-600">Popcorn design system benchmark</p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span class="h-5 w-5 rounded-full bg-white ring-1 ring-slate-200"></span>
              <span class="h-5 w-5 rounded-full bg-[#168EEA]"></span>
              <span class="h-5 w-5 rounded-full bg-slate-100 ring-1 ring-slate-200"></span>
              <span class="h-5 w-5 rounded-full bg-slate-400"></span>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-sky-400" />
          </div>
        </router-link>

        <!-- Style I: Warm Canvas (HubSpot) -->
        <router-link
          to="/style-i"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-orange-950/30 to-slate-950 p-6 transition-all hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10"
        >
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
            <Palette :size="12" />
            Style I
          </div>
          <h2 class="mb-1.5 text-xl font-bold text-white">Warm Canvas</h2>
          <p class="mb-1 text-sm leading-relaxed text-slate-400">
            HubSpot inspired. Warm orange, human-centered, team collaboration feel.
          </p>
          <p class="mb-3 text-xs text-slate-600">Canvas design system benchmark</p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span class="h-5 w-5 rounded-full bg-[#faf8f5] ring-1 ring-orange-200"></span>
              <span class="h-5 w-5 rounded-full bg-[#FF4800]"></span>
              <span class="h-5 w-5 rounded-full bg-orange-400"></span>
              <span class="h-5 w-5 rounded-full bg-emerald-500"></span>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-orange-400" />
          </div>
        </router-link>

        <!-- Style J: Bold Contrast (Jasper AI) -->
        <router-link
          to="/style-j"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-red-950/30 to-slate-950 p-6 transition-all hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10"
        >
          <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400">
            <Palette :size="12" />
            Style J
          </div>
          <h2 class="mb-1.5 text-xl font-bold text-white">Bold Contrast</h2>
          <p class="mb-1 text-sm leading-relaxed text-slate-400">
            Jasper AI inspired. Black header, bold typography, red-orange accent, high contrast.
          </p>
          <p class="mb-3 text-xs text-slate-600">Jasper brand system benchmark</p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1.5">
              <span class="h-5 w-5 rounded-full bg-[#FAFAFA] ring-1 ring-neutral-300"></span>
              <span class="h-5 w-5 rounded-full bg-[#060606]"></span>
              <span class="h-5 w-5 rounded-full bg-[#FA4028]"></span>
              <span class="h-5 w-5 rounded-full bg-emerald-500"></span>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-red-400" />
          </div>
        </router-link>
      </div>

      <!-- Web App Style -->
      <div class="mb-6 mt-16 text-center">
        <h2 class="mb-2 text-2xl font-bold tracking-tight">Web App Style</h2>
        <p class="text-sm text-slate-500">Immersive app-like experience</p>
      </div>

      <div class="grid grid-cols-1 gap-6">
        <!-- Style K: Web App (Suno) -->
        <router-link
          to="/style-k"
          class="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-violet-950/20 via-pink-950/20 to-cyan-950/20 p-6 transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10"
        >
          <div class="flex items-start justify-between">
            <div>
              <div class="mb-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500/10 to-pink-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                <Palette :size="12" />
                Style K
              </div>
              <h2 class="mb-1.5 text-xl font-bold text-white">Dark Web App</h2>
              <p class="mb-1 text-sm leading-relaxed text-slate-400">
                Suno.com inspired. Full dark app shell, icon sidebar, card grid, bottom status bar.
                Immersive, content-first, feels like a native app.
              </p>
              <p class="mb-3 text-xs text-slate-600">Suno / Spotify web app benchmark</p>
              <div class="flex gap-1.5">
                <span class="h-5 w-5 rounded-full bg-[#18181B] ring-1 ring-slate-600"></span>
                <span class="h-5 w-5 rounded-full bg-gradient-to-br from-violet-500 to-pink-500"></span>
                <span class="h-5 w-5 rounded-full bg-cyan-500"></span>
                <span class="h-5 w-5 rounded-full bg-emerald-400"></span>
              </div>
            </div>
            <ArrowRight :size="18" class="text-slate-600 transition-colors group-hover:text-violet-400" />
          </div>
        </router-link>
      </div>

      <!-- Production Ready -->
      <div class="mb-6 mt-16 text-center">
        <h2 class="mb-2 text-2xl font-bold tracking-tight">Production Ready</h2>
        <p class="text-sm text-slate-500">Enterprise-grade design system for ContentForge</p>
      </div>

      <div class="grid grid-cols-1 gap-6">
        <!-- Style L: Production Ready -->
        <router-link
          to="/style-l"
          class="group relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-blue-950/40 via-slate-900 to-cyan-950/40 p-8 transition-all hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300 ring-1 ring-blue-500/20">
                <Palette :size="12" />
                Style L
              </div>
              <h2 class="mb-2 text-2xl font-bold text-white">Production Ready</h2>
              <p class="mb-2 text-sm leading-relaxed text-slate-300">
                Complete design system built for ContentForge. Professional SaaS interface with expandable sidebar,
                comprehensive stats, material cards, live activity feed, and bottom pipeline status bar.
                Immersive web app experience with production-grade polish.
              </p>
              <p class="mb-4 text-xs text-slate-600">
                Enterprise design system - Inter typography, 8px grid, semantic colors
              </p>
              <div class="flex gap-1.5">
                <span class="h-6 w-6 rounded-lg bg-slate-950 ring-1 ring-slate-600"></span>
                <span class="h-6 w-6 rounded-lg bg-blue-600"></span>
                <span class="h-6 w-6 rounded-lg bg-cyan-500"></span>
                <span class="h-6 w-6 rounded-lg bg-emerald-500"></span>
                <span class="h-6 w-6 rounded-lg bg-amber-500"></span>
              </div>
            </div>
            <ArrowRight :size="20" class="shrink-0 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-blue-400" />
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>
