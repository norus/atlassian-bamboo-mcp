/**
 * MSW handlers for Bamboo project endpoints
 * - GET /project - List all projects
 * - GET /project/:projectKey - Get project details
 */
import { http, HttpResponse } from 'msw';
import { projectList, projectWebApp } from '../fixtures/projects.fixtures.js';
import { BASE_URL } from '../fixtures/server.fixtures.js';
import { notFoundResponse } from './utils.js';

export const projectsHandlers = [
  // GET /rest/api/latest/project - List all projects
  http.get(`${BASE_URL}/rest/api/latest/project`, ({ request }) => {
    const url = new URL(request.url);
    const startIndex = url.searchParams.get('start-index');
    const maxResult = url.searchParams.get('max-result');

    // Return the fixture, potentially modified based on params
    const response = { ...projectList };

    if (startIndex) {
      response.projects['start-index'] = parseInt(startIndex, 10);
    }
    if (maxResult) {
      response.projects['max-result'] = parseInt(maxResult, 10);
    }

    return HttpResponse.json(response);
  }),

  // GET /rest/api/latest/project/:projectKey - Get project details
  http.get(`${BASE_URL}/rest/api/latest/project/:projectKey`, ({ params }) => {
    const { projectKey } = params;

    if (typeof projectKey === 'string' && projectKey.startsWith('INVALID')) {
      return notFoundResponse(`Project '${projectKey}' was not found`);
    }

    // Return fixture with the requested project key
    return HttpResponse.json({
      ...projectWebApp,
      key: projectKey,
    });
  }),
];
