/**
 * VideoProject service — orchestrates project and scene operations.
 */

import { randomUUID } from 'node:crypto';
import { Err, type Result } from '@content-forge/core';
import type { VideoProject, EditableScene } from '@content-forge/core';
import type {
  Repositories,
  DbError,
  PaginatedResult,
  VideoProjectFilters,
  PaginationOptions,
} from '@content-forge/db';

export class VideoProjectService {
  constructor(private readonly repos: Repositories) {}

  async createProject(data: {
    title: string;
    aspectRatio: '16:9' | '9:16';
    materialId: string;
  }): Promise<Result<VideoProject, DbError>> {
    return this.repos.videoProjects.create({
      title: data.title,
      aspectRatio: data.aspectRatio,
      materialId: data.materialId,
      scenes: [],
      globalStyle: { colorScheme: 'brand-dark', fontFamily: 'Inter' },
      status: 'editing',
    });
  }

  async getProject(id: string): Promise<Result<VideoProject | null, DbError>> {
    return this.repos.videoProjects.findById(id);
  }

  async listProjects(
    filters?: VideoProjectFilters,
    pagination?: PaginationOptions,
  ): Promise<Result<PaginatedResult<VideoProject>, DbError>> {
    return this.repos.videoProjects.findAll(filters, pagination);
  }

  async updateProject(
    id: string,
    data: Partial<Omit<VideoProject, 'id' | 'createdAt'>>,
  ): Promise<Result<VideoProject, DbError>> {
    return this.repos.videoProjects.update(id, data);
  }

  async deleteProject(id: string): Promise<Result<void, DbError>> {
    return this.repos.videoProjects.delete(id);
  }

  async addScene(
    projectId: string,
    sceneData: Omit<EditableScene, 'id' | 'order'>,
    afterSceneId?: string,
  ): Promise<Result<VideoProject, DbError>> {
    const projectResult = await this.repos.videoProjects.findById(projectId);
    if (!projectResult.ok) return projectResult;
    if (projectResult.value === null) {
      return Err({ code: 'NOT_FOUND', message: `VideoProject ${projectId} not found` });
    }

    const project = projectResult.value;
    const scenes = [...project.scenes];

    const newScene: EditableScene = {
      ...sceneData,
      id: randomUUID(),
      order: scenes.length,
    };

    if (afterSceneId) {
      const idx = scenes.findIndex((s) => s.id === afterSceneId);
      if (idx >= 0) {
        scenes.splice(idx + 1, 0, newScene);
      } else {
        scenes.push(newScene);
      }
    } else {
      scenes.push(newScene);
    }

    // Recalculate order
    const reordered = scenes.map((s, i): EditableScene => ({
      id: s.id,
      order: i,
      narration: s.narration,
      visual: s.visual,
      presenter: s.presenter,
      overlay: s.overlay,
      timing: s.timing,
    }));

    return this.repos.videoProjects.update(projectId, { scenes: reordered });
  }

  async updateScene(
    projectId: string,
    sceneId: string,
    data: Partial<Omit<EditableScene, 'id' | 'order'>>,
  ): Promise<Result<VideoProject, DbError>> {
    const projectResult = await this.repos.videoProjects.findById(projectId);
    if (!projectResult.ok) return projectResult;
    if (projectResult.value === null) {
      return Err({ code: 'NOT_FOUND', message: `VideoProject ${projectId} not found` });
    }

    const project = projectResult.value;
    const sceneIdx = project.scenes.findIndex((s) => s.id === sceneId);
    if (sceneIdx < 0) {
      return Err({ code: 'NOT_FOUND', message: `Scene ${sceneId} not found` });
    }

    const existing = project.scenes[sceneIdx];
    if (!existing) {
      return Err({ code: 'NOT_FOUND', message: `Scene ${sceneId} not found` });
    }
    const scenes = [...project.scenes];
    const merged: EditableScene = {
      id: existing.id,
      order: existing.order,
      narration: data.narration ?? existing.narration,
      visual: data.visual ?? existing.visual,
      presenter: data.presenter ?? existing.presenter,
      overlay: data.overlay ?? existing.overlay,
      timing: data.timing ?? existing.timing,
    };
    scenes[sceneIdx] = merged;

    return this.repos.videoProjects.update(projectId, { scenes });
  }

  async removeScene(
    projectId: string,
    sceneId: string,
  ): Promise<Result<VideoProject, DbError>> {
    const projectResult = await this.repos.videoProjects.findById(projectId);
    if (!projectResult.ok) return projectResult;
    if (projectResult.value === null) {
      return Err({ code: 'NOT_FOUND', message: `VideoProject ${projectId} not found` });
    }

    const project = projectResult.value;
    const filtered = project.scenes.filter((s) => s.id !== sceneId);

    if (filtered.length === project.scenes.length) {
      return Err({ code: 'NOT_FOUND', message: `Scene ${sceneId} not found` });
    }

    // Recalculate order
    const scenes = filtered.map((s, i): EditableScene => ({
      id: s.id,
      order: i,
      narration: s.narration,
      visual: s.visual,
      presenter: s.presenter,
      overlay: s.overlay,
      timing: s.timing,
    }));

    return this.repos.videoProjects.update(projectId, { scenes });
  }

  async reorderScenes(
    projectId: string,
    sceneIds: string[],
  ): Promise<Result<VideoProject, DbError>> {
    const projectResult = await this.repos.videoProjects.findById(projectId);
    if (!projectResult.ok) return projectResult;
    if (projectResult.value === null) {
      return Err({ code: 'NOT_FOUND', message: `VideoProject ${projectId} not found` });
    }

    const project = projectResult.value;
    const sceneMap = new Map(project.scenes.map((s) => [s.id, s]));

    // Validate all sceneIds exist
    for (const id of sceneIds) {
      if (!sceneMap.has(id)) {
        return Err({ code: 'INVALID_INPUT', message: `Scene ${id} not found` });
      }
    }

    const scenes: EditableScene[] = sceneIds.map((id, idx) => {
      const s = sceneMap.get(id);
      if (!s) {
        throw new Error(`Scene ${id} not found in map`); // Should never happen due to validation above
      }
      return {
        id: s.id,
        order: idx,
        narration: s.narration,
        visual: s.visual,
        presenter: s.presenter,
        overlay: s.overlay,
        timing: s.timing,
      };
    });

    return this.repos.videoProjects.update(projectId, { scenes });
  }

  async triggerRender(
    projectId: string,
  ): Promise<Result<{ jobId: string }, DbError>> {
    const projectResult = await this.repos.videoProjects.findById(projectId);
    if (!projectResult.ok) return Err(projectResult.error);
    if (projectResult.value === null) {
      return Err({ code: 'NOT_FOUND', message: `VideoProject ${projectId} not found` });
    }

    // Stub: return a fake job ID
    const jobId = randomUUID();
    await this.repos.videoProjects.update(projectId, { status: 'rendering' });
    return { ok: true, value: { jobId } };
  }

  getRenderStatus(
    _projectId: string,
    _jobId: string,
  ): Promise<Result<{ progress: number; status: string }, DbError>> {
    // Stub: always return "in progress"
    return Promise.resolve({ ok: true, value: { progress: 0, status: 'queued' } });
  }
}
