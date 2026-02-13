<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  Film,
  Settings,
  Zap,
  ChevronRight,
  BarChart3,
  Store,
  Menu,
  X,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const sidebarExpanded = ref(false);
const mobileMenuOpen = ref(false);

interface NavItem {
  path: string;
  name: string;
  label: string;
  icon: typeof Film;
}

const navItems: NavItem[] = [
  { path: '/dashboard', name: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/', name: 'projects', label: 'Projects', icon: Film },
  { path: '/marketplace', name: 'marketplace', label: 'Marketplace', icon: Store },
];

function navigateTo(path: string) {
  router.push(path);
  mobileMenuOpen.value = false;
}

function isActive(item: NavItem): boolean {
  if (item.name === 'projects') {
    return route.name === 'projects' || route.name === 'editor';
  }
  return route.name === item.name;
}
</script>

<template>
  <div class="flex h-screen flex-col bg-slate-950 text-slate-100 overflow-hidden">
    <!-- Mobile Top Bar -->
    <div class="flex h-14 items-center justify-between border-b border-slate-800/50 bg-slate-900/50 px-4 md:hidden">
      <div class="flex items-center gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600">
          <Zap :size="16" class="text-white" />
        </div>
        <span class="text-sm font-semibold tracking-tight text-white">ContentForge</span>
      </div>
      <button
        @click="mobileMenuOpen = !mobileMenuOpen"
        class="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800/50 hover:text-slate-200"
      >
        <X v-if="mobileMenuOpen" :size="20" />
        <Menu v-else :size="20" />
      </button>
    </div>

    <!-- Mobile Menu Overlay -->
    <div
      v-if="mobileMenuOpen"
      class="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
      @click="mobileMenuOpen = false"
    />

    <!-- Mobile Menu Drawer -->
    <nav
      :class="[
        'fixed left-0 top-14 z-50 w-64 border-r border-slate-800/50 bg-slate-900/95 backdrop-blur-xl transition-transform duration-300 md:hidden',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
      style="height: calc(100vh - 3.5rem)"
    >
      <div class="space-y-1 p-3">
        <button
          v-for="item in navItems"
          :key="item.name"
          @click="navigateTo(item.path)"
          :class="[
            'flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-colors',
            isActive(item)
              ? 'bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
          ]"
        >
          <component :is="item.icon" :size="18" />
          <span class="text-sm font-medium">{{ item.label }}</span>
        </button>
      </div>
      <div class="border-t border-slate-800/50 p-3">
        <button
          class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
        >
          <Settings :size="18" />
          <span class="text-sm font-medium">Settings</span>
        </button>
      </div>
    </nav>

    <div class="flex flex-1 overflow-hidden">
      <!-- Desktop Sidebar -->
      <aside
        :class="[
          'hidden md:flex flex-col border-r border-slate-800/50 bg-slate-900/50 backdrop-blur-xl transition-all duration-300',
          sidebarExpanded ? 'w-56' : 'w-16',
        ]"
      >
        <!-- Logo -->
        <div class="flex h-16 items-center border-b border-slate-800/50 px-4">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600">
              <Zap :size="16" class="text-white" />
            </div>
            <span
              v-if="sidebarExpanded"
              class="text-sm font-semibold tracking-tight text-white"
            >
              ContentForge
            </span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 space-y-1 p-2">
          <button
            v-for="item in navItems"
            :key="item.name"
            @click="navigateTo(item.path)"
            :class="[
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
              isActive(item)
                ? 'bg-blue-600/10 text-blue-400 ring-1 ring-blue-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
            ]"
            :title="!sidebarExpanded ? item.label : ''"
          >
            <component :is="item.icon" :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">{{ item.label }}</span>
          </button>
        </nav>

        <!-- Bottom -->
        <div class="space-y-1 border-t border-slate-800/50 p-2">
          <button
            class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
            :title="!sidebarExpanded ? 'Settings' : ''"
          >
            <Settings :size="18" class="shrink-0" />
            <span v-if="sidebarExpanded" class="text-sm font-medium">Settings</span>
          </button>
          <button
            @click="sidebarExpanded = !sidebarExpanded"
            class="flex w-full items-center justify-center rounded-lg px-3 py-2.5 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
            :title="sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'"
          >
            <ChevronRight
              :size="18"
              class="shrink-0 transition-transform duration-300"
              :class="{ 'rotate-180': sidebarExpanded }"
            />
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <router-view />
      </main>
    </div>

    <!-- Mobile Bottom Navigation -->
    <nav class="flex items-center justify-around border-t border-slate-800/50 bg-slate-900/50 py-2 md:hidden">
      <button
        v-for="item in navItems"
        :key="item.name"
        @click="navigateTo(item.path)"
        :class="[
          'flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 transition-colors min-w-[3rem]',
          isActive(item)
            ? 'text-blue-400'
            : 'text-slate-500',
        ]"
      >
        <component :is="item.icon" :size="18" />
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </button>
      <button
        class="flex flex-col items-center gap-1 rounded-lg px-4 py-1.5 text-slate-500 transition-colors min-w-[3rem]"
      >
        <Settings :size="18" />
        <span class="text-[10px] font-medium">Settings</span>
      </button>
    </nav>
  </div>
</template>
