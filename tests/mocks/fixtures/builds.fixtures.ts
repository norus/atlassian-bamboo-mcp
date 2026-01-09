// Build fixtures for Bamboo MCP tests

import type {
  BambooBuildResult,
  BambooBuildResultList,
  BambooTriggerResponse,
} from '../../../src/types.js';
import { BASE_URL } from './server.fixtures.js';

export const buildResultSuccessful: BambooBuildResult = {
  key: 'WEBAPP-BACK-42',
  buildNumber: 42,
  buildState: 'Successful',
  buildResultKey: 'WEBAPP-BACK-42',
  lifeCycleState: 'Finished',
  state: 'Successful',
  successful: true,
  finished: true,
  buildStartedTime: '2025-01-09T10:00:00.000Z',
  buildCompletedTime: '2025-01-09T10:03:00.000Z',
  buildDurationInSeconds: 180,
  buildRelativeTime: '3 minutes ago',
  buildReason: 'Manual build',
  reasonSummary: 'Manual build by admin',
  link: {
    href: `${BASE_URL}/rest/api/latest/result/WEBAPP-BACK-42`,
    rel: 'self',
  },
  plan: {
    key: 'WEBAPP-BACK',
    name: 'Web Application - Backend Build',
    shortName: 'Backend Build',
  },
  vcsRevisionKey: 'abc123def456789',
};

const buildResultFailed: BambooBuildResult = {
  key: 'WEBAPP-BACK-41',
  buildNumber: 41,
  buildState: 'Failed',
  buildResultKey: 'WEBAPP-BACK-41',
  lifeCycleState: 'Finished',
  state: 'Failed',
  successful: false,
  finished: true,
  buildStartedTime: '2025-01-09T09:00:00.000Z',
  buildCompletedTime: '2025-01-09T09:02:30.000Z',
  buildDurationInSeconds: 150,
  buildRelativeTime: '1 hour ago',
  buildReason: 'Code change detected',
  reasonSummary: 'Changes by john.doe',
  link: {
    href: `${BASE_URL}/rest/api/latest/result/WEBAPP-BACK-41`,
    rel: 'self',
  },
  plan: {
    key: 'WEBAPP-BACK',
    name: 'Web Application - Backend Build',
    shortName: 'Backend Build',
  },
  vcsRevisionKey: '987654321fedcba',
};

const buildResultWithChanges: BambooBuildResult = {
  key: 'WEBAPP-BACK-43',
  buildNumber: 43,
  buildState: 'Successful',
  buildResultKey: 'WEBAPP-BACK-43',
  lifeCycleState: 'Finished',
  state: 'Successful',
  successful: true,
  finished: true,
  buildStartedTime: '2025-01-09T11:00:00.000Z',
  buildCompletedTime: '2025-01-09T11:03:00.000Z',
  buildDurationInSeconds: 180,
  buildRelativeTime: '30 minutes ago',
  buildReason: 'Code change detected',
  reasonSummary: 'Changes by jane.smith',
  link: {
    href: `${BASE_URL}/rest/api/latest/result/WEBAPP-BACK-43`,
    rel: 'self',
  },
  plan: {
    key: 'WEBAPP-BACK',
    name: 'Web Application - Backend Build',
    shortName: 'Backend Build',
  },
  vcsRevisionKey: 'newrevision123456',
  changes: {
    size: 2,
    change: [
      {
        changesetId: 'abc123',
        author: 'jane.smith',
        date: '2025-01-09T10:55:00.000Z',
        comment: 'feat: add user authentication',
      },
      {
        changesetId: 'def456',
        author: 'jane.smith',
        date: '2025-01-09T10:50:00.000Z',
        comment: 'refactor: extract auth service',
      },
    ],
  },
};

