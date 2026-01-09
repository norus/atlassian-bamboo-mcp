// Queue fixtures for Bamboo MCP tests

import type { BambooBuildQueue, BambooDeploymentQueue } from '../../../src/types.js';
import { BASE_URL } from './server.fixtures.js';

export const buildQueueWithBuilds: BambooBuildQueue = {
  queuedBuilds: {
    size: 3,
    'start-index': 0,
    'max-result': 25,
    queuedBuild: [
      {
        triggerReason: 'Manual build by admin',
        buildNumber: 50,
        planKey: 'WEBAPP-BACK',
        buildResultKey: 'WEBAPP-BACK-50',
        link: { href: `${BASE_URL}/rest/api/latest/result/WEBAPP-BACK-50` },
      },
      {
        triggerReason: 'Code change detected',
        buildNumber: 101,
        planKey: 'WEBAPP-FRONT',
        buildResultKey: 'WEBAPP-FRONT-101',
        link: { href: `${BASE_URL}/rest/api/latest/result/WEBAPP-FRONT-101` },
      },
      {
        triggerReason: 'Scheduled build',
        buildNumber: 26,
        planKey: 'MOBILE-IOS',
        buildResultKey: 'MOBILE-IOS-26',
        link: { href: `${BASE_URL}/rest/api/latest/result/MOBILE-IOS-26` },
      },
    ],
  },
};

export const deploymentQueueWithDeployments: BambooDeploymentQueue = {
  queuedDeployments: {
    size: 2,
    'start-index': 0,
    'max-result': 25,
    queuedDeployment: [
      {
        deploymentResultId: 12345,
        deploymentVersionName: 'release-2.1.0-build-42',
        environmentId: 100,
        environmentName: 'Staging',
      },
      {
        deploymentResultId: 12346,
        deploymentVersionName: 'release-2.0.5-build-38',
        environmentId: 200,
        environmentName: 'Production',
      },
    ],
  },
};
