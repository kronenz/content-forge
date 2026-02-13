<script setup lang="ts">
import { ref } from 'vue';
import {
  X,
  Users,
  MessageSquare,
  Activity,
  Send,
} from 'lucide-vue-next';
import { useCollaborationStore } from '@/stores/collaboration-store';
import ApprovalWorkflow from '@/components/ApprovalWorkflow.vue';
import type { ApprovalStatus } from '@/stores/collaboration-store';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const collabStore = useCollaborationStore();
const newComment = ref('');
const activeTab = ref<'team' | 'comments' | 'activity'>('team');

function handleSubmitComment(): void {
  const text = newComment.value.trim();
  if (!text) return;
  collabStore.addComment(text);
  newComment.value = '';
}

function handleApprovalUpdate(status: ApprovalStatus): void {
  collabStore.updateApprovalStatus(status);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString('ko-KR');
}

const tabs = [
  { key: 'team' as const, label: 'Team', icon: Users },
  { key: 'comments' as const, label: 'Comments', icon: MessageSquare },
  { key: 'activity' as const, label: 'Activity', icon: Activity },
];
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      v-if="open"
      class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
      @click="emit('close')"
    />

    <!-- Panel -->
    <aside
      :class="[
        'fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-slate-800/50 bg-slate-900/95 backdrop-blur-xl transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full',
      ]"
    >
      <!-- Header -->
      <div class="flex h-14 items-center justify-between border-b border-slate-800/50 px-4">
        <div class="flex items-center gap-2">
          <Users :size="16" class="text-blue-400" />
          <span class="text-sm font-semibold text-white">Collaboration</span>
        </div>
        <button
          @click="emit('close')"
          class="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800/50 hover:text-slate-300"
        >
          <X :size="16" />
        </button>
      </div>

      <!-- Approval Workflow -->
      <div class="border-b border-slate-800/50 p-3">
        <ApprovalWorkflow
          :status="collabStore.approvalStatus"
          @update:status="handleApprovalUpdate"
        />
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-slate-800/50">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            activeTab === tab.key
              ? 'border-b-2 border-blue-500 text-blue-400'
              : 'text-slate-500 hover:text-slate-300',
          ]"
        >
          <component :is="tab.icon" :size="13" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Team Tab -->
        <div v-if="activeTab === 'team'" class="space-y-1 p-3">
          <div class="mb-3 text-xs text-slate-500">
            {{ collabStore.onlineCount }} of {{ collabStore.teamMembers.length }} online
          </div>
          <div
            v-for="member in collabStore.teamMembers"
            :key="member.id"
            class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-slate-800/50"
          >
            <div class="relative">
              <div
                :class="[
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white',
                  member.color,
                ]"
              >
                {{ member.initials }}
              </div>
              <div
                :class="[
                  'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-slate-900',
                  member.online ? 'bg-emerald-400' : 'bg-slate-600',
                ]"
              />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-200 truncate">{{ member.name }}</div>
              <div class="text-xs text-slate-500">{{ member.role }}</div>
            </div>
          </div>
        </div>

        <!-- Comments Tab -->
        <div v-if="activeTab === 'comments'" class="flex flex-col h-full">
          <div class="flex-1 space-y-3 p-3 overflow-y-auto">
            <div
              v-for="comment in collabStore.comments"
              :key="comment.id"
              class="rounded-lg bg-slate-800/30 p-3 ring-1 ring-slate-700/30"
            >
              <div class="flex items-center gap-2 mb-1.5">
                <div class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-semibold text-blue-400">
                  {{ comment.authorInitials }}
                </div>
                <span class="text-xs font-medium text-slate-300">{{ comment.authorName }}</span>
                <span class="text-[10px] text-slate-600 ml-auto">{{ formatTime(comment.createdAt) }}</span>
              </div>
              <p class="text-xs text-slate-400 leading-relaxed">{{ comment.text }}</p>
            </div>
          </div>

          <!-- Comment Input -->
          <div class="border-t border-slate-800/50 p-3">
            <div class="flex items-center gap-2">
              <input
                v-model="newComment"
                @keydown.enter="handleSubmitComment"
                type="text"
                placeholder="Add a comment..."
                class="flex-1 rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 ring-1 ring-slate-700/50 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500/50"
              />
              <button
                @click="handleSubmitComment"
                :disabled="!newComment.trim()"
                :class="[
                  'rounded-lg p-2 transition-colors',
                  newComment.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-slate-800/50 text-slate-600 cursor-not-allowed',
                ]"
              >
                <Send :size="14" />
              </button>
            </div>
          </div>
        </div>

        <!-- Activity Tab -->
        <div v-if="activeTab === 'activity'" class="p-3">
          <div class="space-y-3">
            <div
              v-for="activity in collabStore.activities"
              :key="activity.id"
              class="flex items-start gap-3"
            >
              <div class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
              <div class="flex-1 min-w-0">
                <p class="text-xs text-slate-400">
                  <span class="font-medium text-slate-300">{{ activity.authorName }}</span>
                  {{ ' ' }}{{ activity.action }}{{ ' ' }}
                  <span class="text-slate-300">{{ activity.target }}</span>
                </p>
                <span class="text-[10px] text-slate-600">{{ formatTime(activity.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </Teleport>
</template>
