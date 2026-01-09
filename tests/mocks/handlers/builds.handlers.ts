/**
 * MSW handlers for Bamboo build endpoints
 * - POST /queue/:planKey - Trigger a build
 * - DELETE /queue/:jobKey - Stop a build/job
 * - GET /result/:buildKey - Get build result
 * - GET /result/:planKey/latest - Get latest build result
 * - GET /result - List build results
 */
import { http, HttpResponse } from 'msw';
import {
  triggerResponseSuccess,
  buildResultSuccessful,
  buildResultList,
  buildResultWithLogs,
  buildResultWithStages,
} from '../fixtures/builds.fixtures.js';
import { BASE_URL } from '../fixtures/server.fixtures.js';
import { notFoundResponse } from './utils.js';

function isInvalidKey(key: string | readonly string[]): boolean {
  return typeof key === 'string' && key.startsWith('INVALID');
}

export const buildsHandlers = [
  // POST /rest/api/latest/queue/:planKey - Trigger a build
  http.post(`${BASE_URL}/rest/api/latest/queue/:planKey`, ({ params }) => {
    const { planKey } = params;

    if (isInvalidKey(planKey)) {
      return notFoundResponse(`Plan '${planKey}' was not found`);
    }

    return HttpResponse.json({
      ...triggerResponseSuccess,
      planKey: planKey,
      buildResultKey: `${planKey}-123`,
    });
  }),

  // DELETE /rest/api/latest/queue/:jobKey - Stop a build/job
  http.delete(`${BASE_URL}/rest/api/latest/queue/:jobKey`, ({ params }) => {
    const { jobKey } = params;

    if (isInvalidKey(jobKey)) {
      return notFoundResponse(`Job '${jobKey}' was not found or is not running`);
    }

    return new HttpResponse(null, { status: 204 });
  }),

  // GET /rest/api/latest/result/:planKey/latest - Get latest build result
  http.get(`${BASE_URL}/rest/api/latest/result/:projectKey-:planKey/latest`, ({ params }) => {
    const { projectKey, planKey } = params;
    const fullPlanKey = `${projectKey}-${planKey}`;

    if (isInvalidKey(projectKey) || isInvalidKey(planKey)) {
      return notFoundResponse(`Plan '${fullPlanKey}' was not found`);
    }

    return HttpResponse.json({
      ...buildResultSuccessful,
      key: `${fullPlanKey}-42`,
      planKey: fullPlanKey,
    });
  }),

  // GET /rest/api/latest/result/:buildKey - Get build result
  http.get(`${BASE_URL}/rest/api/latest/result/:buildKey`, ({ params, request }) => {
    const { buildKey } = params;
    const url = new URL(request.url);
    const expand = url.searchParams.get('expand');

    if (isInvalidKey(buildKey)) {
      return notFoundResponse(`Build result '${buildKey}' was not found`);
    }

    if (expand?.includes('logEntries')) {
      return HttpResponse.json({ ...buildResultWithLogs, key: buildKey });
    }

    if (expand?.includes('stages')) {
      return HttpResponse.json({ ...buildResultWithStages, key: buildKey });
    }

    return HttpResponse.json({ ...buildResultSuccessful, key: buildKey });
  }),

  // GET /rest/api/latest/result - List build results
  http.get(`${BASE_URL}/rest/api/latest/result`, ({ request }) => {
    const url = new URL(request.url);
    const buildState = url.searchParams.get('buildstate');
    const startIndex = url.searchParams.get('start-index');
    const maxResult = url.searchParams.get('max-result');

    const response = JSON.parse(JSON.stringify(buildResultList));

    if (startIndex) {
      response.results['start-index'] = parseInt(startIndex, 10);
    }
    if (maxResult) {
      response.results['max-result'] = parseInt(maxResult, 10);
    }

    if (buildState && response.results?.result) {
      response.results.result = response.results.result.filter(
        (result: { buildState: string }) => result.buildState === buildState
      );
      response.results.size = response.results.result.length;
    }

    return HttpResponse.json(response);
  }),
];
