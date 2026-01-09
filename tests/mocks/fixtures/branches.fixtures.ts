// Branch fixtures for Bamboo MCP tests

import type { BambooPlanBranch, BambooPlanBranchList } from '../../../src/types.js';
import { BASE_URL } from './server.fixtures.js';

export const branchMain: BambooPlanBranch = {
  key: 'WEBAPP-BACK0',
  name: 'main',
  shortName: 'main',
  shortKey: 'BACK0',
  enabled: true,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/WEBAPP-BACK0`,
    rel: 'self',
  },
};

const branchDevelop: BambooPlanBranch = {
  key: 'WEBAPP-BACK1',
  name: 'develop',
  shortName: 'develop',
  shortKey: 'BACK1',
  enabled: true,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/WEBAPP-BACK1`,
    rel: 'self',
  },
};

const branchFeature: BambooPlanBranch = {
  key: 'WEBAPP-BACK2',
  name: 'feature/user-authentication',
  shortName: 'feature/user-authentication',
  shortKey: 'BACK2',
  enabled: true,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/WEBAPP-BACK2`,
    rel: 'self',
  },
};

const branchRelease: BambooPlanBranch = {
  key: 'WEBAPP-BACK3',
  name: 'release/v2.0.0',
  shortName: 'release/v2.0.0',
  shortKey: 'BACK3',
  enabled: true,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/WEBAPP-BACK3`,
    rel: 'self',
  },
};

const branchDisabled: BambooPlanBranch = {
  key: 'WEBAPP-BACK4',
  name: 'feature/deprecated-feature',
  shortName: 'feature/deprecated-feature',
  shortKey: 'BACK4',
  enabled: false,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/WEBAPP-BACK4`,
    rel: 'self',
  },
};

const branchHotfix: BambooPlanBranch = {
  key: 'WEBAPP-BACK5',
  name: 'hotfix/critical-security-fix',
  shortName: 'hotfix/critical-security-fix',
  shortKey: 'BACK5',
  enabled: true,
  link: {
    href: `${BASE_URL}/rest/api/latest/plan/WEBAPP-BACK5`,
    rel: 'self',
  },
};

export const branchList: BambooPlanBranchList = {
  branches: {
    size: 6,
    'start-index': 0,
    'max-result': 25,
    branch: [branchMain, branchDevelop, branchFeature, branchRelease, branchDisabled, branchHotfix],
  },
};

export const branchListEnabledOnly: BambooPlanBranchList = {
  branches: {
    size: 5,
    'start-index': 0,
    'max-result': 25,
    branch: [branchMain, branchDevelop, branchFeature, branchRelease, branchHotfix],
  },
};
