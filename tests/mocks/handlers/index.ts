/**
 * Consolidated MSW handlers for Bamboo API mocking.
 * All domain-specific handlers are imported from their respective files.
 */
import { serverHandlers } from './server.handlers.js';
import { projectsHandlers } from './projects.handlers.js';
import { plansHandlers } from './plans.handlers.js';
import { branchesHandlers } from './branches.handlers.js';
import { buildsHandlers } from './builds.handlers.js';
import { queueHandlers } from './queue.handlers.js';
import { deploymentsHandlers } from './deployments.handlers.js';

export const handlers = [
  ...serverHandlers,
  ...projectsHandlers,
  ...plansHandlers,
  ...branchesHandlers,
  ...buildsHandlers,
  ...queueHandlers,
  ...deploymentsHandlers,
];
