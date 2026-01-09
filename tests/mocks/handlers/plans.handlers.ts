/**
 * MSW handlers for Bamboo plan endpoints
 * - GET /plan - List all plans
 * - GET /plan/:planKey - Get plan details
 * - GET /search/plans - Search plans by name
 * - POST /plan/:planKey/enable - Enable a plan
 * - DELETE /plan/:planKey/enable - Disable a plan
 */
import { http, HttpResponse } from 'msw';
import { planList, planBackendBuild, planSearchResults, planSearchResultsEmpty } from '../fixtures/plans.fixtures.js';
import { BASE_URL } from '../fixtures/server.fixtures.js';
import { notFoundResponse } from './utils.js';

function isInvalidPlanKey(planKey: string | readonly string[]): boolean {
  return typeof planKey === 'string' && planKey.startsWith('INVALID');
}

export const plansHandlers = [
  // GET /rest/api/latest/plan - List all plans
  http.get(`${BASE_URL}/rest/api/latest/plan`, ({ request }) => {
    const url = new URL(request.url);
    const startIndex = url.searchParams.get('start-index');
    const maxResult = url.searchParams.get('max-result');

    const response = { ...planList };

    if (startIndex) {
      response.plans['start-index'] = parseInt(startIndex, 10);
    }
    if (maxResult) {
      response.plans['max-result'] = parseInt(maxResult, 10);
    }

    return HttpResponse.json(response);
  }),

  // GET /rest/api/latest/plan/:planKey - Get plan details
  http.get(`${BASE_URL}/rest/api/latest/plan/:planKey`, ({ params }) => {
    const { planKey } = params;

    if (isInvalidPlanKey(planKey)) {
      return notFoundResponse(`Plan '${planKey}' was not found`);
    }

    return HttpResponse.json({
      ...planBackendBuild,
      key: planKey,
      planKey: { key: planKey },
    });
  }),

  // GET /rest/api/latest/search/plans - Search plans by name
  http.get(`${BASE_URL}/rest/api/latest/search/plans`, ({ request }) => {
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('searchTerm');
    const startIndex = url.searchParams.get('start-index');
    const maxResult = url.searchParams.get('max-result');

    if (searchTerm === 'NOTFOUND') {
      return HttpResponse.json(planSearchResultsEmpty);
    }

    const response = { ...planSearchResults };

    if (startIndex) {
      response.plans['start-index'] = parseInt(startIndex, 10);
    }
    if (maxResult) {
      response.plans['max-result'] = parseInt(maxResult, 10);
    }

    return HttpResponse.json(response);
  }),

  // POST /rest/api/latest/plan/:planKey/enable - Enable a plan
  http.post(`${BASE_URL}/rest/api/latest/plan/:planKey/enable`, ({ params }) => {
    const { planKey } = params;

    if (isInvalidPlanKey(planKey)) {
      return notFoundResponse(`Plan '${planKey}' was not found`);
    }

    return HttpResponse.json({ key: planKey, name: 'Plan', enabled: true });
  }),

  // DELETE /rest/api/latest/plan/:planKey/enable - Disable a plan
  http.delete(`${BASE_URL}/rest/api/latest/plan/:planKey/enable`, ({ params }) => {
    const { planKey } = params;

    if (isInvalidPlanKey(planKey)) {
      return notFoundResponse(`Plan '${planKey}' was not found`);
    }

    return HttpResponse.json({ key: planKey, name: 'Plan', enabled: false });
  }),
];
