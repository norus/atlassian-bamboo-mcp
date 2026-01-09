import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerBranchTools } from '../../../src/tools/branches.js';
import {
  createMockMcpServer,
  parseResultJson,
  type MockMcpServer,
  type ToolResult,
} from '../../helpers/mock-mcp-server.js';
import type { BambooClient } from '../../../src/bamboo-client.js';

describe('branches tools', () => {
  let mockServer: MockMcpServer;
  let mockClient: Partial<BambooClient>;

  beforeEach(() => {
    mockServer = createMockMcpServer();
    mockClient = {
      listPlanBranches: vi.fn(),
      getPlanBranch: vi.fn(),
    };
    registerBranchTools(
      mockServer as unknown as Parameters<typeof registerBranchTools>[0],
      mockClient as BambooClient
    );
  });

  describe('bamboo_list_plan_branches', () => {
    it('should register the tool', () => {
      const tool = mockServer.getTool('bamboo_list_plan_branches');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_list_plan_branches');
      expect(tool?.description).toBe('List all branches for a Bamboo build plan');
    });

    it('should list all branches for a plan', async () => {
      const mockBranches = {
        branches: {
          size: 3,
          'start-index': 0,
          'max-result': 25,
          branch: [
            { key: 'PROJ-PLAN0', name: 'main', enabled: true },
            { key: 'PROJ-PLAN1', name: 'develop', enabled: true },
            { key: 'PROJ-PLAN2', name: 'feature/auth', enabled: false },
          ],
        },
      };

      vi.mocked(mockClient.listPlanBranches!).mockResolvedValue(mockBranches);

      const result = await mockServer.invokeTool('bamboo_list_plan_branches', {
        plan_key: 'PROJ-PLAN',
      });

      expect(mockClient.listPlanBranches).toHaveBeenCalledWith('PROJ-PLAN', {
        enabledOnly: undefined,
        startIndex: undefined,
        maxResults: undefined,
      });

      const parsed = parseResultJson<typeof mockBranches>(result);
      expect(parsed.branches.branch).toHaveLength(3);
    });

    it('should list enabled branches only', async () => {
      const mockBranches = {
        branches: {
          size: 2,
          'start-index': 0,
          'max-result': 25,
          branch: [
            { key: 'PROJ-PLAN0', name: 'main', enabled: true },
            { key: 'PROJ-PLAN1', name: 'develop', enabled: true },
          ],
        },
      };

      vi.mocked(mockClient.listPlanBranches!).mockResolvedValue(mockBranches);

      const result = await mockServer.invokeTool('bamboo_list_plan_branches', {
        plan_key: 'PROJ-PLAN',
        enabled_only: true,
      });

      expect(mockClient.listPlanBranches).toHaveBeenCalledWith('PROJ-PLAN', {
        enabledOnly: true,
        startIndex: undefined,
        maxResults: undefined,
      });

      const parsed = parseResultJson<typeof mockBranches>(result);
      expect(parsed.branches.branch).toHaveLength(2);
    });

    it('should support pagination with start_index and max_results', async () => {
      const mockBranches = {
        branches: {
          size: 2,
          'start-index': 5,
          'max-result': 10,
          branch: [
            { key: 'PROJ-PLAN5', name: 'feature/page', enabled: true },
            { key: 'PROJ-PLAN6', name: 'feature/search', enabled: true },
          ],
        },
      };

      vi.mocked(mockClient.listPlanBranches!).mockResolvedValue(mockBranches);

      const result = await mockServer.invokeTool('bamboo_list_plan_branches', {
        plan_key: 'PROJ-PLAN',
        start_index: 5,
        max_results: 10,
      });

      expect(mockClient.listPlanBranches).toHaveBeenCalledWith('PROJ-PLAN', {
        enabledOnly: undefined,
        startIndex: 5,
        maxResults: 10,
      });

      const parsed = parseResultJson<typeof mockBranches>(result);
      expect(parsed.branches['start-index']).toBe(5);
      expect(parsed.branches['max-result']).toBe(10);
    });

    it('should convert snake_case params to camelCase for client', async () => {
      const mockBranches = {
        branches: {
          size: 1,
          'start-index': 10,
          'max-result': 5,
          branch: [{ key: 'PROJ-PLAN10', name: 'feature/x', enabled: true }],
        },
      };

      vi.mocked(mockClient.listPlanBranches!).mockResolvedValue(mockBranches);

      await mockServer.invokeTool('bamboo_list_plan_branches', {
        plan_key: 'PROJ-PLAN',
        enabled_only: true,
        start_index: 10,
        max_results: 5,
      });

      expect(mockClient.listPlanBranches).toHaveBeenCalledWith('PROJ-PLAN', {
        enabledOnly: true,
        startIndex: 10,
        maxResults: 5,
      });
    });

    it('should handle error from client', async () => {
      vi.mocked(mockClient.listPlanBranches!).mockRejectedValue(new Error('Plan not found'));

      const result = await mockServer.invokeTool('bamboo_list_plan_branches', {
        plan_key: 'INVALID-PLAN',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Error: Plan not found');
    });

    it('should handle empty branch list', async () => {
      const mockBranches = {
        branches: {
          size: 0,
          'start-index': 0,
          'max-result': 25,
          branch: [],
        },
      };

      vi.mocked(mockClient.listPlanBranches!).mockResolvedValue(mockBranches);

      const result = await mockServer.invokeTool('bamboo_list_plan_branches', {
        plan_key: 'PROJ-PLAN',
      });

      const parsed = parseResultJson<typeof mockBranches>(result);
      expect(parsed.branches.branch).toHaveLength(0);
      expect(parsed.branches.size).toBe(0);
    });
  });

  describe('bamboo_get_plan_branch', () => {
    it('should register the tool', () => {
      const tool = mockServer.getTool('bamboo_get_plan_branch');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_get_plan_branch');
      expect(tool?.description).toBe('Get details of a specific plan branch');
    });

    it('should get branch details successfully', async () => {
      const mockBranch = {
        key: 'PROJ-PLAN1',
        name: 'develop',
        shortName: 'develop',
        shortKey: 'PLAN1',
        enabled: true,
        link: {
          href: 'https://bamboo.example.com/rest/api/latest/plan/PROJ-PLAN1',
          rel: 'self',
        },
      };

      vi.mocked(mockClient.getPlanBranch!).mockResolvedValue(mockBranch);

      const result = await mockServer.invokeTool('bamboo_get_plan_branch', {
        plan_key: 'PROJ-PLAN',
        branch_name: 'develop',
      });

      expect(mockClient.getPlanBranch).toHaveBeenCalledWith('PROJ-PLAN', 'develop');

      const parsed = parseResultJson<typeof mockBranch>(result);
      expect(parsed.name).toBe('develop');
      expect(parsed.enabled).toBe(true);
    });

    it('should handle branch with special characters in name', async () => {
      const mockBranch = {
        key: 'PROJ-PLAN2',
        name: 'feature/user-authentication',
        shortName: 'feature/user-authentication',
        shortKey: 'PLAN2',
        enabled: true,
      };

      vi.mocked(mockClient.getPlanBranch!).mockResolvedValue(mockBranch);

      const result = await mockServer.invokeTool('bamboo_get_plan_branch', {
        plan_key: 'PROJ-PLAN',
        branch_name: 'feature/user-authentication',
      });

      expect(mockClient.getPlanBranch).toHaveBeenCalledWith('PROJ-PLAN', 'feature/user-authentication');

      const parsed = parseResultJson<typeof mockBranch>(result);
      expect(parsed.name).toBe('feature/user-authentication');
    });

    it('should handle error when branch not found', async () => {
      vi.mocked(mockClient.getPlanBranch!).mockRejectedValue(new Error('Branch not found'));

      const result = await mockServer.invokeTool('bamboo_get_plan_branch', {
        plan_key: 'PROJ-PLAN',
        branch_name: 'nonexistent-branch',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Error: Branch not found');
    });

    it('should handle error when plan not found', async () => {
      vi.mocked(mockClient.getPlanBranch!).mockRejectedValue(new Error('Bamboo API error (404)'));

      const result = await mockServer.invokeTool('bamboo_get_plan_branch', {
        plan_key: 'INVALID-PLAN',
        branch_name: 'main',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toBe('Error: Bamboo API error (404)');
    });

    it('should handle disabled branch', async () => {
      const mockBranch = {
        key: 'PROJ-PLAN4',
        name: 'feature/deprecated',
        shortName: 'feature/deprecated',
        shortKey: 'PLAN4',
        enabled: false,
      };

      vi.mocked(mockClient.getPlanBranch!).mockResolvedValue(mockBranch);

      const result = await mockServer.invokeTool('bamboo_get_plan_branch', {
        plan_key: 'PROJ-PLAN',
        branch_name: 'feature/deprecated',
      });

      const parsed = parseResultJson<typeof mockBranch>(result);
      expect(parsed.enabled).toBe(false);
    });
  });
});
