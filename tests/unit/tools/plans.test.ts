import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerPlanTools } from '../../../src/tools/plans.js';
import { createMockMcpServer, type MockMcpServer } from '../../helpers/mock-mcp-server.js';
import type { BambooClient } from '../../../src/bamboo-client.js';

describe('plans tools', () => {
  let mockServer: MockMcpServer;
  let mockClient: {
    listPlans: ReturnType<typeof vi.fn>;
    getPlan: ReturnType<typeof vi.fn>;
    searchPlans: ReturnType<typeof vi.fn>;
    enablePlan: ReturnType<typeof vi.fn>;
    disablePlan: ReturnType<typeof vi.fn>;
    clonePlan: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockServer = createMockMcpServer();
    mockClient = {
      listPlans: vi.fn(),
      getPlan: vi.fn(),
      searchPlans: vi.fn(),
      enablePlan: vi.fn(),
      disablePlan: vi.fn(),
      clonePlan: vi.fn(),
    };
    registerPlanTools(mockServer as unknown as Parameters<typeof registerPlanTools>[0], mockClient as unknown as BambooClient);
  });

  it('should register all 6 plan tools', () => {
    const tools = mockServer.getRegisteredTools();
    expect(tools.size).toBe(6);
    expect(tools.has('bamboo_list_plans')).toBe(true);
    expect(tools.has('bamboo_get_plan')).toBe(true);
    expect(tools.has('bamboo_search_plans')).toBe(true);
    expect(tools.has('bamboo_enable_plan')).toBe(true);
    expect(tools.has('bamboo_disable_plan')).toBe(true);
    expect(tools.has('bamboo_clone_plan')).toBe(true);
  });

  describe('bamboo_list_plans', () => {
    it('should call client.listPlans with no params', async () => {
      const mockData = { plans: { plan: [] } };
      mockClient.listPlans.mockResolvedValue(mockData);

      const result = await mockServer.invokeTool('bamboo_list_plans', {});

      expect(mockClient.listPlans).toHaveBeenCalledWith({
        expand: undefined,
        startIndex: undefined,
        maxResults: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
      });
    });

    it('should convert snake_case params to camelCase', async () => {
      mockClient.listPlans.mockResolvedValue({ plans: { plan: [] } });

      await mockServer.invokeTool('bamboo_list_plans', {
        expand: 'plans.plan.stages',
        start_index: 10,
        max_results: 50,
      });

      expect(mockClient.listPlans).toHaveBeenCalledWith({
        expand: 'plans.plan.stages',
        startIndex: 10,
        maxResults: 50,
      });
    });

    it('should handle errors', async () => {
      mockClient.listPlans.mockRejectedValue(new Error('API error'));

      const result = await mockServer.invokeTool('bamboo_list_plans', {});

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: API error' }],
        isError: true,
      });
    });
  });

  describe('bamboo_get_plan', () => {
    it('should call client.getPlan with plan_key', async () => {
      const mockData = { key: 'PROJ-PLAN', name: 'My Plan' };
      mockClient.getPlan.mockResolvedValue(mockData);

      const result = await mockServer.invokeTool('bamboo_get_plan', {
        plan_key: 'PROJ-PLAN',
      });

      expect(mockClient.getPlan).toHaveBeenCalledWith('PROJ-PLAN', undefined);
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
      });
    });

    it('should call client.getPlan with expand', async () => {
      mockClient.getPlan.mockResolvedValue({ key: 'PROJ-PLAN' });

      await mockServer.invokeTool('bamboo_get_plan', {
        plan_key: 'PROJ-PLAN',
        expand: 'stages,branches',
      });

      expect(mockClient.getPlan).toHaveBeenCalledWith('PROJ-PLAN', 'stages,branches');
    });

    it('should handle errors', async () => {
      mockClient.getPlan.mockRejectedValue(new Error('Bamboo API error (404): Plan not found'));

      const result = await mockServer.invokeTool('bamboo_get_plan', {
        plan_key: 'INVALID-KEY',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Bamboo API error (404): Plan not found' }],
        isError: true,
      });
    });
  });

  describe('bamboo_search_plans', () => {
    it('should call client.searchPlans with name', async () => {
      const mockData = { searchResults: [] };
      mockClient.searchPlans.mockResolvedValue(mockData);

      const result = await mockServer.invokeTool('bamboo_search_plans', {
        name: 'build',
      });

      expect(mockClient.searchPlans).toHaveBeenCalledWith('build', {
        fuzzy: undefined,
        startIndex: undefined,
        maxResults: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
      });
    });

    it('should pass all parameters correctly', async () => {
      mockClient.searchPlans.mockResolvedValue({ searchResults: [] });

      await mockServer.invokeTool('bamboo_search_plans', {
        name: 'deploy',
        fuzzy: true,
        start_index: 5,
        max_results: 20,
      });

      expect(mockClient.searchPlans).toHaveBeenCalledWith('deploy', {
        fuzzy: true,
        startIndex: 5,
        maxResults: 20,
      });
    });

    it('should handle errors', async () => {
      mockClient.searchPlans.mockRejectedValue(new Error('Search failed'));

      const result = await mockServer.invokeTool('bamboo_search_plans', {
        name: 'invalid',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Search failed' }],
        isError: true,
      });
    });
  });

  describe('bamboo_enable_plan', () => {
    it('should call client.enablePlan and return success message', async () => {
      mockClient.enablePlan.mockResolvedValue({});

      const result = await mockServer.invokeTool('bamboo_enable_plan', {
        plan_key: 'PROJ-PLAN',
      });

      expect(mockClient.enablePlan).toHaveBeenCalledWith('PROJ-PLAN');
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Plan PROJ-PLAN has been enabled successfully.' }],
      });
    });

    it('should handle errors', async () => {
      mockClient.enablePlan.mockRejectedValue(new Error('Permission denied'));

      const result = await mockServer.invokeTool('bamboo_enable_plan', {
        plan_key: 'PROJ-PLAN',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Permission denied' }],
        isError: true,
      });
    });
  });

  describe('bamboo_disable_plan', () => {
    it('should call client.disablePlan and return success message', async () => {
      mockClient.disablePlan.mockResolvedValue({});

      const result = await mockServer.invokeTool('bamboo_disable_plan', {
        plan_key: 'PROJ-PLAN',
      });

      expect(mockClient.disablePlan).toHaveBeenCalledWith('PROJ-PLAN');
      expect(result).toEqual({
        content: [{ type: 'text', text: 'Plan PROJ-PLAN has been disabled successfully.' }],
      });
    });

    it('should handle errors', async () => {
      mockClient.disablePlan.mockRejectedValue(new Error('Plan not found'));

      const result = await mockServer.invokeTool('bamboo_disable_plan', {
        plan_key: 'INVALID-PLAN',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Plan not found' }],
        isError: true,
      });
    });
  });

  describe('bamboo_clone_plan', () => {
    it('should clone a plan within the same project', async () => {
      const mockData = {
        key: 'PROJ-NEWPLAN',
        name: 'Cloned Plan',
        shortName: 'NEWPLAN',
      };
      mockClient.clonePlan.mockResolvedValue(mockData);

      const result = await mockServer.invokeTool('bamboo_clone_plan', {
        source_plan_key: 'PROJ-PLAN',
        dest_project_key: 'PROJ',
        dest_plan_key: 'NEWPLAN',
      });

      expect(mockClient.clonePlan).toHaveBeenCalledWith('PROJ-PLAN', 'PROJ-NEWPLAN');
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
      });
    });

    it('should clone a plan to a different project', async () => {
      const mockData = {
        key: 'NEWPROJ-NEWPLAN',
        name: 'Cloned Plan',
        shortName: 'NEWPLAN',
      };
      mockClient.clonePlan.mockResolvedValue(mockData);

      const result = await mockServer.invokeTool('bamboo_clone_plan', {
        source_plan_key: 'PROJ-PLAN',
        dest_project_key: 'NEWPROJ',
        dest_plan_key: 'NEWPLAN',
      });

      expect(mockClient.clonePlan).toHaveBeenCalledWith('PROJ-PLAN', 'NEWPROJ-NEWPLAN');
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockData, null, 2) }],
      });
    });

    it('should handle clone to existing plan key (conflict)', async () => {
      mockClient.clonePlan.mockRejectedValue(new Error('Bamboo API error (409): Plan key already exists'));

      const result = await mockServer.invokeTool('bamboo_clone_plan', {
        source_plan_key: 'PROJ-PLAN',
        dest_project_key: 'PROJ',
        dest_plan_key: 'EXISTINGPLAN',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Bamboo API error (409): Plan key already exists' }],
        isError: true,
      });
    });

    it('should handle clone from non-existent source plan', async () => {
      mockClient.clonePlan.mockRejectedValue(new Error('Bamboo API error (404): Plan not found'));

      const result = await mockServer.invokeTool('bamboo_clone_plan', {
        source_plan_key: 'INVALID-PLAN',
        dest_project_key: 'PROJ',
        dest_plan_key: 'NEWPLAN',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Bamboo API error (404): Plan not found' }],
        isError: true,
      });
    });

    it('should handle clone to non-existent project', async () => {
      mockClient.clonePlan.mockRejectedValue(new Error('Bamboo API error (404): Project not found'));

      const result = await mockServer.invokeTool('bamboo_clone_plan', {
        source_plan_key: 'PROJ-PLAN',
        dest_project_key: 'NONEXISTENT',
        dest_plan_key: 'NEWPLAN',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Bamboo API error (404): Project not found' }],
        isError: true,
      });
    });
  });
});
