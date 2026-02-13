import { describe, it, expect, beforeEach } from 'vitest';
import { isOk, isErr } from '@content-forge/core';
import { InMemoryVideoProjectRepository } from '../repositories/in-memory/video-project-repository.js';
import type { VideoProject } from '@content-forge/core';

type CreateInput = Omit<VideoProject, 'id' | 'createdAt' | 'updatedAt'>;

function makeProject(overrides: Partial<CreateInput> = {}): CreateInput {
  return {
    title: 'Test Video Project',
    materialId: 'mat-1',
    aspectRatio: '16:9',
    scenes: [],
    globalStyle: { colorScheme: 'brand-dark', fontFamily: 'Inter' },
    status: 'editing',
    ...overrides,
  };
}

describe('InMemoryVideoProjectRepository', () => {
  let repo: InMemoryVideoProjectRepository;

  beforeEach(() => {
    repo = new InMemoryVideoProjectRepository();
  });

  it('creates a project and assigns an id', async () => {
    const result = await repo.create(makeProject());
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.id).toBeDefined();
    expect(result.value.title).toBe('Test Video Project');
    expect(result.value.createdAt).toBeDefined();
    expect(result.value.updatedAt).toBeDefined();
  });

  it('finds a project by id', async () => {
    const createResult = await repo.create(makeProject());
    if (!isOk(createResult)) return;

    const findResult = await repo.findById(createResult.value.id);
    expect(isOk(findResult)).toBe(true);
    if (!isOk(findResult)) return;
    expect(findResult.value).not.toBeNull();
    expect(findResult.value!.id).toBe(createResult.value.id);
  });

  it('returns null for non-existent id', async () => {
    const result = await repo.findById('non-existent');
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value).toBeNull();
  });

  it('updates a project', async () => {
    const createResult = await repo.create(makeProject());
    if (!isOk(createResult)) return;

    const updateResult = await repo.update(createResult.value.id, {
      title: 'Updated Title',
      status: 'rendering',
    });
    expect(isOk(updateResult)).toBe(true);
    if (!isOk(updateResult)) return;
    expect(updateResult.value.title).toBe('Updated Title');
    expect(updateResult.value.status).toBe('rendering');
  });

  it('returns error when updating non-existent project', async () => {
    const result = await repo.update('non-existent', { title: 'Nope' });
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('deletes a project', async () => {
    const createResult = await repo.create(makeProject());
    if (!isOk(createResult)) return;

    const deleteResult = await repo.delete(createResult.value.id);
    expect(isOk(deleteResult)).toBe(true);

    const findResult = await repo.findById(createResult.value.id);
    if (!isOk(findResult)) return;
    expect(findResult.value).toBeNull();
  });

  it('returns error when deleting non-existent project', async () => {
    const result = await repo.delete('non-existent');
    expect(isErr(result)).toBe(true);
    if (!isErr(result)) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('filters by status', async () => {
    await repo.create(makeProject({ status: 'editing' }));
    await repo.create(makeProject({ status: 'rendering' }));
    await repo.create(makeProject({ status: 'editing' }));

    const result = await repo.findAll({ status: 'editing' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(2);
    expect(result.value.total).toBe(2);
  });

  it('filters by aspectRatio', async () => {
    await repo.create(makeProject({ aspectRatio: '16:9' }));
    await repo.create(makeProject({ aspectRatio: '9:16' }));

    const result = await repo.findAll({ aspectRatio: '9:16' });
    expect(isOk(result)).toBe(true);
    if (!isOk(result)) return;
    expect(result.value.data.length).toBe(1);
    expect(result.value.data[0]!.aspectRatio).toBe('9:16');
  });

  it('paginates results', async () => {
    for (let i = 0; i < 5; i++) {
      await repo.create(makeProject({ title: `Project ${i}` }));
    }

    const page1 = await repo.findAll(undefined, { limit: 2, offset: 0 });
    expect(isOk(page1)).toBe(true);
    if (!isOk(page1)) return;
    expect(page1.value.data.length).toBe(2);
    expect(page1.value.total).toBe(5);

    const page2 = await repo.findAll(undefined, { limit: 2, offset: 2 });
    expect(isOk(page2)).toBe(true);
    if (!isOk(page2)) return;
    expect(page2.value.data.length).toBe(2);
    expect(page2.value.offset).toBe(2);
  });

  it('updates scenes within a project', async () => {
    const createResult = await repo.create(makeProject());
    if (!isOk(createResult)) return;

    const scene = {
      id: 'scene-1',
      order: 0,
      narration: { text: 'Hello', voiceId: 'v1', status: 'draft' as const },
      visual: {
        source: { type: 'claude-svg' as const, prompt: 'test' },
        status: 'draft' as const,
        versions: [],
      },
      presenter: {
        enabled: false,
        avatarProfileId: '',
        position: 'bottom-right' as const,
        size: 'medium' as const,
        shape: 'circle' as const,
        background: 'transparent' as const,
        gesture: 'talking' as const,
        lipSync: true,
        enterAnimation: 'fade-in' as const,
        status: 'draft' as const,
      },
      overlay: { subtitles: false, watermark: false },
      timing: { durationMs: 5000, transitionIn: 'cut' as const, transitionDurationMs: 300 },
    };

    const updateResult = await repo.update(createResult.value.id, { scenes: [scene] });
    expect(isOk(updateResult)).toBe(true);
    if (!isOk(updateResult)) return;
    expect(updateResult.value.scenes.length).toBe(1);
    expect(updateResult.value.scenes[0]!.id).toBe('scene-1');
  });
});
