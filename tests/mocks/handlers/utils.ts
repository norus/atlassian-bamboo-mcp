/**
 * Shared utilities for MSW handlers.
 */
import { HttpResponse } from 'msw';

/**
 * Create a 404 Not Found error response in Bamboo API format.
 */
export function notFoundResponse(message: string): HttpResponse {
  return new HttpResponse(
    JSON.stringify({ message, 'status-code': 404 }),
    { status: 404 }
  );
}

/**
 * Create a 400 Bad Request error response in Bamboo API format.
 */
export function badRequestResponse(message: string): HttpResponse {
  return new HttpResponse(
    JSON.stringify({ message, 'status-code': 400 }),
    { status: 400 }
  );
}
