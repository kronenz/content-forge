import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type ApprovalStatus = 'draft' | 'review' | 'approved' | 'published';

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  role: string;
  online: boolean;
  color: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  text: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  authorName: string;
  action: string;
  target: string;
  createdAt: string;
}

export const useCollaborationStore = defineStore('collaboration', () => {
  const teamMembers = ref<TeamMember[]>([
    { id: 'user-001', name: 'Kim Minjun', initials: 'KM', role: 'Director', online: true, color: 'bg-blue-500' },
    { id: 'user-002', name: 'Lee Soyeon', initials: 'LS', role: 'Editor', online: true, color: 'bg-cyan-500' },
    { id: 'user-003', name: 'Park Jiwoo', initials: 'PJ', role: 'Designer', online: false, color: 'bg-violet-500' },
    { id: 'user-004', name: 'Choi Yuna', initials: 'CY', role: 'Reviewer', online: true, color: 'bg-emerald-500' },
  ]);

  const comments = ref<Comment[]>([
    {
      id: 'cmt-001',
      authorId: 'user-002',
      authorName: 'Lee Soyeon',
      authorInitials: 'LS',
      text: 'Scene 3 narration feels too long. Consider splitting it into two scenes.',
      createdAt: '2026-02-12T09:15:00Z',
    },
    {
      id: 'cmt-002',
      authorId: 'user-004',
      authorName: 'Choi Yuna',
      authorInitials: 'CY',
      text: 'The visual style on the intro looks great. Approved for the title card.',
      createdAt: '2026-02-12T10:30:00Z',
    },
    {
      id: 'cmt-003',
      authorId: 'user-001',
      authorName: 'Kim Minjun',
      authorInitials: 'KM',
      text: 'Let us finalize the outro scene before submitting for review.',
      createdAt: '2026-02-12T11:45:00Z',
    },
  ]);

  const approvalStatus = ref<ApprovalStatus>('draft');

  const activities = ref<ActivityItem[]>([
    { id: 'act-001', authorName: 'Lee Soyeon', action: 'edited', target: 'Scene 2 narration', createdAt: '2026-02-12T11:00:00Z' },
    { id: 'act-002', authorName: 'Park Jiwoo', action: 'uploaded', target: 'Scene 1 visual', createdAt: '2026-02-12T10:45:00Z' },
    { id: 'act-003', authorName: 'Kim Minjun', action: 'added', target: 'Scene 5', createdAt: '2026-02-12T09:30:00Z' },
    { id: 'act-004', authorName: 'Choi Yuna', action: 'approved', target: 'Scene 1', createdAt: '2026-02-12T09:00:00Z' },
  ]);

  const panelOpen = ref(false);

  const onlineCount = computed(() => teamMembers.value.filter((m) => m.online).length);

  function togglePanel(): void {
    panelOpen.value = !panelOpen.value;
  }

  function addComment(text: string): void {
    const comment: Comment = {
      id: `cmt-${Date.now()}`,
      authorId: 'user-001',
      authorName: 'Kim Minjun',
      authorInitials: 'KM',
      text,
      createdAt: new Date().toISOString(),
    };
    comments.value.push(comment);
  }

  function updateApprovalStatus(status: ApprovalStatus): void {
    approvalStatus.value = status;
    activities.value.unshift({
      id: `act-${Date.now()}`,
      authorName: 'Kim Minjun',
      action: status === 'review' ? 'submitted for' : status === 'approved' ? 'approved' : 'updated status to',
      target: status === 'review' ? 'review' : status,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    teamMembers,
    comments,
    approvalStatus,
    activities,
    panelOpen,
    onlineCount,
    togglePanel,
    addComment,
    updateApprovalStatus,
  };
});
