import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerQueueTools } from '../../../src/tools/queue.js';
import { createMockMcpServer, parseResultJson, type MockMcpServer } from '../../helpers/mock-mcp-server.js';
import type { BambooClient } from '../../../src/bamboo-client.js';

describe('queue tools', () => {
  let mockServer: MockMcpServer;
  let mockClient: Partial<BambooClient>;

  beforeEach(() => {
    mockServer = createMockMcpServer();
    mockClient = {
      getBuildQueue: vi.fn(),
      getDeploymentQueue: vi.fn(),
    };
    registerQueueTools(mockServer as unknown as Parameters<typeof registerQueueTools>[0], mockClient as BambooClient);
  });

  describe('bamboo_get_build_queue', () => {
    it('should register the tool', () => {
      const tool = mockServer.getTool('bamboo_get_build_queue');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_get_build_queue');
      expect(tool?.description).toBe('Get the current Bamboo build queue');
    });

    it('should get build queue with default expand', async () => {
      const mockQueue = {
        queuedBuilds: {
          size: 2,
          'start-index': 0,
          'max-result': 25,
          queuedBuild: [
            { triggerReason: 'Manual build by admin', buildNumber: 50, planKey: 'PROJ-PLAN1', buildResultKey: 'PROJ-PLAN1-50' },
            { triggerReason: 'Code change detected', buildNumber: 101, planKey: 'PROJ-PLAN2', buildResultKey: 'PROJ-PLAN2-101' },
          ],
        },
      };

      vi.mocked(mockClient.getBuildQueue!).mockResolvedValue(mockQueue);

      const result = await mockServer.invokeTool('bamboo_get_build_queue', {});

      expect(mockClient.getBuildQueue).toHaveBeenCalledWith(undefined);

      const parsed = parseResultJson<typeof mockQueue>(result);
      expect(parsed.queuedBuilds.size).toBe(2);
      expect(parsed.queuedBuilds.queuedBuild).toHaveLength(2);
    });

    it('should get build queue with custom expand parameter', async () => {
      const mockQueue = {
        queuedBuilds: {
          size: 1,
          'start-index': 0,
          'max-result': 25,
          queuedBuild: [
            { triggerReason: 'Scheduled build', buildNumber: 26, planKey: 'PROJ-PLAN3', buildResultKey: 'PROJ-PLAN3-26', plan: { name: 'Build Plan 3' } },
          ],
        },
      };

      vi.mocked(mockClient.getBuildQueue!).mockResolvedValue(mockQueue);

      const result = await mockServer.invokeTool('bamboo_get_build_queue', {
        expand: 'queuedBuilds.queuedBuild.plan',
      });

      expect(mockClient.getBuildQueue).toHaveBeenCalledWith('queuedBuilds.queuedBuild.plan');

      const parsed = parseResultJson<typeof mockQueue>(result);
      expect(parsed.queuedBuilds.queuedBuild[0].plan).toBeDefined();
    });

    it('should handle empty build queue', async () => {
      const mockQueue = {
        queuedBuilds: { size: 0, 'start-index': 0, 'max-result': 25, queuedBuild: [] as unknown[] },
      };

      vi.mocked(mockClient.getBuildQueue!).mockResolvedValue(mockQueue);

      const result = await mockServer.invokeTool('bamboo_get_build_queue', {});

      const parsed = parseResultJson<typeof mockQueue>(result);
      expect(parsed.queuedBuilds.size).toBe(0);
      expect(parsed.queuedBuilds.queuedBuild).toHaveLength(0);
    });

    it('should handle error from client', async () => {
      vi.mocked(mockClient.getBuildQueue!).mockRejectedValue(new Error('Bamboo API error (500)'));

      const result = await mockServer.invokeTool('bamboo_get_build_queue', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Error: Bamboo API error (500)');
    });

    it('should handle queue without queuedBuild array', async () => {
      const mockQueue = {
        queuedBuilds: { size: 0, 'start-index': 0, 'max-result': 25 },
      };

      vi.mocked(mockClient.getBuildQueue!).mockResolvedValue(mockQueue);

      const result = await mockServer.invokeTool('bamboo_get_build_queue', {});

      const parsed = parseResultJson<{ queuedBuilds: { size: number; queuedBuild?: unknown[] } }>(result);
      expect(parsed.queuedBuilds.size).toBe(0);
      expect(parsed.queuedBuilds.queuedBuild).toBeUndefined();
    });
  });

  describe('bamboo_get_deployment_queue', () => {
    it('should register the tool', () => {
      const tool = mockServer.getTool('bamboo_get_deployment_queue');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_get_deployment_queue');
      expect(tool?.description).toBe('Get the current Bamboo deployment queue');
    });

    it('should get deployment queue when available', async () => {
      const mockQueue = {
        queuedDeployments: {
          size: 2,
          'start-index': 0,
          'max-result': 25,
          queuedDeployment: [
            { deploymentResultId: 12345, deploymentVersionName: 'release-2.1.0-build-42', environmentId: 100, environmentName: 'Staging' },
            { deploymentResultId: 12346, deploymentVersionName: 'release-2.0.5-build-38', environmentId: 200, environmentName: 'Production' },
          ],
        },
      };

      vi.mocked(mockClient.getDeploymentQueue!).mockResolvedValue(mockQueue);

      const result = await mockServer.invokeTool('bamboo_get_deployment_queue', {});

      expect(mockClient.getDeploymentQueue).toHaveBeenCalled();

      const parsed = parseResultJson<typeof mockQueue>(result);
      expect(parsed.queuedDeployments.size).toBe(2);
      expect(parsed.queuedDeployments.queuedDeployment).toHaveLength(2);
    });

    it('should handle empty deployment queue', async () => {
      const mockQueue = {
        queuedDeployments: { size: 0, 'start-index': 0, 'max-result': 25, queuedDeployment: [] as unknown[] },
      };

      vi.mocked(mockClient.getDeploymentQueue!).mockResolvedValue(mockQueue);

      const result = await mockServer.invokeTool('bamboo_get_deployment_queue', {});

      const parsed = parseResultJson<typeof mockQueue>(result);
      expect(parsed.queuedDeployments.size).toBe(0);
      expect(parsed.queuedDeployments.queuedDeployment).toHaveLength(0);
    });

    it('should handle queue not available', async () => {
      const mockResponse = {
        available: false,
        message: 'Deployment queue is not available in this Bamboo version',
      };

      vi.mocked(mockClient.getDeploymentQueue!).mockResolvedValue(mockResponse);

      const result = await mockServer.invokeTool('bamboo_get_deployment_queue', {});

      const parsed = parseResultJson<typeof mockResponse>(result);
      expect(parsed.available).toBe(false);
      expect(parsed.message).toContain('not available');
    });

    it('should handle error from client', async () => {
      vi.mocked(mockClient.getDeploymentQueue!).mockRejectedValue(new Error('Bamboo API error (500)'));

      const result = await mockServer.invokeTool('bamboo_get_deployment_queue', {});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Error: Bamboo API error (500)');
    });
  });
});
