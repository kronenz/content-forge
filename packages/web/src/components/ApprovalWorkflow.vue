<script setup lang="ts">
import {
  FileEdit,
  Search,
  CheckCircle2,
  Send,
  ArrowRight,
} from 'lucide-vue-next';
import type { ApprovalStatus } from '@/stores/collaboration-store';

const props = defineProps<{
  status: ApprovalStatus;
}>();

const emit = defineEmits<{
  'update:status': [status: ApprovalStatus];
}>();

interface StepConfig {
  key: ApprovalStatus;
  label: string;
  icon: typeof FileEdit;
}

const steps: StepConfig[] = [
  { key: 'draft', label: 'Draft', icon: FileEdit },
  { key: 'review', label: 'Review', icon: Search },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
  { key: 'published', label: 'Published', icon: Send },
];

const statusOrder: ApprovalStatus[] = ['draft', 'review', 'approved', 'published'];

function getStepState(stepKey: ApprovalStatus): 'completed' | 'current' | 'upcoming' {
  const currentIdx = statusOrder.indexOf(props.status);
  const stepIdx = statusOrder.indexOf(stepKey);
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'current';
  return 'upcoming';
}

function getStepClasses(state: 'completed' | 'current' | 'upcoming'): string {
  if (state === 'completed') return 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20';
  if (state === 'current') return 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20';
  return 'bg-slate-800/50 text-slate-600 ring-1 ring-slate-700/50';
}

function getConnectorClass(stepKey: ApprovalStatus): string {
  const currentIdx = statusOrder.indexOf(props.status);
  const stepIdx = statusOrder.indexOf(stepKey);
  return stepIdx < currentIdx ? 'bg-emerald-500/30' : 'bg-slate-700/50';
}

function getNextAction(): { label: string; nextStatus: ApprovalStatus } | null {
  if (props.status === 'draft') return { label: 'Submit for Review', nextStatus: 'review' };
  if (props.status === 'review') return { label: 'Approve', nextStatus: 'approved' };
  if (props.status === 'approved') return { label: 'Publish', nextStatus: 'published' };
  return null;
}

function getSecondaryAction(): { label: string; nextStatus: ApprovalStatus } | null {
  if (props.status === 'review') return { label: 'Request Changes', nextStatus: 'draft' };
  return null;
}
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Steps -->
    <div class="flex items-center gap-1">
      <template v-for="(step, idx) in steps" :key="step.key">
        <div
          :class="[
            'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
            getStepClasses(getStepState(step.key)),
          ]"
        >
          <component :is="step.icon" :size="12" />
          <span class="hidden sm:inline">{{ step.label }}</span>
        </div>
        <div
          v-if="idx < steps.length - 1"
          :class="['h-px w-4 transition-colors', getConnectorClass(step.key)]"
        />
      </template>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-2 ml-auto">
      <button
        v-if="getSecondaryAction()"
        @click="emit('update:status', getSecondaryAction()!.nextStatus)"
        class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 ring-1 ring-rose-500/20 transition-colors hover:bg-rose-500/10"
      >
        {{ getSecondaryAction()!.label }}
      </button>
      <button
        v-if="getNextAction()"
        @click="emit('update:status', getNextAction()!.nextStatus)"
        class="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500"
      >
        {{ getNextAction()!.label }}
        <ArrowRight :size="12" />
      </button>
    </div>
  </div>
</template>
