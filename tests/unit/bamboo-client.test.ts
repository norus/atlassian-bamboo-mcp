import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { BambooClient, createBambooClientFromEnv } from '../../src/bamboo-client.js';

const BASE_URL = 'https://bamboo.example.com';

// Mock undici module
vi.mock('undici', () => {
  // Create a mock class for ProxyAgent
  const MockProxyAgent = vi.fn(function(this: object) {
    return this;
  });
  return {
    ProxyAgent: MockProxyAgent,
    fetch: vi.fn(),
  };
});

// Import the mocked fetch
import { fetch as mockFetch } from 'undici';

// Helper to create mock Response
function createMockResponse(body: unknown, status = 200): Response {
  const responseBody = body === null ? '' : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: vi.fn().mockResolvedValue(responseBody),
  } as unknown as Response;
}

describe('BambooClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // 1. Constructor tests
  // ============================================================================
  describe('constructor', () => {
    it('should create client with required config', () => {
      const client = new BambooClient({
        baseUrl: BASE_URL,
        token: 'test-token',
      });
      expect(client).toBeInstanceOf(BambooClient);
    });

    it('should strip trailing slash from baseUrl', async () => {
      const client = new BambooClient({
        baseUrl: `${BASE_URL}/`,
        token: 'test-token',
      });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({ version: '9.2.1' }));

      await client.getServerInfo();

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/rest/api/latest/info`,
        expect.any(Object)
      );
    });

    it('should configure proxy when proxyUrl provided', () => {
      const client = new BambooClient({
        baseUrl: BASE_URL,
        token: 'test-token',
        proxyUrl: 'http://proxy.example.com:8080',
      });
      expect(client).toBeInstanceOf(BambooClient);
    });
  });

  // ============================================================================
  // 2. Server endpoints
  // ============================================================================
  describe('getServerInfo()', () => {
    it('should return server info on success', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        version: '9.2.1',
        edition: 'Enterprise',
        buildDate: '2024-01-15',
        buildNumber: '92100',
        state: 'RUNNING',
      }));

      const result = await client.getServerInfo();
      expect(result).toEqual({
        version: '9.2.1',
        edition: 'Enterprise',
        buildDate: '2024-01-15',
        buildNumber: '92100',
        state: 'RUNNING',
      });
    });

    it('should throw error on failure', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse('Internal Server Error', 500));

      await expect(client.getServerInfo()).rejects.toThrow('Bamboo API error (500)');
    });
  });

  describe('healthCheck()', () => {
    it('should return health status on success', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        status: 'OK',
        checks: {
          database: { status: 'OK' },
          index: { status: 'OK' },
        },
      }));

      const result = await client.healthCheck();
      expect(result).toEqual({
        status: 'OK',
        checks: {
          database: { status: 'OK' },
          index: { status: 'OK' },
        },
      });
    });

    it('should throw error on failure', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse('Service Unavailable', 503));

      await expect(client.healthCheck()).rejects.toThrow('Bamboo API error (503)');
    });
  });

  // ============================================================================
  // 3. Project endpoints
  // ============================================================================
  describe('listProjects()', () => {
    it('should list projects with no params', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        projects: {
          size: 2,
          'start-index': 0,
          'max-result': 25,
          project: [
            { key: 'PROJ1', name: 'Project One' },
            { key: 'PROJ2', name: 'Project Two' },
          ],
        },
      }));

      const result = await client.listProjects() as { projects: { project: unknown[] } };
      expect(result.projects.project).toHaveLength(2);
    });

    it('should list projects with pagination', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        projects: {
          size: 5,
          'start-index': 10,
          'max-result': 5,
          project: [{ key: 'PROJ3', name: 'Project Three' }],
        },
      }));

      await client.listProjects({ startIndex: 10, maxResults: 5 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('start-index=10'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('max-result=5'),
        expect.any(Object)
      );
    });

    it('should list projects with expand parameter', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        projects: {
          size: 1,
          project: [
            {
              key: 'PROJ1',
              name: 'Project One',
              plans: { plan: [{ key: 'PROJ1-PLAN1' }] },
            },
          ],
        },
      }));

      await client.listProjects({ expand: 'projects.project.plans' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('expand=projects.project.plans'),
        expect.any(Object)
      );
    });
  });

  describe('getProject()', () => {
    it('should get project by key', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'MYPROJ',
        name: 'My Project',
        description: 'A test project',
      }));

      const result = await client.getProject('MYPROJ') as { key: string; name: string };
      expect(result.key).toBe('MYPROJ');
      expect(result.name).toBe('My Project');

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/rest/api/latest/project/MYPROJ`,
        expect.any(Object)
      );
    });

    it('should get project with expand parameter', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'MYPROJ',
        name: 'My Project',
        plans: { plan: [{ key: 'MYPROJ-PLAN1' }] },
      }));

      await client.getProject('MYPROJ', 'plans');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('expand=plans'),
        expect.any(Object)
      );
    });
  });

  // ============================================================================
  // 4. Plan endpoints
  // ============================================================================
  describe('listPlans()', () => {
    it('should list plans with no params', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        plans: {
          size: 2,
          'start-index': 0,
          'max-result': 25,
          plan: [
            { key: 'PROJ-PLAN1', name: 'Plan One', enabled: true },
            { key: 'PROJ-PLAN2', name: 'Plan Two', enabled: false },
          ],
        },
      }));

      const result = await client.listPlans() as { plans: { plan: unknown[] } };
      expect(result.plans.plan).toHaveLength(2);
    });

    it('should list plans with pagination', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        plans: {
          size: 10,
          'start-index': 5,
          'max-result': 10,
          plan: [],
        },
      }));

      await client.listPlans({ startIndex: 5, maxResults: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('start-index=5'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('max-result=10'),
        expect.any(Object)
      );
    });
  });

  describe('getPlan()', () => {
    it('should get plan by valid key', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1',
        name: 'Plan One',
        enabled: true,
        isBuilding: false,
      }));

      const result = await client.getPlan('PROJ-PLAN1') as { key: string };
      expect(result.key).toBe('PROJ-PLAN1');
    });

    it('should throw error for invalid key (404)', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse('Plan not found', 404));

      await expect(client.getPlan('INVALID-KEY')).rejects.toThrow('Bamboo API error (404)');
    });
  });

  describe('searchPlans()', () => {
    it('should search plans with basic query', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        size: 1,
        searchResults: [{ id: 'PROJ-PLAN1' }],
      }));

      const result = await client.searchPlans('my-plan') as { size: number };
      expect(result.size).toBe(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('searchTerm=my-plan'),
        expect.any(Object)
      );
    });

    it('should search plans with fuzzy matching', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        size: 3,
        searchResults: [],
      }));

      await client.searchPlans('plan', { fuzzy: true });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('fuzzy=true'),
        expect.any(Object)
      );
    });

    it('should search plans with pagination', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        size: 10,
        searchResults: [],
      }));

      await client.searchPlans('plan', { startIndex: 20, maxResults: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('start-index=20'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('max-result=10'),
        expect.any(Object)
      );
    });
  });

  describe('enablePlan()', () => {
    it('should enable a plan successfully', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse(null));

      const result = await client.enablePlan('PROJ-PLAN1');
      expect(result).toEqual({});

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/rest/api/latest/plan/PROJ-PLAN1/enable`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('disablePlan()', () => {
    it('should disable a plan successfully', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse(null));

      const result = await client.disablePlan('PROJ-PLAN1');
      expect(result).toEqual({});

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/rest/api/latest/plan/PROJ-PLAN1/enable`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // ============================================================================
  // 5. Branch endpoints
  // ============================================================================
  describe('listPlanBranches()', () => {
    it('should list all branches for a plan', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        branches: {
          size: 3,
          branch: [
            { key: 'PROJ-PLAN1-1', name: 'feature-a', enabled: true },
            { key: 'PROJ-PLAN1-2', name: 'feature-b', enabled: false },
            { key: 'PROJ-PLAN1-3', name: 'develop', enabled: true },
          ],
        },
      }));

      const result = await client.listPlanBranches('PROJ-PLAN1') as { branches: { branch: unknown[] } };
      expect(result.branches.branch).toHaveLength(3);
    });

    it('should list enabled branches only', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        branches: {
          size: 2,
          branch: [
            { key: 'PROJ-PLAN1-1', name: 'feature-a', enabled: true },
            { key: 'PROJ-PLAN1-3', name: 'develop', enabled: true },
          ],
        },
      }));

      const result = await client.listPlanBranches('PROJ-PLAN1', { enabledOnly: true }) as { branches: { branch: unknown[] } };
      expect(result.branches.branch).toHaveLength(2);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('enabledOnly=true'),
        expect.any(Object)
      );
    });
  });

  describe('getPlanBranch()', () => {
    it('should get a valid branch', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-1',
        name: 'develop',
        enabled: true,
      }));

      const result = await client.getPlanBranch('PROJ-PLAN1', 'develop') as { name: string };
      expect(result.name).toBe('develop');
    });

    it('should handle URL encoding for branch names with special characters', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-1',
        name: 'feature/my-feature',
        enabled: true,
      }));

      const result = await client.getPlanBranch('PROJ-PLAN1', 'feature/my-feature') as { name: string };
      expect(result.name).toBe('feature/my-feature');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('feature%2Fmy-feature'),
        expect.any(Object)
      );
    });
  });

  // ============================================================================
  // 6. Build endpoints
  // ============================================================================
  describe('triggerBuild()', () => {
    it('should trigger a basic build', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        buildNumber: 42,
        buildResultKey: 'PROJ-PLAN1-42',
        planKey: 'PROJ-PLAN1',
      }));

      const result = await client.triggerBuild('PROJ-PLAN1') as { buildNumber: number };
      expect(result.buildNumber).toBe(42);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/queue/PROJ-PLAN1'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should trigger a build with variables', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        buildNumber: 43,
        buildResultKey: 'PROJ-PLAN1-43',
      }));

      await client.triggerBuild('PROJ-PLAN1', {
        variables: { ENV: 'staging', DEBUG: 'true' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('bamboo.variable.ENV=staging'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('bamboo.variable.DEBUG=true'),
        expect.any(Object)
      );
    });

    it('should trigger a build with stage parameter', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        buildNumber: 44,
        buildResultKey: 'PROJ-PLAN1-44',
      }));

      await client.triggerBuild('PROJ-PLAN1', { stage: 'Build Stage' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('stage=Build'),
        expect.any(Object)
      );
    });

    it('should trigger a build with custom revision', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        buildNumber: 45,
        buildResultKey: 'PROJ-PLAN1-45',
      }));

      await client.triggerBuild('PROJ-PLAN1', { customRevision: 'abc123def' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('customRevision=abc123def'),
        expect.any(Object)
      );
    });
  });

  describe('stopBuild()', () => {
    it('should stop a running build', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      // Mock getPlan - isBuilding: true
      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1',
        isBuilding: true,
      }));

      // Mock listBuildResults to find in-progress build
      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        results: {
          result: [
            { key: 'PROJ-PLAN1-42', lifeCycleState: 'InProgress' },
          ],
        },
      }));

      // Mock getBuildResult with stages
      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-42',
        lifeCycleState: 'InProgress',
        stages: {
          stage: [
            {
              results: {
                result: [
                  { key: 'PROJ-PLAN1-JOB1-42', lifeCycleState: 'InProgress' },
                ],
              },
            },
          ],
        },
      }));

      // Mock delete queue (stop job)
      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse(null));

      const result = await client.stopBuild('PROJ-PLAN1') as { success: boolean; stoppedJobs: string[] };
      expect(result.success).toBe(true);
      expect(result.stoppedJobs).toContain('PROJ-PLAN1-JOB1-42');
    });

    it('should handle plan not currently building', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1',
        isBuilding: false,
      }));

      const result = await client.stopBuild('PROJ-PLAN1') as { success: boolean; message: string };
      expect(result.success).toBe(false);
      expect(result.message).toContain('not currently building');
    });
  });

  describe('getBuildResult()', () => {
    it('should get build result on success', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-42',
        buildNumber: 42,
        buildState: 'Successful',
        lifeCycleState: 'Finished',
        successful: true,
      }));

      const result = await client.getBuildResult('PROJ-PLAN1-42') as { buildState: string };
      expect(result.buildState).toBe('Successful');
    });

    it('should get build result with expand parameter', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-42',
        changes: { size: 2 },
        artifacts: { size: 1 },
        testResults: { all: 10, successful: 10, failed: 0 },
      }));

      const result = await client.getBuildResult('PROJ-PLAN1-42', 'changes,artifacts,testResults');
      expect(result).toBeDefined();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('expand=changes%2Cartifacts%2CtestResults'),
        expect.any(Object)
      );
    });
  });

  describe('getLatestBuildResult()', () => {
    it('should get latest build result on success', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-99',
        buildNumber: 99,
        buildState: 'Successful',
        lifeCycleState: 'Finished',
      }));

      const result = await client.getLatestBuildResult('PROJ-PLAN1') as { buildNumber: number };
      expect(result.buildNumber).toBe(99);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/result/PROJ-PLAN1/latest'),
        expect.any(Object)
      );
    });
  });

  describe('listBuildResults()', () => {
    it('should list build results with no filter', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        results: {
          size: 5,
          result: [
            { key: 'PROJ-PLAN1-42', buildState: 'Successful' },
            { key: 'PROJ-PLAN1-41', buildState: 'Failed' },
          ],
        },
      }));

      const result = await client.listBuildResults() as { results: { size: number } };
      expect(result.results.size).toBe(5);

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/rest/api/latest/result`,
        expect.any(Object)
      );
    });

    it('should list build results with filters', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        results: {
          size: 2,
          result: [
            { key: 'PROJ-PLAN1-40', buildState: 'Failed' },
            { key: 'PROJ-PLAN1-38', buildState: 'Failed' },
          ],
        },
      }));

      await client.listBuildResults({
        projectKey: 'PROJ',
        planKey: 'PLAN1',
        buildState: 'Failed',
        includeAllStates: true,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/result/PROJ-PLAN1'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('buildstate=Failed'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('includeAllStates=true'),
        expect.any(Object)
      );
    });
  });

  describe('getBuildLogs()', () => {
    it('should get build logs at plan level', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-42',
        stages: {
          stage: [
            {
              results: {
                result: [
                  {
                    key: 'PROJ-PLAN1-JOB1-42',
                    logFiles: ['https://bamboo.example.com/logs/build.log'],
                  },
                ],
              },
            },
          ],
        },
      }));

      const result = await client.getBuildLogs('PROJ-PLAN1-42') as { jobs: Array<{ logFiles: string[] }> };
      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].logFiles).toContain('https://bamboo.example.com/logs/build.log');
    });

    it('should get build logs at job level', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-JOB1-42',
        logFiles: [
          'https://bamboo.example.com/logs/job1-build.log',
          'https://bamboo.example.com/logs/job1-test.log',
        ],
      }));

      const result = await client.getBuildLogs('PROJ-PLAN1-42', 'JOB1') as { logFiles: string[] };
      expect(result.logFiles).toHaveLength(2);
    });
  });

  describe('getBuildResultWithLogs()', () => {
    it('should get job result with logs', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-JOB1-42',
        buildState: 'Successful',
        lifeCycleState: 'Finished',
        logEntries: {
          size: 50,
          'start-index': 0,
          'max-result': 1000,
          logEntry: [
            {
              log: 'Build started',
              unstyledLog: 'Build started',
              date: 1704067200000,
              formattedDate: '2024-01-01 00:00:00',
            },
            {
              log: 'Build completed',
              unstyledLog: 'Build completed',
              date: 1704067260000,
              formattedDate: '2024-01-01 00:01:00',
            },
          ],
        },
      }));

      const result = await client.getBuildResultWithLogs('PROJ-PLAN1-JOB1-42') as {
        logEntries: { logEntry: unknown[] }
      };
      expect(result.logEntries.logEntry).toHaveLength(2);
    });

    it('should get plan result with aggregated logs from all jobs', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      // First call - plan result with stages
      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-42',
        buildState: 'Successful',
        lifeCycleState: 'Finished',
        logEntries: {
          size: 0,
          logEntry: [],
        },
        stages: {
          stage: [
            {
              name: 'Default Stage',
              results: {
                result: [
                  { key: 'PROJ-PLAN1-JOB1-42', buildState: 'Successful' },
                  { key: 'PROJ-PLAN1-JOB2-42', buildState: 'Successful' },
                ],
              },
            },
          ],
        },
      }));

      // Second call - job 1 logs
      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-JOB1-42',
        buildState: 'Successful',
        logEntries: {
          size: 10,
          logEntry: [
            { log: 'Job 1 log', unstyledLog: 'Job 1 log', formattedDate: '2024-01-01 00:00:00' },
          ],
        },
      }));

      // Third call - job 2 logs
      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        key: 'PROJ-PLAN1-JOB2-42',
        buildState: 'Successful',
        logEntries: {
          size: 15,
          logEntry: [
            { log: 'Job 2 log', unstyledLog: 'Job 2 log', formattedDate: '2024-01-01 00:01:00' },
          ],
        },
      }));

      const result = await client.getBuildResultWithLogs('PROJ-PLAN1-42') as {
        isJobResult: boolean;
        jobs: Array<{ jobKey: string }>;
        totalLogEntries: number;
      };
      expect(result.isJobResult).toBe(false);
      expect(result.jobs).toHaveLength(2);
      expect(result.totalLogEntries).toBe(25);
    });
  });

  // ============================================================================
  // 7. Queue endpoints
  // ============================================================================
  describe('getBuildQueue()', () => {
    it('should get build queue with default expand', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        queuedBuilds: {
          size: 2,
          queuedBuild: [
            { planKey: 'PROJ-PLAN1', buildNumber: 50 },
            { planKey: 'PROJ-PLAN2', buildNumber: 30 },
          ],
        },
      }));

      const result = await client.getBuildQueue() as { queuedBuilds: { size: number } };
      expect(result.queuedBuilds.size).toBe(2);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('expand=queuedBuilds'),
        expect.any(Object)
      );
    });

    it('should get build queue with custom expand', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        queuedBuilds: {
          size: 1,
          queuedBuild: [{ planKey: 'PROJ-PLAN1', buildNumber: 50, triggerReason: 'Manual' }],
        },
      }));

      await client.getBuildQueue('queuedBuilds.queuedBuild');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('expand=queuedBuilds.queuedBuild'),
        expect.any(Object)
      );
    });
  });

  describe('getDeploymentQueue()', () => {
    it('should get deployment queue when available', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        queuedDeployments: {
          size: 1,
          queuedDeployment: [
            { deploymentResultId: 5001, environmentName: 'Production' },
          ],
        },
      }));

      const result = await client.getDeploymentQueue() as { queuedDeployments: { size: number } };
      expect(result.queuedDeployments.size).toBe(1);
    });

    it('should handle deployment queue not available (404)', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse('Not Found', 404));

      const result = await client.getDeploymentQueue() as { available: boolean; message: string };
      expect(result.available).toBe(false);
      expect(result.message).toContain('not available');
    });
  });

  // ============================================================================
  // 8. Deployment endpoints
  // ============================================================================
  describe('listDeploymentProjects()', () => {
    it('should list deployment projects', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse([
        { id: 1001, name: 'Deploy Project 1' },
        { id: 1002, name: 'Deploy Project 2' },
      ]));

      const result = await client.listDeploymentProjects() as unknown[];
      expect(result).toHaveLength(2);

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/rest/api/latest/deploy/project/all`,
        expect.any(Object)
      );
    });
  });

  describe('getDeploymentProject()', () => {
    it('should get deployment project by string ID', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        id: 1001,
        name: 'Deploy Project 1',
        environments: [{ id: 2001, name: 'Development' }],
      }));

      const result = await client.getDeploymentProject('1001') as { id: number };
      expect(result.id).toBe(1001);

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/rest/api/latest/deploy/project/1001`,
        expect.any(Object)
      );
    });

    it('should get deployment project by numeric ID', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        id: 1002,
        name: 'Deploy Project 2',
      }));

      const result = await client.getDeploymentProject(1002) as { id: number };
      expect(result.id).toBe(1002);

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/rest/api/latest/deploy/project/1002`,
        expect.any(Object)
      );
    });
  });

  describe('triggerDeployment()', () => {
    it('should trigger a deployment', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        deploymentResultId: 5001,
      }));

      const result = await client.triggerDeployment('3001', '2001') as { deploymentResultId: number };
      expect(result.deploymentResultId).toBe(5001);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('versionId=3001'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('environmentId=2001'),
        expect.any(Object)
      );
    });
  });

  describe('getDeploymentResults()', () => {
    it('should get deployment results with pagination', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        results: {
          size: 10,
          'start-index': 0,
          'max-result': 10,
          result: [
            { id: 5001, deploymentState: 'SUCCESS' },
            { id: 5000, deploymentState: 'FAILED' },
          ],
        },
      }));

      const result = await client.getDeploymentResults('2001', { startIndex: 0, maxResults: 10 }) as {
        results: { result: unknown[] };
      };
      expect(result.results.result).toHaveLength(2);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/deploy/environment/2001/results'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('start-index=0'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('max-result=10'),
        expect.any(Object)
      );
    });
  });

  describe('getDeploymentResult()', () => {
    it('should get deployment result without logs', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        id: 5001,
        deploymentState: 'SUCCESS',
        lifeCycleState: 'FINISHED',
        deploymentVersionName: 'release-1.0.0',
      }));

      const result = await client.getDeploymentResult('5001') as { deploymentState: string };
      expect(result.deploymentState).toBe('SUCCESS');

      expect(mockFetch).toHaveBeenCalledWith(
        `${BASE_URL}/rest/api/latest/deploy/result/5001`,
        expect.any(Object)
      );
    });

    it('should get deployment result with logs', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse({
        id: 5001,
        deploymentState: 'SUCCESS',
        logEntries: [
          { log: 'Deployment started', formattedDate: '2024-01-01 00:00:00' },
          { log: 'Deployment completed', formattedDate: '2024-01-01 00:05:00' },
        ],
      }));

      const result = await client.getDeploymentResult('5001', {
        includeLogs: true,
        maxLogLines: 500,
      }) as { logEntries: unknown[] };
      expect(result.logEntries).toHaveLength(2);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('includeLogs=true'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('max-result=500'),
        expect.any(Object)
      );
    });
  });

  // ============================================================================
  // 9. Error handling
  // ============================================================================
  describe('error handling', () => {
    it('should throw error on non-200 response', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse('Forbidden', 403));

      await expect(client.getServerInfo()).rejects.toThrow('Bamboo API error (403)');
    });

    it('should handle empty response body', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockResolvedValueOnce(createMockResponse(null));

      const result = await client.enablePlan('PROJ-PLAN1');
      expect(result).toEqual({});
    });

    it('should handle network errors', async () => {
      const client = new BambooClient({ baseUrl: BASE_URL, token: 'test-token' });

      (mockFetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getServerInfo()).rejects.toThrow('Network error');
    });
  });

  // ============================================================================
  // 10. createBambooClientFromEnv()
  // ============================================================================
  describe('createBambooClientFromEnv()', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create client from env vars', () => {
      process.env.BAMBOO_URL = 'https://bamboo.test.com';
      process.env.BAMBOO_TOKEN = 'test-token-123';

      const client = createBambooClientFromEnv();
      expect(client).toBeInstanceOf(BambooClient);
    });

    it('should throw error when BAMBOO_URL is missing', () => {
      delete process.env.BAMBOO_URL;
      process.env.BAMBOO_TOKEN = 'test-token';

      expect(() => createBambooClientFromEnv()).toThrow('BAMBOO_URL environment variable is required');
    });

    it('should throw error when BAMBOO_TOKEN is missing', () => {
      process.env.BAMBOO_URL = 'https://bamboo.test.com';
      delete process.env.BAMBOO_TOKEN;

      expect(() => createBambooClientFromEnv()).toThrow('BAMBOO_TOKEN environment variable is required');
    });

    it('should handle BAMBOO_PROXY as optional', () => {
      process.env.BAMBOO_URL = 'https://bamboo.test.com';
      process.env.BAMBOO_TOKEN = 'test-token-123';
      process.env.BAMBOO_PROXY = 'http://proxy.test.com:8080';

      const client = createBambooClientFromEnv();
      expect(client).toBeInstanceOf(BambooClient);
    });
  });
});
