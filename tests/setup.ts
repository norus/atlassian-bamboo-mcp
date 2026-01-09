import { beforeAll, afterAll, afterEach } from 'vitest';
import { mswServer } from './mocks/server.js';

beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  mswServer.resetHandlers();
});

afterAll(() => {
  mswServer.close();
});
