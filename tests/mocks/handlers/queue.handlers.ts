/**
 * MSW handlers for Bamboo queue endpoints
 * - GET /queue - Get build queue
 * - GET /deploy/queue - Get deployment queue
 */
import { http, HttpResponse } from 'msw';
import {
  buildQueueWithBuilds,
  deploymentQueueWithDeployments,
} from '../fixtures/queue.fixtures.js';
import { BASE_URL } from '../fixtures/server.fixtures.js';

export const queueHandlers = [
  // GET /rest/api/latest/queue - Get build queue
  http.get(`${BASE_URL}/rest/api/latest/queue`, () => {
    return HttpResponse.json(buildQueueWithBuilds);
  }),

  // GET /rest/api/latest/deploy/queue - Get deployment queue
  http.get(`${BASE_URL}/rest/api/latest/deploy/queue`, () => {
    return HttpResponse.json(deploymentQueueWithDeployments);
  }),
];
