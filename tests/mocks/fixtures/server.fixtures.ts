// Server fixtures for Bamboo MCP tests

import type { BambooServerInfo, BambooHealthCheck } from '../../../src/types.js';

export const BASE_URL = 'https://bamboo.example.com';

export const serverInfo: BambooServerInfo = {
  version: '9.6.4',
  edition: 'Bamboo',
  buildDate: '2024-12-15T10:30:00.000Z',
  buildNumber: '90604',
  state: 'RUNNING',
};

export const healthCheckHealthy: BambooHealthCheck = {
  status: 'OK',
  checks: {
    database: { status: 'OK' },
    diskSpace: { status: 'OK' },
    indexing: { status: 'OK' },
    messaging: { status: 'OK' },
  },
};
