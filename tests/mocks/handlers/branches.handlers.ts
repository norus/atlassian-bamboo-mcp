/**
 * MSW handlers for Bamboo branch endpoints
 * - GET /plan/:planKey/branch - List branches for a plan
 * - GET /plan/:planKey/branch/:branchName - Get branch details
 */
import { http, HttpResponse } from 'msw';
import { branchList, branchMain, branchListEnabledOnly } from '../fixtures/branches.fixtures.js';
import { BASE_URL } from '../fixtures/server.fixtures.js';
import { notFoundResponse } from './utils.js';

function isInvalidKey(key: string | readonly string[]): boolean {
  return typeof key === 'string' && key.startsWith('INVALID');
}

export const branchesHandlers = [
  // GET /rest/api/latest/plan/:planKey/branch - List branches for a plan
  http.get(`${BASE_URL}/rest/api/latest/plan/:planKey/branch`, ({ params, request }) => {
    const { planKey } = params;
    const url = new URL(request.url);
    const enabledOnly = url.searchParams.get('enabledOnly');
    const startIndex = url.searchParams.get('start-index');
    const maxResult = url.searchParams.get('max-result');

    if (isInvalidKey(planKey)) {
      return notFoundResponse(`Plan '${planKey}' was not found`);
    }

    const baseResponse = enabledOnly === 'true' ? branchListEnabledOnly : branchList;
    const response = { ...baseResponse };

    if (startIndex) {
      response.branches['start-index'] = parseInt(startIndex, 10);
    }
    if (maxResult) {
      response.branches['max-result'] = parseInt(maxResult, 10);
    }

    return HttpResponse.json(response);
  }),

  // GET /rest/api/latest/plan/:planKey/branch/:branchName - Get branch details
  http.get(`${BASE_URL}/rest/api/latest/plan/:planKey/branch/:branchName`, ({ params }) => {
    const { planKey, branchName } = params;

    if (isInvalidKey(planKey)) {
      return notFoundResponse(`Plan '${planKey}' was not found`);
    }

    if (isInvalidKey(branchName)) {
      return notFoundResponse(`Branch '${branchName}' was not found for plan '${planKey}'`);
    }

    const decodedBranchName = decodeURIComponent(branchName as string);

    return HttpResponse.json({
      ...branchMain,
      shortName: decodedBranchName,
      name: decodedBranchName,
    });
  }),
];
