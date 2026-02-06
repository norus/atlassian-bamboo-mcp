import { ProxyAgent, fetch as undiciFetch, type RequestInit } from 'undici';
import type { BambooClientConfig } from './types.js';

/**
 * Build a URL query string from optional parameters
 */
function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }
  return searchParams.toString();
}

/**
 * Append query string to endpoint if not empty
 */
function appendQuery(endpoint: string, query: string): string {
  return query ? `${endpoint}?${query}` : endpoint;
}

export class BambooClient {
  private baseUrl: string;
  private token: string;
  private proxyAgent?: ProxyAgent;

  constructor(config: BambooClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = config.token;

    if (config.proxyUrl) {
      this.proxyAgent = new ProxyAgent(config.proxyUrl);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/rest/api/latest${endpoint}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    const fetchOptions: RequestInit = {
      ...options,
      headers,
    };

    // Add proxy agent if configured
    if (this.proxyAgent) {
      fetchOptions.dispatcher = this.proxyAgent;
    }

    const response = await undiciFetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Bamboo API error (${response.status}): ${errorText}`);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  // Server endpoints
  async getServerInfo(): Promise<unknown> {
    return this.request('/info');
  }

  async healthCheck(): Promise<unknown> {
    return this.request('/server');
  }

  // Project endpoints
  async listProjects(params?: {
    expand?: string;
    startIndex?: number;
    maxResults?: number;
  }): Promise<unknown> {
    const query = buildQueryString({
      'expand': params?.expand,
      'start-index': params?.startIndex,
      'max-result': params?.maxResults,
    });
    return this.request(appendQuery('/project', query));
  }

  async getProject(projectKey: string, expand?: string): Promise<unknown> {
    const query = buildQueryString({ expand });
    return this.request(appendQuery(`/project/${projectKey}`, query));
  }

  // Plan endpoints
  async listPlans(params?: {
    expand?: string;
    startIndex?: number;
    maxResults?: number;
  }): Promise<unknown> {
    const query = buildQueryString({
      'expand': params?.expand,
      'start-index': params?.startIndex,
      'max-result': params?.maxResults,
    });
    return this.request(appendQuery('/plan', query));
  }

  async getPlan(planKey: string, expand?: string): Promise<unknown> {
    const query = buildQueryString({ expand });
    return this.request(appendQuery(`/plan/${planKey}`, query));
  }

  async searchPlans(name: string, params?: {
    fuzzy?: boolean;
    startIndex?: number;
    maxResults?: number;
  }): Promise<unknown> {
    const query = buildQueryString({
      'searchTerm': name,
      'fuzzy': params?.fuzzy,
      'start-index': params?.startIndex,
      'max-result': params?.maxResults,
    });
    return this.request(`/search/plans?${query}`);
  }

  async enablePlan(planKey: string): Promise<unknown> {
    return this.request(`/plan/${planKey}/enable`, { method: 'POST' });
  }

  async disablePlan(planKey: string): Promise<unknown> {
    return this.request(`/plan/${planKey}/enable`, { method: 'DELETE' });
  }

  async clonePlan(sourceKey: string, destKey: string): Promise<unknown> {
    return this.request(`/clone/${sourceKey}:${destKey}`, { method: 'PUT' });
  }

  // Branch endpoints
  async listPlanBranches(planKey: string, params?: {
    enabledOnly?: boolean;
    startIndex?: number;
    maxResults?: number;
  }): Promise<unknown> {
    const query = buildQueryString({
      'enabledOnly': params?.enabledOnly,
      'start-index': params?.startIndex,
      'max-result': params?.maxResults,
    });
    return this.request(appendQuery(`/plan/${planKey}/branch`, query));
  }

  async getPlanBranch(planKey: string, branchName: string): Promise<unknown> {
    return this.request(`/plan/${planKey}/branch/${encodeURIComponent(branchName)}`);
  }

  // Build endpoints
  async triggerBuild(planKey: string, params?: {
    stage?: string;
    executeAllStages?: boolean;
    customRevision?: string;
    variables?: Record<string, string>;
  }): Promise<unknown> {
    const queryParams: Record<string, string | boolean | undefined> = {
      'stage': params?.stage,
      'executeAllStages': params?.executeAllStages,
      'customRevision': params?.customRevision,
    };

    // Add bamboo variables with prefixed keys
    if (params?.variables) {
      for (const [key, value] of Object.entries(params.variables)) {
        queryParams[`bamboo.variable.${key}`] = value;
      }
    }

    const query = buildQueryString(queryParams);
    return this.request(appendQuery(`/queue/${planKey}`, query), { method: 'POST' });
  }

  async stopBuild(planKey: string): Promise<unknown> {
    // To stop a build, we need to DELETE the job keys (not the plan key)
    // First, check if the plan is currently building
    const plan = await this.request<{
      isBuilding: boolean;
    }>(`/plan/${planKey}`);

    if (!plan.isBuilding) {
      return {
        message: `Plan ${planKey} is not currently building`,
        success: false
      };
    }

    // Get the list of results including in-progress builds
    const results = await this.request<{
      results?: {
        result?: Array<{
          key: string;
          lifeCycleState: string;
        }>;
      };
    }>(`/result/${planKey}?includeAllStates=true&max-result=5`);

    // Find the in-progress build
    const runningBuild = results.results?.result?.find(r => r.lifeCycleState === 'InProgress');

    if (!runningBuild) {
      return {
        message: `No running build found for plan ${planKey}`,
        success: false
      };
    }

    // Get the running build with job details
    const buildResult = await this.request<{
      lifeCycleState: string;
      stages?: {
        stage?: Array<{
          results?: {
            result?: Array<{
              key: string;
              lifeCycleState: string;
            }>;
          };
        }>;
      };
    }>(`/result/${runningBuild.key}?expand=stages.stage.results.result`);

    // Find all jobs and stop them
    const stoppedJobs: string[] = [];
    const failedJobs: string[] = [];

    if (buildResult.stages?.stage) {
      for (const stage of buildResult.stages.stage) {
        if (stage.results?.result) {
          for (const job of stage.results.result) {
            if (job.lifeCycleState === 'InProgress' || job.lifeCycleState === 'Pending' || job.lifeCycleState === 'Queued') {
              try {
                await this.request(`/queue/${job.key}`, { method: 'DELETE' });
                stoppedJobs.push(job.key);
              } catch {
                failedJobs.push(job.key);
              }
            }
          }
        }
      }
    }

    return {
      message: stoppedJobs.length > 0
        ? `Stopped ${stoppedJobs.length} job(s) for build ${runningBuild.key}`
        : `No running jobs found to stop for build ${runningBuild.key}`,
      buildKey: runningBuild.key,
      stoppedJobs,
      failedJobs,
      success: stoppedJobs.length > 0
    };
  }

  async getBuildResult(buildKey: string, expand?: string): Promise<unknown> {
    const query = buildQueryString({ expand });
    return this.request(appendQuery(`/result/${buildKey}`, query));
  }

  async getLatestBuildResult(planKey: string, expand?: string): Promise<unknown> {
    const query = buildQueryString({ expand });
    return this.request(appendQuery(`/result/${planKey}/latest`, query));
  }

  async listBuildResults(params?: {
    projectKey?: string;
    planKey?: string;
    buildState?: string;
    startIndex?: number;
    maxResults?: number;
    expand?: string;
    includeAllStates?: boolean;
  }): Promise<unknown> {
    const query = buildQueryString({
      'buildstate': params?.buildState,
      'start-index': params?.startIndex,
      'max-result': params?.maxResults,
      'expand': params?.expand,
      'includeAllStates': params?.includeAllStates,
    });

    let endpoint = '/result';
    if (params?.projectKey && params?.planKey) {
      endpoint = `/result/${params.projectKey}-${params.planKey}`;
    } else if (params?.projectKey) {
      endpoint = `/result/${params.projectKey}`;
    }

    return this.request(appendQuery(endpoint, query));
  }

  async getBuildLogs(buildKey: string, jobKey?: string): Promise<unknown> {
    // Build logs are obtained by getting the job result with logFiles expand
    // The buildKey should be a job result key (e.g., PROJ-PLAN-JOB1-123)
    // If only a plan result key is provided (e.g., PROJ-PLAN-123), we need to find the job keys first

    if (jobKey) {
      // If job key provided, construct the full job result key
      const jobResultKey = `${buildKey.replace(/-\d+$/, '')}-${jobKey}-${buildKey.split('-').pop()}`;
      const result = await this.request<{ logFiles?: string[] }>(`/result/${jobResultKey}?expand=logFiles`);
      return {
        buildKey: jobResultKey,
        logFiles: result.logFiles || [],
        message: result.logFiles?.length
          ? 'Log files are available via the URLs below. These require browser authentication to download.'
          : 'No log files found for this build.'
      };
    }

    // Try to get the build result with stages to find job results
    const result = await this.request<{
      stages?: {
        stage?: Array<{
          results?: {
            result?: Array<{
              key: string;
              logFiles?: string[];
            }>;
          };
        }>;
      };
    }>(`/result/${buildKey}?expand=stages.stage.results.result`);

    // Extract log files from all jobs
    const allLogs: Array<{ jobKey: string; logFiles: string[] }> = [];

    if (result.stages?.stage) {
      for (const stage of result.stages.stage) {
        if (stage.results?.result) {
          for (const job of stage.results.result) {
            if (job.logFiles && job.logFiles.length > 0) {
              allLogs.push({
                jobKey: job.key,
                logFiles: job.logFiles
              });
            }
          }
        }
      }
    }

    return {
      buildKey,
      jobs: allLogs,
      message: allLogs.length
        ? 'Log files are available via the URLs below. These require browser authentication to download.'
        : 'No log files found for this build.'
    };
  }

  async getBuildResultWithLogs(buildKey: string, params?: {
    maxLogLines?: number;
  }): Promise<unknown> {
    // First, try to get the result with logEntries (works for job-level keys)
    const maxResult = params?.maxLogLines || 1000;

    const result = await this.request<{
      key: string;
      buildState: string;
      lifeCycleState: string;
      logEntries?: {
        size: number;
        'start-index': number;
        'max-result': number;
        logEntry?: Array<{
          log: string;
          unstyledLog: string;
          date: number;
          formattedDate: string;
        }>;
      };
      stages?: {
        stage?: Array<{
          name: string;
          results?: {
            result?: Array<{
              key: string;
              buildState: string;
            }>;
          };
        }>;
      };
    }>(`/result/${buildKey}?expand=logEntries,stages.stage.results.result&max-result=${maxResult}`);

    // If logEntries exists and has entries, this is a job result - return directly
    if (result.logEntries?.logEntry && result.logEntries.logEntry.length > 0) {
      return result;
    }

    // This is a plan result - fetch logs from all jobs
    const jobLogs: Array<{
      jobKey: string;
      jobName: string;
      buildState: string;
      logEntries: {
        size: number;
        logs: Array<{
          date: string;
          log: string;
        }>;
      };
    }> = [];

    if (result.stages?.stage) {
      for (const stage of result.stages.stage) {
        if (stage.results?.result) {
          for (const job of stage.results.result) {
            // Fetch logs for each job
            const jobResult = await this.request<{
              key: string;
              buildState: string;
              logEntries?: {
                size: number;
                'start-index': number;
                'max-result': number;
                logEntry?: Array<{
                  log: string;
                  unstyledLog: string;
                  date: number;
                  formattedDate: string;
                }>;
              };
            }>(`/result/${job.key}?expand=logEntries&max-result=${maxResult}`);

            jobLogs.push({
              jobKey: job.key,
              jobName: job.key.split('-').slice(-2, -1)[0], // Extract job name from key
              buildState: jobResult.buildState,
              logEntries: {
                size: jobResult.logEntries?.size || 0,
                logs: (jobResult.logEntries?.logEntry || []).map(entry => ({
                  date: entry.formattedDate,
                  log: entry.unstyledLog
                }))
              }
            });
          }
        }
      }
    }

    return {
      key: result.key,
      buildState: result.buildState,
      lifeCycleState: result.lifeCycleState,
      isJobResult: false,
      jobs: jobLogs,
      totalLogEntries: jobLogs.reduce((sum, job) => sum + job.logEntries.size, 0)
    };
  }

  // Queue endpoints
  async getBuildQueue(expand?: string): Promise<unknown> {
    const query = expand ? `?expand=${expand}` : '?expand=queuedBuilds';
    return this.request(`/queue${query}`);
  }

  async getDeploymentQueue(): Promise<unknown> {
    // Note: The deployment queue endpoint is not available in all Bamboo versions
    // We'll try to get it from the deployment dashboard instead
    try {
      // Try the standard endpoint first
      return await this.request('/deploy/queue?expand=queuedDeployments');
    } catch {
      // If that fails, return info about checking deployment results instead
      return {
        message: 'Deployment queue endpoint not available in this Bamboo version. Use bamboo_get_deployment_results to check deployment status for specific environments.',
        available: false
      };
    }
  }

  // Deployment endpoints
  async listDeploymentProjects(): Promise<unknown> {
    return this.request('/deploy/project/all');
  }

  async getDeploymentProject(projectId: string | number): Promise<unknown> {
    return this.request(`/deploy/project/${projectId}`);
  }

  async createDeploymentProject(
    name: string,
    planKey: string,
    description?: string
  ): Promise<unknown> {
    return this.request('/deploy/project', {
      method: 'PUT',
      body: JSON.stringify({
        name,
        planKey: { key: planKey },
        ...(description && { description }),
      }),
    });
  }

  async triggerDeployment(
    versionId: string | number,
    environmentId: string | number
  ): Promise<unknown> {
    return this.request(
      `/queue/deployment?versionId=${versionId}&environmentId=${environmentId}`,
      { method: 'POST' }
    );
  }

  async getDeploymentResults(environmentId: string | number, params?: {
    startIndex?: number;
    maxResults?: number;
  }): Promise<unknown> {
    const query = buildQueryString({
      'start-index': params?.startIndex,
      'max-result': params?.maxResults,
    });
    return this.request(appendQuery(`/deploy/environment/${environmentId}/results`, query));
  }

  async getDeploymentResult(deploymentResultId: string | number, params?: {
    includeLogs?: boolean;
    maxLogLines?: number;
  }): Promise<unknown> {
    const query = params?.includeLogs
      ? buildQueryString({
          'includeLogs': true,
          'max-result': params?.maxLogLines || 1000,
        })
      : '';
    return this.request(appendQuery(`/deploy/result/${deploymentResultId}`, query));
  }
}

// Factory function to create client from environment variables
export function createBambooClientFromEnv(): BambooClient {
  const baseUrl = process.env.BAMBOO_URL;
  const token = process.env.BAMBOO_TOKEN;
  const proxyUrl = process.env.BAMBOO_PROXY;

  if (!baseUrl) {
    throw new Error('BAMBOO_URL environment variable is required');
  }
  if (!token) {
    throw new Error('BAMBOO_TOKEN environment variable is required');
  }

  return new BambooClient({
    baseUrl,
    token,
    proxyUrl,
  });
}