const buildResultWithArtifacts: BambooBuildResult = {
  key: 'WEBAPP-BACK-44',
  buildNumber: 44,
  buildState: 'Successful',
  buildResultKey: 'WEBAPP-BACK-44',
  lifeCycleState: 'Finished',
  state: 'Successful',
  successful: true,
  finished: true,
  buildStartedTime: '2025-01-09T12:00:00.000Z',
  buildCompletedTime: '2025-01-09T12:05:00.000Z',
  buildDurationInSeconds: 300,
  buildRelativeTime: '15 minutes ago',
  link: {
    href: `${BASE_URL}/rest/api/latest/result/WEBAPP-BACK-44`,
    rel: 'self',
  },
  artifacts: {
    size: 3,
    artifact: [
      {
        name: 'build-output.zip',
        link: { href: `${BASE_URL}/artifact/WEBAPP-BACK-44/build-output.zip` },
      },
      {
        name: 'coverage-report.html',
        link: { href: `${BASE_URL}/artifact/WEBAPP-BACK-44/coverage-report.html` },
      },
      {
        name: 'test-results.xml',
        link: { href: `${BASE_URL}/artifact/WEBAPP-BACK-44/test-results.xml` },
      },
    ],
  },
};

const buildResultWithTestResults: BambooBuildResult = {
  key: 'WEBAPP-BACK-45',
  buildNumber: 45,
  buildState: 'Successful',
  buildResultKey: 'WEBAPP-BACK-45',
  lifeCycleState: 'Finished',
  state: 'Successful',
  successful: true,
  finished: true,
  buildStartedTime: '2025-01-09T13:00:00.000Z',
  buildCompletedTime: '2025-01-09T13:04:00.000Z',
  buildDurationInSeconds: 240,
  buildRelativeTime: '5 minutes ago',
  link: {
    href: `${BASE_URL}/rest/api/latest/result/WEBAPP-BACK-45`,
    rel: 'self',
  },
  testResults: {
    all: 150,
    successful: 145,
    failed: 0,
    skipped: 5,
    quarantined: 0,
  },
};

export const buildResultList: BambooBuildResultList = {
  results: {
    size: 5,
    'start-index': 0,
    'max-result': 25,
    result: [
      buildResultSuccessful,
      buildResultFailed,
      buildResultWithChanges,
      buildResultWithArtifacts,
      buildResultWithTestResults,
    ],
  },
};

export const triggerResponseSuccess: BambooTriggerResponse = {
  buildNumber: 50,
  buildResultKey: 'WEBAPP-BACK-50',
  planKey: 'WEBAPP-BACK',
  link: {
    href: `${BASE_URL}/rest/api/latest/result/WEBAPP-BACK-50`,
    rel: 'self',
  },
  triggerReason: 'Manual build by admin',
};

export const buildResultWithStages = {
  ...buildResultSuccessful,
  stages: {
    size: 3,
    stage: [
      {
        name: 'Build',
        state: 'Successful',
        results: {
          size: 1,
          result: [
            {
              key: 'WEBAPP-BACK-JOB1-42',
              state: 'Successful',
              lifeCycleState: 'Finished',
            },
          ],
        },
      },
      {
        name: 'Test',
        state: 'Successful',
        results: {
          size: 2,
          result: [
            {
              key: 'WEBAPP-BACK-UNIT-42',
              state: 'Successful',
              lifeCycleState: 'Finished',
            },
            {
              key: 'WEBAPP-BACK-INTEG-42',
              state: 'Successful',
              lifeCycleState: 'Finished',
            },
          ],
        },
      },
      {
        name: 'Deploy',
        state: 'Successful',
        results: {
          size: 1,
          result: [
            {
              key: 'WEBAPP-BACK-DEPLOY-42',
              state: 'Successful',
              lifeCycleState: 'Finished',
            },
          ],
        },
      },
    ],
  },
};

export const buildResultWithLogs = {
  ...buildResultSuccessful,
  logEntries: [
    { timestamp: '2025-01-09T10:00:00.000Z', message: 'Build started', level: 'INFO' },
    { timestamp: '2025-01-09T10:00:05.000Z', message: 'Checking out repository...', level: 'INFO' },
    { timestamp: '2025-01-09T10:00:30.000Z', message: 'Running npm install...', level: 'INFO' },
    { timestamp: '2025-01-09T10:01:00.000Z', message: 'Dependencies installed successfully', level: 'INFO' },
    { timestamp: '2025-01-09T10:01:05.000Z', message: 'Running tests...', level: 'INFO' },
    { timestamp: '2025-01-09T10:02:30.000Z', message: 'All 150 tests passed', level: 'INFO' },
    { timestamp: '2025-01-09T10:02:35.000Z', message: 'Building application...', level: 'INFO' },
    { timestamp: '2025-01-09T10:03:00.000Z', message: 'Build completed successfully', level: 'INFO' },
  ],
};
