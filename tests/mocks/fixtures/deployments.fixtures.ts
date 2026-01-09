// Deployment fixtures for Bamboo MCP tests

import type {
  BambooDeploymentProject,
  BambooDeploymentProjectList,
  BambooDeploymentResult,
  BambooDeploymentResultList,
} from '../../../src/types.js';

export const deploymentProjectWebApp: BambooDeploymentProject = {
  id: 1001,
  oid: 'dp-1001',
  key: { key: 'DP-WEBAPP' },
  name: 'Web Application Deployment',
  description: 'Deploy web application to various environments',
  planKey: { key: 'WEBAPP-BACK' },
  environments: [
    {
      id: 100,
      key: { key: 'ENV-DEV' },
      name: 'Development',
      description: 'Development environment',
      deploymentProjectId: 1001,
    },
    {
      id: 101,
      key: { key: 'ENV-STG' },
      name: 'Staging',
      description: 'Staging environment',
      deploymentProjectId: 1001,
    },
    {
      id: 102,
      key: { key: 'ENV-PRD' },
      name: 'Production',
      description: 'Production environment',
      deploymentProjectId: 1001,
    },
  ],
};

const deploymentProjectMobile: BambooDeploymentProject = {
  id: 1002,
  oid: 'dp-1002',
  key: { key: 'DP-MOBILE' },
  name: 'Mobile App Deployment',
  description: 'Deploy mobile app builds to app stores',
  planKey: { key: 'MOBILE-IOS' },
  environments: [
    {
      id: 200,
      key: { key: 'ENV-TESTFLIGHT' },
      name: 'TestFlight',
      description: 'TestFlight beta testing',
      deploymentProjectId: 1002,
    },
    {
      id: 201,
      key: { key: 'ENV-APPSTORE' },
      name: 'App Store',
      description: 'Production App Store',
      deploymentProjectId: 1002,
    },
  ],
};

const deploymentProjectInfra: BambooDeploymentProject = {
  id: 1003,
  oid: 'dp-1003',
  key: { key: 'DP-INFRA' },
  name: 'Infrastructure Deployment',
  planKey: { key: 'INFRA-DEPLOY' },
  environments: [
    {
      id: 300,
      key: { key: 'ENV-AWS-DEV' },
      name: 'AWS Dev',
      deploymentProjectId: 1003,
    },
    {
      id: 301,
      key: { key: 'ENV-AWS-PRD' },
      name: 'AWS Production',
      deploymentProjectId: 1003,
    },
  ],
};

const deploymentProjectMinimal: BambooDeploymentProject = {
  id: 1004,
  oid: 'dp-1004',
  key: { key: 'DP-LEGACY' },
  name: 'Legacy Deployment',
  planKey: { key: 'LEGACY-OLD' },
  environments: [],
};

export const deploymentProjectList: BambooDeploymentProjectList = {
  size: 4,
  'start-index': 0,
  'max-result': 25,
  deploymentProject: [
    deploymentProjectWebApp,
    deploymentProjectMobile,
    deploymentProjectInfra,
    deploymentProjectMinimal,
  ],
};

export const deploymentResultSuccessful: BambooDeploymentResult = {
  deploymentVersion: {
    id: 5001,
    name: 'release-2.1.0-build-42',
    creationDate: '2025-01-09T09:00:00.000Z',
  },
  deploymentVersionName: 'release-2.1.0-build-42',
  id: 6001,
  deploymentState: 'SUCCESS',
  lifeCycleState: 'FINISHED',
  startedDate: '2025-01-09T10:00:00.000Z',
  finishedDate: '2025-01-09T10:05:00.000Z',
  reasonSummary: 'Deployed by admin',
  key: { key: 'DR-6001' },
  environment: {
    id: 101,
    key: { key: 'ENV-STG' },
    name: 'Staging',
  },
};

const deploymentResultFailed: BambooDeploymentResult = {
  deploymentVersion: {
    id: 5002,
    name: 'release-2.1.0-build-41',
    creationDate: '2025-01-09T08:00:00.000Z',
  },
  deploymentVersionName: 'release-2.1.0-build-41',
  id: 6002,
  deploymentState: 'FAILED',
  lifeCycleState: 'FINISHED',
  startedDate: '2025-01-09T08:30:00.000Z',
  finishedDate: '2025-01-09T08:32:00.000Z',
  reasonSummary: 'Deployment failed: connection timeout',
  key: { key: 'DR-6002' },
  environment: {
    id: 101,
    key: { key: 'ENV-STG' },
    name: 'Staging',
  },
};

const deploymentResultInProgress: BambooDeploymentResult = {
  deploymentVersion: {
    id: 5003,
    name: 'release-2.1.1-build-43',
    creationDate: '2025-01-09T10:30:00.000Z',
  },
  deploymentVersionName: 'release-2.1.1-build-43',
  id: 6003,
  deploymentState: 'UNKNOWN',
  lifeCycleState: 'IN_PROGRESS',
  startedDate: '2025-01-09T10:35:00.000Z',
  reasonSummary: 'Deployment in progress',
  key: { key: 'DR-6003' },
  environment: {
    id: 102,
    key: { key: 'ENV-PRD' },
    name: 'Production',
  },
};

const deploymentResultQueued: BambooDeploymentResult = {
  deploymentVersion: {
    id: 5004,
    name: 'release-2.1.1-build-43',
    creationDate: '2025-01-09T10:30:00.000Z',
  },
  deploymentVersionName: 'release-2.1.1-build-43',
  id: 6004,
  deploymentState: 'UNKNOWN',
  lifeCycleState: 'PENDING',
  reasonSummary: 'Waiting in queue',
  key: { key: 'DR-6004' },
  environment: {
    id: 100,
    key: { key: 'ENV-DEV' },
    name: 'Development',
  },
};

export const deploymentResultList: BambooDeploymentResultList = {
  results: {
    size: 4,
    'start-index': 0,
    'max-result': 25,
    result: [
      deploymentResultSuccessful,
      deploymentResultFailed,
      deploymentResultInProgress,
      deploymentResultQueued,
    ],
  },
};

export const deploymentResultWithLogs = {
  ...deploymentResultSuccessful,
  logEntries: [
    { timestamp: '2025-01-09T10:00:00.000Z', message: 'Deployment started', level: 'INFO' },
    { timestamp: '2025-01-09T10:00:30.000Z', message: 'Connecting to server...', level: 'INFO' },
    { timestamp: '2025-01-09T10:01:00.000Z', message: 'Uploading artifacts...', level: 'INFO' },
    { timestamp: '2025-01-09T10:03:00.000Z', message: 'Running deployment scripts...', level: 'INFO' },
    { timestamp: '2025-01-09T10:04:30.000Z', message: 'Restarting services...', level: 'INFO' },
    { timestamp: '2025-01-09T10:05:00.000Z', message: 'Deployment completed successfully', level: 'INFO' },
  ],
};

export const deploymentTriggerResponse = {
  deploymentResultId: 6010,
  link: {
    href: 'https://bamboo.example.com/rest/api/latest/deploy/result/6010',
    rel: 'self',
  },
};
