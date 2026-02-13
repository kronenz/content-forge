/**
 * Testing utilities for @content-forge/db.
 *
 * Provides in-memory repository implementations that satisfy the same
 * interface contracts as the Supabase implementations, for use in tests
 * and local development without a database connection.
 */

import type { Repositories } from '../repositories/interfaces.js';
import { InMemoryMaterialRepository } from '../repositories/in-memory/material-repository.js';
import { InMemoryContentRepository } from '../repositories/in-memory/content-repository.js';
import { InMemoryTaskRepository } from '../repositories/in-memory/task-repository.js';
import { InMemoryPublicationRepository } from '../repositories/in-memory/publication-repository.js';
import { InMemoryMetricRepository } from '../repositories/in-memory/metric-repository.js';
import { InMemoryVideoProjectRepository } from '../repositories/in-memory/video-project-repository.js';

export function createInMemoryRepositories(): Repositories {
  return {
    materials: new InMemoryMaterialRepository(),
    contents: new InMemoryContentRepository(),
    tasks: new InMemoryTaskRepository(),
    publications: new InMemoryPublicationRepository(),
    metrics: new InMemoryMetricRepository(),
    videoProjects: new InMemoryVideoProjectRepository(),
  };
}

export {
  InMemoryMaterialRepository,
  InMemoryContentRepository,
  InMemoryTaskRepository,
  InMemoryPublicationRepository,
  InMemoryMetricRepository,
  InMemoryVideoProjectRepository,
};
