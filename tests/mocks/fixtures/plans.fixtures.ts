// Plan fixtures for Bamboo MCP tests

import type { BambooPlan, BambooPlanList } from '../../../src/types.js';
import { BASE_URL } from './server.fixtures.js';

export const planBackendBuild: BambooPlan = {
  key: 'WEBAPP-BACK',
  name: 'Web Application - Backend Build',
  shortName: 'Backend Build',
  shortKey: 'BACK',
  type: 'chain',
  enabled: true,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/WEBAPP-BACK`,
    rel: 'self',
  },
  projectKey: 'WEBAPP',
  projectName: 'Web Application',
  description: 'Build and test backend services',
  isBuilding: false,
  isActive: true,
  averageBuildTimeInSeconds: 180,
};

const planFrontendBuild: BambooPlan = {
  key: 'WEBAPP-FRONT',
  name: 'Web Application - Frontend Build',
  shortName: 'Frontend Build',
  shortKey: 'FRONT',
  type: 'chain',
  enabled: true,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/WEBAPP-FRONT`,
    rel: 'self',
  },
  projectKey: 'WEBAPP',
  projectName: 'Web Application',
  description: 'Build and test frontend application',
  isBuilding: true,
  isActive: true,
  averageBuildTimeInSeconds: 240,
};

const planMobileIOS: BambooPlan = {
  key: 'MOBILE-IOS',
  name: 'Mobile Application - iOS Build',
  shortName: 'iOS Build',
  shortKey: 'IOS',
  type: 'chain',
  enabled: true,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/MOBILE-IOS`,
    rel: 'self',
  },
  projectKey: 'MOBILE',
  projectName: 'Mobile Application',
  description: 'Build and test iOS app',
  isBuilding: false,
  isActive: true,
  averageBuildTimeInSeconds: 600,
};

const planDisabled: BambooPlan = {
  key: 'LEGACY-OLD',
  name: 'Legacy System - Old Build',
  shortName: 'Old Build',
  shortKey: 'OLD',
  type: 'chain',
  enabled: false,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/LEGACY-OLD`,
    rel: 'self',
  },
  projectKey: 'LEGACY',
  projectName: 'Legacy System',
  isBuilding: false,
  isActive: false,
};

const planMinimal: BambooPlan = {
  key: 'INFRA-DEPLOY',
  name: 'Infrastructure - Deploy',
  shortName: 'Deploy',
  shortKey: 'DEPLOY',
  type: 'chain',
  enabled: true,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/INFRA-DEPLOY`,
    rel: 'self',
  },
};

export const planList: BambooPlanList = {
  plans: {
    size: 5,
    'start-index': 0,
    'max-result': 25,
    plan: [planBackendBuild, planFrontendBuild, planMobileIOS, planDisabled, planMinimal],
  },
};

export const planSearchResults: BambooPlanList = {
  plans: {
    size: 2,
    'start-index': 0,
    'max-result': 25,
    plan: [planBackendBuild, planFrontendBuild],
  },
};

export const planSearchResultsEmpty: BambooPlanList = {
  plans: {
    size: 0,
    'start-index': 0,
    'max-result': 25,
    plan: [],
  },
};
