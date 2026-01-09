// Project fixtures for Bamboo MCP tests

import type { BambooProject, BambooProjectList } from '../../../src/types.js';
import { BASE_URL } from './server.fixtures.js';

export const projectWebApp: BambooProject = {
  key: 'WEBAPP',
  name: 'Web Application',
  description: 'Main web application project',
  link: {
    href: `${BASE_URL}/rest/api/latest/project/WEBAPP`,
    rel: 'self',
  },
};

const projectMobileApp: BambooProject = {
  key: 'MOBILE',
  name: 'Mobile Application',
  description: 'iOS and Android mobile apps',
  link: {
    href: `${BASE_URL}/rest/api/latest/project/MOBILE`,
    rel: 'self',
  },
};

const projectInfra: BambooProject = {
  key: 'INFRA',
  name: 'Infrastructure',
  description: 'Infrastructure as Code and DevOps tooling',
  link: {
    href: `${BASE_URL}/rest/api/latest/project/INFRA`,
    rel: 'self',
  },
};

const projectNoDescription: BambooProject = {
  key: 'LEGACY',
  name: 'Legacy System',
  link: {
    href: `${BASE_URL}/rest/api/latest/project/LEGACY`,
    rel: 'self',
  },
};

export const projectList: BambooProjectList = {
  projects: {
    size: 4,
    'start-index': 0,
    'max-result': 25,
    project: [projectWebApp, projectMobileApp, projectInfra, projectNoDescription],
  },
};
