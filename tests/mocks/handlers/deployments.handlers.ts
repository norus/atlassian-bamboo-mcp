/**
 * MSW handlers for Bamboo deployment endpoints
 * - GET /deploy/project/all - List all deployment projects
 * - GET /deploy/project/:id - Get deployment project details
 * - POST /queue/deployment - Trigger a deployment
 * - GET /deploy/environment/:id/results - Get deployment results for an environment
 * - GET /deploy/result/:id - Get specific deployment result
 */
import { http, HttpResponse } from 'msw';
import {
  deploymentProjectList,
  deploymentProjectWebApp,
  deploymentTriggerResponse,
  deploymentResultList,
  deploymentResultSuccessful,
  deploymentResultWithLogs,
} from '../fixtures/deployments.fixtures.js';
import { BASE_URL } from '../fixtures/server.fixtures.js';
import { notFoundResponse, badRequestResponse } from './utils.js';

function isInvalidId(id: string | readonly string[]): boolean {
  return id === '0' || id === 'INVALID';
}

export const deploymentsHandlers = [
  // GET /rest/api/latest/deploy/project/all - List all deployment projects
  http.get(`${BASE_URL}/rest/api/latest/deploy/project/all`, () => {
    return HttpResponse.json(deploymentProjectList.deploymentProject);
  }),

  // GET /rest/api/latest/deploy/project/:id - Get deployment project details
  http.get(`${BASE_URL}/rest/api/latest/deploy/project/:id`, ({ params }) => {
    const { id } = params;

    if (isInvalidId(id)) {
      return notFoundResponse(`Deployment project '${id}' was not found`);
    }

    return HttpResponse.json({
      ...deploymentProjectWebApp,
      id: parseInt(id as string, 10),
    });
  }),

  // POST /rest/api/latest/queue/deployment - Trigger a deployment
  http.post(`${BASE_URL}/rest/api/latest/queue/deployment`, ({ request }) => {
    const url = new URL(request.url);
    const versionId = url.searchParams.get('versionId');
    const environmentId = url.searchParams.get('environmentId');

    if (!versionId || !environmentId) {
      return badRequestResponse('versionId and environmentId are required');
    }

    if (versionId === '0' || environmentId === '0') {
      return notFoundResponse('Invalid versionId or environmentId');
    }

    return HttpResponse.json({
      ...deploymentTriggerResponse,
      deploymentVersionId: parseInt(versionId, 10),
      environmentId: parseInt(environmentId, 10),
    });
  }),

  // GET /rest/api/latest/deploy/environment/:id/results - Get deployment results
  http.get(`${BASE_URL}/rest/api/latest/deploy/environment/:id/results`, ({ params, request }) => {
    const { id } = params;
    const url = new URL(request.url);
    const startIndex = url.searchParams.get('start-index');
    const maxResult = url.searchParams.get('max-result');

    if (isInvalidId(id)) {
      return notFoundResponse(`Environment '${id}' was not found`);
    }

    const response = JSON.parse(JSON.stringify(deploymentResultList));

    if (startIndex) {
      response.results['start-index'] = parseInt(startIndex, 10);
    }
    if (maxResult) {
      response.results['max-result'] = parseInt(maxResult, 10);
    }

    return HttpResponse.json(response);
  }),

  // GET /rest/api/latest/deploy/result/:id - Get specific deployment result
  http.get(`${BASE_URL}/rest/api/latest/deploy/result/:id`, ({ params, request }) => {
    const { id } = params;
    const url = new URL(request.url);
    const includeLogs = url.searchParams.get('includeLogs');

    if (isInvalidId(id)) {
      return notFoundResponse(`Deployment result '${id}' was not found`);
    }

    const baseResult = includeLogs === 'true' ? deploymentResultWithLogs : deploymentResultSuccessful;

    return HttpResponse.json({
      ...baseResult,
      id: parseInt(id as string, 10),
    });
  }),
];
