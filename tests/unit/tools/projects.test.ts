import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerProjectTools } from '../../../src/tools/projects.js';
import { createMockMcpServer, type MockMcpServer } from '../../helpers/mock-mcp-server.js';
import type { BambooClient } from '../../../src/bamboo-client.js';

describe('Project Tools', () => {
  let mockServer: MockMcpServer;
  let mockClient: Partial<BambooClient>;

  beforeEach(() => {
    mockServer = createMockMcpServer();
    mockClient = {
      listProjects: vi.fn(),
      getProject: vi.fn(),
    };
    registerProjectTools(mockServer as any, mockClient as BambooClient);
  });

  describe('Tool Registration', () => {
    it('should register bamboo_list_projects tool', () => {
      const tool = mockServer.getTool('bamboo_list_projects');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_list_projects');
      expect(tool?.description).toBe('List all Bamboo projects');
    });

    it('should register bamboo_get_project tool', () => {
      const tool = mockServer.getTool('bamboo_get_project');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_get_project');
      expect(tool?.description).toBe('Get details of a specific Bamboo project by key');
    });

    it('should register bamboo_list_projects with optional parameters schema', () => {
      const tool = mockServer.getTool('bamboo_list_projects');

      expect(tool?.schema).toHaveProperty('expand');
      expect(tool?.schema).toHaveProperty('start_index');
      expect(tool?.schema).toHaveProperty('max_results');
    });

    it('should register bamboo_get_project with required project_key and optional expand', () => {
      const tool = mockServer.getTool('bamboo_get_project');

      expect(tool?.schema).toHaveProperty('project_key');
      expect(tool?.schema).toHaveProperty('expand');
    });
  });

  describe('bamboo_list_projects', () => {
    const mockProjectsResponse = {
      projects: {
        project: [
          { key: 'PROJ1', name: 'Project One' },
          { key: 'PROJ2', name: 'Project Two' },
        ],
      },
      size: 2,
      start: 0,
      limit: 25,
    };

    it('should list projects with no parameters', async () => {
      vi.mocked(mockClient.listProjects!).mockResolvedValue(mockProjectsResponse);

      const result = await mockServer.invokeTool('bamboo_list_projects', {});

      expect(mockClient.listProjects).toHaveBeenCalledWith({
        expand: undefined,
        startIndex: undefined,
        maxResults: undefined,
      });
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockProjectsResponse, null, 2),
          },
        ],
      });
    });

    it('should convert snake_case params to camelCase for client', async () => {
      vi.mocked(mockClient.listProjects!).mockResolvedValue(mockProjectsResponse);

      await mockServer.invokeTool('bamboo_list_projects', {
        start_index: 10,
        max_results: 50,
      });

      expect(mockClient.listProjects).toHaveBeenCalledWith({
        expand: undefined,
        startIndex: 10,
        maxResults: 50,
      });
    });

    it('should pass expand parameter', async () => {
      vi.mocked(mockClient.listProjects!).mockResolvedValue(mockProjectsResponse);

      await mockServer.invokeTool('bamboo_list_projects', {
        expand: 'projects.project.plans',
      });

      expect(mockClient.listProjects).toHaveBeenCalledWith({
        expand: 'projects.project.plans',
        startIndex: undefined,
        maxResults: undefined,
      });
    });

    it('should pass all parameters together', async () => {
      vi.mocked(mockClient.listProjects!).mockResolvedValue(mockProjectsResponse);

      await mockServer.invokeTool('bamboo_list_projects', {
        expand: 'projects.project.plans',
        start_index: 5,
        max_results: 100,
      });

      expect(mockClient.listProjects).toHaveBeenCalledWith({
        expand: 'projects.project.plans',
        startIndex: 5,
        maxResults: 100,
      });
    });

    it('should return formatted error on API error', async () => {
      vi.mocked(mockClient.listProjects!).mockRejectedValue(new Error('Unauthorized'));

      const result = await mockServer.invokeTool('bamboo_list_projects', {});

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

    it('should handle non-Error exceptions', async () => {
      vi.mocked(mockClient.listProjects!).mockRejectedValue('API timeout');

      const result = await mockServer.invokeTool('bamboo_list_projects', {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: API timeout',
          },
        ],
        isError: true,
      });
    });
  });

  describe('bamboo_get_project', () => {
    const mockProjectDetails = {
      key: 'MYPROJ',
      name: 'My Project',
      description: 'A sample project',
      plans: {
        plan: [
          { key: 'MYPROJ-PLAN1', name: 'Build Plan' },
        ],
      },
    };

    it('should get project by key', async () => {
      vi.mocked(mockClient.getProject!).mockResolvedValue(mockProjectDetails);

      const result = await mockServer.invokeTool('bamboo_get_project', {
        project_key: 'MYPROJ',
      });

      expect(mockClient.getProject).toHaveBeenCalledWith('MYPROJ', undefined);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockProjectDetails, null, 2),
          },
        ],
      });
    });

    it('should get project with expand parameter', async () => {
      vi.mocked(mockClient.getProject!).mockResolvedValue(mockProjectDetails);

      await mockServer.invokeTool('bamboo_get_project', {
        project_key: 'MYPROJ',
        expand: 'plans.plan.stages',
      });

      expect(mockClient.getProject).toHaveBeenCalledWith('MYPROJ', 'plans.plan.stages');
    });

    it('should return formatted error when project not found', async () => {
      vi.mocked(mockClient.getProject!).mockRejectedValue(new Error('Project not found: INVALID'));

      const result = await mockServer.invokeTool('bamboo_get_project', {
        project_key: 'INVALID',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Project not found: INVALID',
          },
        ],
        isError: true,
      });
    });

    it('should return formatted error on API error', async () => {
      vi.mocked(mockClient.getProject!).mockRejectedValue(new Error('Forbidden'));

      const result = await mockServer.invokeTool('bamboo_get_project', {
        project_key: 'RESTRICTED',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Forbidden',
          },
        ],
        isError: true,
      });
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(mockClient.getProject!).mockRejectedValue(404);

      const result = await mockServer.invokeTool('bamboo_get_project', {
        project_key: 'NOTFOUND',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: 404',
          },
        ],
        isError: true,
      });
    });
  });
});
