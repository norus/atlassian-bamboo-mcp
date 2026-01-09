// Bamboo API Response Types

export interface BambooServerInfo {
  version: string;
  edition: string;
  buildDate: string;
  buildNumber: string;
  state: string;
}

export interface BambooHealthCheck {
  status: string;
  checks?: Record<string, { status: string; message?: string }>;
}

export interface BambooProject {
  key: string;
  name: string;
  description?: string;
  link: {
    href: string;
    rel: string;
  };
}

export interface BambooProjectList {
  projects: {
    size: number;
    'start-index': number;
    'max-result': number;
    project: BambooProject[];
  };
}

export interface BambooPlan {
  key: string;
  name: string;
  shortName: string;
  shortKey: string;
  type: string;
  enabled: boolean;
  link: {
    href: string;
    rel: string;
  };
  projectKey?: string;
  projectName?: string;
  description?: string;
  isBuilding?: boolean;
  isActive?: boolean;
  averageBuildTimeInSeconds?: number;
}

export interface BambooPlanList {
  plans: {
    size: number;
    'start-index': number;
    'max-result': number;
    plan: BambooPlan[];
  };
}

export interface BambooPlanBranch {
  key: string;
  name: string;
  shortName: string;
  shortKey: string;
  enabled: boolean;
  link: {
    href: string;
    rel: string;
  };
}

export interface BambooPlanBranchList {
  branches: {
    size: number;
    'start-index': number;
    'max-result': number;
    branch: BambooPlanBranch[];
  };
}

export interface BambooBuildResult {
  key: string;
  buildNumber: number;
  buildState: string;
  buildResultKey: string;
  lifeCycleState: string;
  state: string;
  successful: boolean;
  finished: boolean;
  buildStartedTime?: string;
  buildCompletedTime?: string;
  buildDurationInSeconds?: number;
  buildRelativeTime?: string;
  buildReason?: string;
  reasonSummary?: string;
  link: {
    href: string;
    rel: string;
  };
  plan?: {
    key: string;
    name: string;
    shortName: string;
  };
  vcsRevisionKey?: string;
  changes?: {
    size: number;
    change?: Array<{
      changesetId: string;
      author: string;
      date: string;
      comment: string;
    }>;
  };
  artifacts?: {
    size: number;
    artifact?: Array<{
      name: string;
      link: { href: string };
    }>;
  };
  testResults?: {
    all: number;
    successful: number;
    failed: number;
    skipped: number;
    quarantined: number;
  };
}

export interface BambooBuildResultList {
  results: {
    size: number;
    'start-index': number;
    'max-result': number;
    result: BambooBuildResult[];
  };
}

export interface BambooBuildQueue {
  queuedBuilds: {
    size: number;
    'start-index': number;
    'max-result': number;
    queuedBuild?: Array<{
      triggerReason: string;
      buildNumber: number;
      planKey: string;
      buildResultKey: string;
      link: { href: string };
    }>;
  };
}

export interface BambooDeploymentQueue {
  queuedDeployments: {
    size: number;
    'start-index': number;
    'max-result': number;
    queuedDeployment?: Array<{
      deploymentResultId: number;
      deploymentVersionName: string;
      environmentId: number;
      environmentName: string;
    }>;
  };
}

export interface BambooDeploymentProject {
  id: number;
  oid: string;
  key: {
    key: string;
  };
  name: string;
  description?: string;
  planKey: {
    key: string;
  };
  environments: Array<{
    id: number;
    key: { key: string };
    name: string;
    description?: string;
    deploymentProjectId: number;
  }>;
}

export interface BambooDeploymentProjectList {
  size: number;
  'start-index': number;
  'max-result': number;
  deploymentProject?: BambooDeploymentProject[];
}

export interface BambooDeploymentResult {
  deploymentVersion: {
    id: number;
    name: string;
    creationDate: string;
  };
  deploymentVersionName: string;
  id: number;
  deploymentState: string;
  lifeCycleState: string;
  startedDate?: string;
  finishedDate?: string;
  reasonSummary?: string;
  key: {
    key: string;
  };
  environment?: {
    id: number;
    key: { key: string };
    name: string;
  };
}

export interface BambooDeploymentResultList {
  results: {
    size: number;
    'start-index': number;
    'max-result': number;
    result: BambooDeploymentResult[];
  };
}

export interface BambooTriggerResponse {
  buildNumber: number;
  buildResultKey: string;
  planKey: string;
  link: {
    href: string;
    rel: string;
  };
  triggerReason?: string;
}

// Client configuration
export interface BambooClientConfig {
  baseUrl: string;
  token: string;
  proxyUrl?: string;
}
