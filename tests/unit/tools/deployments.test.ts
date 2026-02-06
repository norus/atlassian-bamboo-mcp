import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerDeploymentTools } from '../../../src/tools/deployments.js';
import { createMockMcpServer, type MockMcpServer } from '../../helpers/mock-mcp-server.js';
import type { BambooClient } from '../../../src/bamboo-client.js';

describe('Deployment Tools', () => {
  let mockServer: MockMcpServer;
  let mockClient: Partial<BambooClient>;

  beforeEach(() => {
    mockServer = createMockMcpServer();
    mockClient = {
      listDeploymentProjects: vi.fn(),
      getDeploymentProject: vi.fn(),
      createDeploymentProject: vi.fn(),
      triggerDeployment: vi.fn(),
      getDeploymentResults: vi.fn(),
      getDeploymentResult: vi.fn(),
    };
    registerDeploymentTools(mockServer as any, mockClient as BambooClient);
  });

  describe('Tool Registration', () => {
    it('should register bamboo_list_deployment_projects tool', () => {
      const tool = mockServer.getTool('bamboo_list_deployment_projects');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_list_deployment_projects');
      expect(tool?.description).toBe('List all Bamboo deployment projects');
    });

    it('should register bamboo_get_deployment_project tool', () => {
      const tool = mockServer.getTool('bamboo_get_deployment_project');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_get_deployment_project');
      expect(tool?.description).toBe('Get details of a specific deployment project');
    });

    it('should register bamboo_trigger_deployment tool', () => {
      const tool = mockServer.getTool('bamboo_trigger_deployment');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_trigger_deployment');
      expect(tool?.description).toBe('Trigger a deployment to an environment');
    });

    it('should register bamboo_get_deployment_results tool', () => {
      const tool = mockServer.getTool('bamboo_get_deployment_results');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_get_deployment_results');
      expect(tool?.description).toBe('Get deployment results for an environment');
    });

    it('should register bamboo_get_deployment_result tool', () => {
      const tool = mockServer.getTool('bamboo_get_deployment_result');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_get_deployment_result');
      expect(tool?.description).toBe('Get a specific deployment result with optional logs');
    });

    it('should register bamboo_create_deployment_project tool', () => {
      const tool = mockServer.getTool('bamboo_create_deployment_project');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_create_deployment_project');
      expect(tool?.description).toBe('Create a new Bamboo deployment project linked to a build plan');
    });

    it('should register all 6 deployment tools', () => {
      expect(mockServer.getRegisteredTools().size).toBe(6);
    });
  });

  describe('bamboo_list_deployment_projects', () => {
    it('should return deployment projects on success', async () => {
      const mockProjects = [
        { id: 1, name: 'Project A', key: 'PROJ-A' },
        { id: 2, name: 'Project B', key: 'PROJ-B' },
      ];

      vi.mocked(mockClient.listDeploymentProjects!).mockResolvedValue(mockProjects);

      const result = await mockServer.invokeTool('bamboo_list_deployment_projects', {});

      expect(mockClient.listDeploymentProjects).toHaveBeenCalledOnce();
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockProjects, null, 2),
          },
        ],
      });
    });

    it('should return empty array when no projects exist', async () => {
      vi.mocked(mockClient.listDeploymentProjects!).mockResolvedValue([]);

      const result = await mockServer.invokeTool('bamboo_list_deployment_projects', {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: '[]',
          },
        ],
      });
    });

    it('should return formatted error on API error', async () => {
      vi.mocked(mockClient.listDeploymentProjects!).mockRejectedValue(new Error('Unauthorized'));

      const result = await mockServer.invokeTool('bamboo_list_deployment_projects', {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Unauthorized',
          },
        ],
        isError: true,
      });
    });
  });

  describe('bamboo_get_deployment_project', () => {
    it('should return deployment project by ID', async () => {
      const mockProject = {
        id: 123,
        name: 'My Deployment Project',
        key: 'MDP',
        environments: [
          { id: 1, name: 'Development' },
          { id: 2, name: 'Production' },
        ],
      };

      vi.mocked(mockClient.getDeploymentProject!).mockResolvedValue(mockProject);

      const result = await mockServer.invokeTool('bamboo_get_deployment_project', {
        project_id: '123',
      });

      expect(mockClient.getDeploymentProject).toHaveBeenCalledWith('123');
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockProject, null, 2),
          },
        ],
      });
    });

    it('should return formatted error when project not found', async () => {
      vi.mocked(mockClient.getDeploymentProject!).mockRejectedValue(
        new Error('Bamboo API error (404): Project not found')
      );

      const result = await mockServer.invokeTool('bamboo_get_deployment_project', {
        project_id: '999',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Bamboo API error (404): Project not found',
          },
        ],
        isError: true,
      });
    });
  });

  describe('bamboo_create_deployment_project', () => {
    it('should create deployment project and return JSON response', async () => {
      const mockProject = {
        id: 1003,
        name: 'New Deployment',
        key: { key: 'PROJ-PLAN' },
        planKey: { key: 'PROJ-PLAN' },
        environments: [],
      };

      vi.mocked(mockClient.createDeploymentProject!).mockResolvedValue(mockProject);

      const result = await mockServer.invokeTool('bamboo_create_deployment_project', {
        name: 'New Deployment',
        plan_key: 'PROJ-PLAN',
      });

      expect(mockClient.createDeploymentProject).toHaveBeenCalledWith(
        'New Deployment',
        'PROJ-PLAN',
        undefined
      );
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockProject, null, 2),
          },
        ],
      });
    });

    it('should create deployment project with optional description', async () => {
      const mockProject = {
        id: 1004,
        name: 'New Deployment',
        description: 'A deployment project for testing',
        planKey: { key: 'PROJ-PLAN' },
      };

      vi.mocked(mockClient.createDeploymentProject!).mockResolvedValue(mockProject);

      const result = await mockServer.invokeTool('bamboo_create_deployment_project', {
        name: 'New Deployment',
        plan_key: 'PROJ-PLAN',
        description: 'A deployment project for testing',
      });

      expect(mockClient.createDeploymentProject).toHaveBeenCalledWith(
        'New Deployment',
        'PROJ-PLAN',
        'A deployment project for testing'
      );
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockProject, null, 2),
          },
        ],
      });
    });

    it('should return formatted error on API error', async () => {
      vi.mocked(mockClient.createDeploymentProject!).mockRejectedValue(
        new Error('Bamboo API error (400): Name is required')
      );

      const result = await mockServer.invokeTool('bamboo_create_deployment_project', {
        name: '',
        plan_key: 'PROJ-PLAN',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Bamboo API error (400): Name is required',
          },
        ],
        isError: true,
      });
    });
  });

  describe('bamboo_trigger_deployment', () => {
    it('should trigger deployment with version and environment IDs', async () => {
      const mockResponse = {
        deploymentResultId: 456,
        link: { href: 'https://bamboo/deploy/result/456' },
      };

      vi.mocked(mockClient.triggerDeployment!).mockResolvedValue(mockResponse);

      const result = await mockServer.invokeTool('bamboo_trigger_deployment', {
        version_id: '123',
        environment_id: '456',
      });

      expect(mockClient.triggerDeployment).toHaveBeenCalledWith('123', '456');
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResponse, null, 2),
          },
        ],
      });
    });

    it('should return formatted error on invalid version', async () => {
      vi.mocked(mockClient.triggerDeployment!).mockRejectedValue(
        new Error('Bamboo API error (400): Invalid version ID')
      );

      const result = await mockServer.invokeTool('bamboo_trigger_deployment', {
        version_id: 'invalid',
        environment_id: '456',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Bamboo API error (400): Invalid version ID',
          },
        ],
        isError: true,
      });
    });

    it('should return formatted error on invalid environment', async () => {
      vi.mocked(mockClient.triggerDeployment!).mockRejectedValue(
        new Error('Bamboo API error (404): Environment not found')
      );

      const result = await mockServer.invokeTool('bamboo_trigger_deployment', {
        version_id: '123',
        environment_id: 'invalid',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Bamboo API error (404): Environment not found',
          },
        ],
        isError: true,
      });
    });
  });

  describe('bamboo_get_deployment_results', () => {
    it('should return deployment results for environment', async () => {
      const mockResults = {
        results: [
          { id: 1, deploymentState: 'SUCCESS' },
          { id: 2, deploymentState: 'FAILED' },
        ],
      };

      vi.mocked(mockClient.getDeploymentResults!).mockResolvedValue(mockResults);

      const result = await mockServer.invokeTool('bamboo_get_deployment_results', {
        environment_id: '789',
      });

      expect(mockClient.getDeploymentResults).toHaveBeenCalledWith('789', {
        startIndex: undefined,
        maxResults: undefined,
      });
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResults, null, 2),
          },
        ],
      });
    });

    it('should pass pagination parameters (snake_case to camelCase)', async () => {
      vi.mocked(mockClient.getDeploymentResults!).mockResolvedValue({ results: [] });

      await mockServer.invokeTool('bamboo_get_deployment_results', {
        environment_id: '789',
        start_index: 10,
        max_results: 50,
      });

      expect(mockClient.getDeploymentResults).toHaveBeenCalledWith('789', {
        startIndex: 10,
        maxResults: 50,
      });
    });

    it('should return formatted error on API error', async () => {
      vi.mocked(mockClient.getDeploymentResults!).mockRejectedValue(
        new Error('Bamboo API error (404): Environment not found')
      );

      const result = await mockServer.invokeTool('bamboo_get_deployment_results', {
        environment_id: '999',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Bamboo API error (404): Environment not found',
          },
        ],
        isError: true,
      });
    });
  });

  describe('bamboo_get_deployment_result', () => {
    it('should return deployment result without logs by default', async () => {
      const mockResult = {
        id: 123,
        deploymentState: 'SUCCESS',
        startedDate: '2024-01-15T10:00:00.000Z',
        finishedDate: '2024-01-15T10:05:00.000Z',
      };

      vi.mocked(mockClient.getDeploymentResult!).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_deployment_result', {
        deployment_result_id: '123',
      });

      expect(mockClient.getDeploymentResult).toHaveBeenCalledWith('123', {
        includeLogs: undefined,
        maxLogLines: undefined,
      });
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResult, null, 2),
          },
        ],
      });
    });

    it('should return deployment result with logs when requested', async () => {
      const mockResult = {
        id: 123,
        deploymentState: 'SUCCESS',
        logEntries: [
          { log: 'Deploying...', date: '2024-01-15T10:00:00' },
          { log: 'Deployment complete', date: '2024-01-15T10:05:00' },
        ],
      };

      vi.mocked(mockClient.getDeploymentResult!).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_deployment_result', {
        deployment_result_id: '123',
        include_logs: true,
      });

      expect(mockClient.getDeploymentResult).toHaveBeenCalledWith('123', {
        includeLogs: true,
        maxLogLines: undefined,
      });
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResult, null, 2),
          },
        ],
      });
    });

    it('should pass max_log_lines parameter (snake_case to camelCase)', async () => {
      vi.mocked(mockClient.getDeploymentResult!).mockResolvedValue({ id: 123 });

      await mockServer.invokeTool('bamboo_get_deployment_result', {
        deployment_result_id: '123',
        include_logs: true,
        max_log_lines: 500,
      });

      expect(mockClient.getDeploymentResult).toHaveBeenCalledWith('123', {
        includeLogs: true,
        maxLogLines: 500,
      });
    });

    it('should return formatted error when result not found', async () => {
      vi.mocked(mockClient.getDeploymentResult!).mockRejectedValue(
        new Error('Bamboo API error (404): Deployment result not found')
      );

      const result = await mockServer.invokeTool('bamboo_get_deployment_result', {
        deployment_result_id: '999',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Bamboo API error (404): Deployment result not found',
          },
        ],
        isError: true,
      });
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(mockClient.getDeploymentResult!).mockRejectedValue('Unknown error');

      const result = await mockServer.invokeTool('bamboo_get_deployment_result', {
        deployment_result_id: '123',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Unknown error',
          },
        ],
        isError: true,
      });
    });
  });
});
