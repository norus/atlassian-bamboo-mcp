/**
 * MSW handlers for Bamboo server endpoints
 * - GET /info - Server information
 * - GET /server - Health check
 */
import { http, HttpResponse } from 'msw';
import {
  serverInfo,
  healthCheckHealthy,
  BASE_URL,
} from '../fixtures/server.fixtures.js';

export const serverHandlers = [
  // GET /rest/api/latest/info - Get server info
  http.get(`${BASE_URL}/rest/api/latest/info`, () => {
    return HttpResponse.json(serverInfo);
  }),

  // GET /rest/api/latest/server - Health check
  http.get(`${BASE_URL}/rest/api/latest/server`, () => {
    return HttpResponse.json(healthCheckHealthy);
  }),
];
