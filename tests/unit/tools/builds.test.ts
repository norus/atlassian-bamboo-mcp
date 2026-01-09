import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerBuildTools } from '../../../src/tools/builds.js';
import { createMockMcpServer, type MockMcpServer } from '../../helpers/mock-mcp-server.js';
import type { BambooClient } from '../../../src/bamboo-client.js';

describe('registerBuildTools', () => {
  let mockServer: MockMcpServer;
  let mockClient: Partial<BambooClient>;

  beforeEach(() => {
    mockServer = createMockMcpServer();
    mockClient = {
      triggerBuild: vi.fn(),
      stopBuild: vi.fn(),
      getBuildResult: vi.fn(),
      getLatestBuildResult: vi.fn(),
      listBuildResults: vi.fn(),
      getBuildLogs: vi.fn(),
      getBuildResultWithLogs: vi.fn(),
    };

    registerBuildTools(mockServer as unknown as Parameters<typeof registerBuildTools>[0], mockClient as BambooClient);
  });

  it('should register all 7 build tools', () => {
    const tools = mockServer.getRegisteredTools();
    expect(tools.size).toBe(7);
    expect(tools.has('bamboo_trigger_build')).toBe(true);
    expect(tools.has('bamboo_stop_build')).toBe(true);
    expect(tools.has('bamboo_get_build_result')).toBe(true);
    expect(tools.has('bamboo_get_latest_result')).toBe(true);
    expect(tools.has('bamboo_list_build_results')).toBe(true);
    expect(tools.has('bamboo_get_build_logs')).toBe(true);
    expect(tools.has('bamboo_get_build_result_logs')).toBe(true);
  });

  // ============================================================================
  // 1. bamboo_trigger_build
  // ============================================================================
  describe('bamboo_trigger_build', () => {
    it('should trigger a basic build with only plan_key', async () => {
      const mockResult = {
        buildNumber: 42,
        buildResultKey: 'PROJ-PLAN-42',
        planKey: 'PROJ-PLAN',
      };
      (mockClient.triggerBuild as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_trigger_build', {
        plan_key: 'PROJ-PLAN',
      });

      expect(mockClient.triggerBuild).toHaveBeenCalledWith('PROJ-PLAN', {
        stage: undefined,
        executeAllStages: undefined,
        customRevision: undefined,
        variables: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should trigger a build with variables (record type)', async () => {
      const mockResult = {
        buildNumber: 43,
        buildResultKey: 'PROJ-PLAN-43',
      };
      (mockClient.triggerBuild as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_trigger_build', {
        plan_key: 'PROJ-PLAN',
        variables: { ENV: 'staging', DEBUG: 'true', VERSION: '1.0.0' },
      });

      expect(mockClient.triggerBuild).toHaveBeenCalledWith('PROJ-PLAN', {
        stage: undefined,
        executeAllStages: undefined,
        customRevision: undefined,
        variables: { ENV: 'staging', DEBUG: 'true', VERSION: '1.0.0' },
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should trigger a build with stage parameter', async () => {
      const mockResult = {
        buildNumber: 44,
        buildResultKey: 'PROJ-PLAN-44',
      };
      (mockClient.triggerBuild as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_trigger_build', {
        plan_key: 'PROJ-PLAN',
        stage: 'Build Stage',
      });

      expect(mockClient.triggerBuild).toHaveBeenCalledWith('PROJ-PLAN', {
        stage: 'Build Stage',
        executeAllStages: undefined,
        customRevision: undefined,
        variables: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should trigger a build with custom revision', async () => {
      const mockResult = {
        buildNumber: 45,
        buildResultKey: 'PROJ-PLAN-45',
      };
      (mockClient.triggerBuild as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_trigger_build', {
        plan_key: 'PROJ-PLAN',
        custom_revision: 'abc123def456',
      });

      expect(mockClient.triggerBuild).toHaveBeenCalledWith('PROJ-PLAN', {
        stage: undefined,
        executeAllStages: undefined,
        customRevision: 'abc123def456',
        variables: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should trigger a build with execute_all_stages set to false', async () => {
      const mockResult = {
        buildNumber: 46,
        buildResultKey: 'PROJ-PLAN-46',
      };
      (mockClient.triggerBuild as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_trigger_build', {
        plan_key: 'PROJ-PLAN',
        execute_all_stages: false,
      });

      expect(mockClient.triggerBuild).toHaveBeenCalledWith('PROJ-PLAN', {
        stage: undefined,
        executeAllStages: false,
        customRevision: undefined,
        variables: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should trigger a build with all parameters', async () => {
      const mockResult = {
        buildNumber: 47,
        buildResultKey: 'PROJ-PLAN-47',
      };
      (mockClient.triggerBuild as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_trigger_build', {
        plan_key: 'PROJ-PLAN',
        stage: 'Deploy Stage',
        execute_all_stages: true,
        custom_revision: 'deadbeef',
        variables: { TARGET: 'production' },
      });

      expect(mockClient.triggerBuild).toHaveBeenCalledWith('PROJ-PLAN', {
        stage: 'Deploy Stage',
        executeAllStages: true,
        customRevision: 'deadbeef',
        variables: { TARGET: 'production' },
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should handle errors from triggerBuild', async () => {
      (mockClient.triggerBuild as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Plan not found')
      );

      const result = await mockServer.invokeTool('bamboo_trigger_build', {
        plan_key: 'INVALID-PLAN',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Plan not found' }],
        isError: true,
      });
    });
  });

  // ============================================================================
  // 2. bamboo_stop_build
  // ============================================================================
  describe('bamboo_stop_build', () => {
    it('should stop a running build successfully', async () => {
      const mockResult = {
        message: 'Stopped 2 job(s) for build PROJ-PLAN-42',
        buildKey: 'PROJ-PLAN-42',
        stoppedJobs: ['PROJ-PLAN-JOB1-42', 'PROJ-PLAN-JOB2-42'],
        failedJobs: [],
        success: true,
      };
      (mockClient.stopBuild as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_stop_build', {
        plan_key: 'PROJ-PLAN',
      });

      expect(mockClient.stopBuild).toHaveBeenCalledWith('PROJ-PLAN');
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should handle plan not currently building', async () => {
      const mockResult = {
        message: 'Plan PROJ-PLAN is not currently building',
        success: false,
      };
      (mockClient.stopBuild as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_stop_build', {
        plan_key: 'PROJ-PLAN',
      });

      expect(mockClient.stopBuild).toHaveBeenCalledWith('PROJ-PLAN');
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should handle no running jobs found', async () => {
      const mockResult = {
        message: 'No running jobs found to stop for build PROJ-PLAN-42',
        buildKey: 'PROJ-PLAN-42',
        stoppedJobs: [],
        failedJobs: [],
        success: false,
      };
      (mockClient.stopBuild as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_stop_build', {
        plan_key: 'PROJ-PLAN',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should handle errors from stopBuild', async () => {
      (mockClient.stopBuild as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Permission denied')
      );

      const result = await mockServer.invokeTool('bamboo_stop_build', {
        plan_key: 'PROJ-PLAN',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Permission denied' }],
        isError: true,
      });
    });
  });

  // ============================================================================
  // 3. bamboo_get_build_result
  // ============================================================================
  describe('bamboo_get_build_result', () => {
    it('should get build result successfully', async () => {
      const mockResult = {
        key: 'PROJ-PLAN-42',
        buildNumber: 42,
        buildState: 'Successful',
        lifeCycleState: 'Finished',
        successful: true,
      };
      (mockClient.getBuildResult as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_build_result', {
        build_key: 'PROJ-PLAN-42',
      });

      expect(mockClient.getBuildResult).toHaveBeenCalledWith('PROJ-PLAN-42', undefined);
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should get build result with expand parameter', async () => {
      const mockResult = {
        key: 'PROJ-PLAN-42',
        buildNumber: 42,
        buildState: 'Successful',
        changes: { size: 3 },
        artifacts: { size: 2 },
        testResults: { all: 100, successful: 98, failed: 2 },
      };
      (mockClient.getBuildResult as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_build_result', {
        build_key: 'PROJ-PLAN-42',
        expand: 'changes,artifacts,testResults',
      });

      expect(mockClient.getBuildResult).toHaveBeenCalledWith(
        'PROJ-PLAN-42',
        'changes,artifacts,testResults'
      );
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should handle errors from getBuildResult', async () => {
      (mockClient.getBuildResult as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Build not found')
      );

      const result = await mockServer.invokeTool('bamboo_get_build_result', {
        build_key: 'INVALID-BUILD-123',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Build not found' }],
        isError: true,
      });
    });

    it('should get failed build result', async () => {
      const mockResult = {
        key: 'PROJ-PLAN-41',
        buildNumber: 41,
        buildState: 'Failed',
        lifeCycleState: 'Finished',
        successful: false,
      };
      (mockClient.getBuildResult as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_build_result', {
        build_key: 'PROJ-PLAN-41',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });
  });

  // ============================================================================
  // 4. bamboo_get_latest_result
  // ============================================================================
  describe('bamboo_get_latest_result', () => {
    it('should get latest build result successfully', async () => {
      const mockResult = {
        key: 'PROJ-PLAN-99',
        buildNumber: 99,
        buildState: 'Successful',
        lifeCycleState: 'Finished',
      };
      (mockClient.getLatestBuildResult as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_latest_result', {
        plan_key: 'PROJ-PLAN',
      });

      expect(mockClient.getLatestBuildResult).toHaveBeenCalledWith('PROJ-PLAN', undefined);
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should get latest build result with expand parameter', async () => {
      const mockResult = {
        key: 'PROJ-PLAN-99',
        buildNumber: 99,
        buildState: 'Successful',
        changes: { size: 5 },
        artifacts: { size: 1 },
      };
      (mockClient.getLatestBuildResult as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_latest_result', {
        plan_key: 'PROJ-PLAN',
        expand: 'changes,artifacts',
      });

      expect(mockClient.getLatestBuildResult).toHaveBeenCalledWith('PROJ-PLAN', 'changes,artifacts');
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should handle errors from getLatestBuildResult', async () => {
      (mockClient.getLatestBuildResult as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Plan not found')
      );

      const result = await mockServer.invokeTool('bamboo_get_latest_result', {
        plan_key: 'INVALID-PLAN',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Plan not found' }],
        isError: true,
      });
    });

    it('should handle plan with no builds yet', async () => {
      (mockClient.getLatestBuildResult as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('No builds found')
      );

      const result = await mockServer.invokeTool('bamboo_get_latest_result', {
        plan_key: 'NEW-PLAN',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: No builds found' }],
        isError: true,
      });
    });
  });

  // ============================================================================
  // 5. bamboo_list_build_results
  // ============================================================================
  describe('bamboo_list_build_results', () => {
    it('should list build results with no filters', async () => {
      const mockResult = {
        results: {
          size: 25,
          'start-index': 0,
          'max-result': 25,
          result: [
            { key: 'PROJ-PLAN-42', buildState: 'Successful' },
            { key: 'PROJ-PLAN-41', buildState: 'Failed' },
          ],
        },
      };
      (mockClient.listBuildResults as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_list_build_results', {});

      expect(mockClient.listBuildResults).toHaveBeenCalledWith({
        projectKey: undefined,
        planKey: undefined,
        buildState: undefined,
        startIndex: undefined,
        maxResults: undefined,
        expand: undefined,
        includeAllStates: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should list build results with project filter', async () => {
      const mockResult = {
        results: {
          size: 10,
          result: [{ key: 'PROJ-PLAN1-42', buildState: 'Successful' }],
        },
      };
      (mockClient.listBuildResults as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_list_build_results', {
        project_key: 'PROJ',
      });

      expect(mockClient.listBuildResults).toHaveBeenCalledWith({
        projectKey: 'PROJ',
        planKey: undefined,
        buildState: undefined,
        startIndex: undefined,
        maxResults: undefined,
        expand: undefined,
        includeAllStates: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should list build results with build state filter', async () => {
      const mockResult = {
        results: {
          size: 5,
          result: [
            { key: 'PROJ-PLAN-40', buildState: 'Failed' },
            { key: 'PROJ-PLAN-38', buildState: 'Failed' },
          ],
        },
      };
      (mockClient.listBuildResults as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_list_build_results', {
        build_state: 'Failed',
      });

      expect(mockClient.listBuildResults).toHaveBeenCalledWith({
        projectKey: undefined,
        planKey: undefined,
        buildState: 'Failed',
        startIndex: undefined,
        maxResults: undefined,
        expand: undefined,
        includeAllStates: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should convert snake_case params to camelCase', async () => {
      const mockResult = {
        results: {
          size: 10,
          result: [],
        },
      };
      (mockClient.listBuildResults as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      await mockServer.invokeTool('bamboo_list_build_results', {
        project_key: 'PROJ',
        plan_key: 'PLAN',
        build_state: 'Successful',
        start_index: 10,
        max_results: 50,
        include_all_states: true,
      });

      expect(mockClient.listBuildResults).toHaveBeenCalledWith({
        projectKey: 'PROJ',
        planKey: 'PLAN',
        buildState: 'Successful',
        startIndex: 10,
        maxResults: 50,
        expand: undefined,
        includeAllStates: true,
      });
    });

    it('should list build results with all parameters', async () => {
      const mockResult = {
        results: {
          size: 3,
          result: [{ key: 'PROJ-PLAN-42', buildState: 'Successful' }],
        },
      };
      (mockClient.listBuildResults as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_list_build_results', {
        project_key: 'PROJ',
        plan_key: 'PLAN',
        build_state: 'Successful',
        start_index: 0,
        max_results: 10,
        expand: 'changes',
        include_all_states: false,
      });

      expect(mockClient.listBuildResults).toHaveBeenCalledWith({
        projectKey: 'PROJ',
        planKey: 'PLAN',
        buildState: 'Successful',
        startIndex: 0,
        maxResults: 10,
        expand: 'changes',
        includeAllStates: false,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should handle errors from listBuildResults', async () => {
      (mockClient.listBuildResults as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Invalid project key')
      );

      const result = await mockServer.invokeTool('bamboo_list_build_results', {
        project_key: 'INVALID',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Invalid project key' }],
        isError: true,
      });
    });
  });

  // ============================================================================
  // 6. bamboo_get_build_logs
  // ============================================================================
  describe('bamboo_get_build_logs', () => {
    it('should get build logs at plan level (no job_key)', async () => {
      const mockResult = {
        buildKey: 'PROJ-PLAN-42',
        jobs: [
          {
            jobKey: 'PROJ-PLAN-JOB1-42',
            logFiles: ['https://bamboo.example.com/logs/build.log'],
          },
          {
            jobKey: 'PROJ-PLAN-JOB2-42',
            logFiles: ['https://bamboo.example.com/logs/test.log'],
          },
        ],
        message: 'Log files are available via the URLs below. These require browser authentication to download.',
      };
      (mockClient.getBuildLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_build_logs', {
        build_key: 'PROJ-PLAN-42',
      });

      expect(mockClient.getBuildLogs).toHaveBeenCalledWith('PROJ-PLAN-42', undefined);
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should get build logs at job level (with job_key)', async () => {
      const mockResult = {
        buildKey: 'PROJ-PLAN-JOB1-42',
        logFiles: [
          'https://bamboo.example.com/logs/job1-build.log',
          'https://bamboo.example.com/logs/job1-test.log',
        ],
        message: 'Log files are available via the URLs below. These require browser authentication to download.',
      };
      (mockClient.getBuildLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_build_logs', {
        build_key: 'PROJ-PLAN-42',
        job_key: 'JOB1',
      });

      expect(mockClient.getBuildLogs).toHaveBeenCalledWith('PROJ-PLAN-42', 'JOB1');
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should handle no log files found', async () => {
      const mockResult = {
        buildKey: 'PROJ-PLAN-42',
        jobs: [],
        message: 'No log files found for this build.',
      };
      (mockClient.getBuildLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_build_logs', {
        build_key: 'PROJ-PLAN-42',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should handle errors from getBuildLogs', async () => {
      (mockClient.getBuildLogs as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Build not found')
      );

      const result = await mockServer.invokeTool('bamboo_get_build_logs', {
        build_key: 'INVALID-BUILD-123',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Build not found' }],
        isError: true,
      });
    });
  });

  // ============================================================================
  // 7. bamboo_get_build_result_logs
  // ============================================================================
  describe('bamboo_get_build_result_logs', () => {
    it('should get build result with logs using default max_log_lines', async () => {
      const mockResult = {
        key: 'PROJ-PLAN-JOB1-42',
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
      };
      (mockClient.getBuildResultWithLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_build_result_logs', {
        build_key: 'PROJ-PLAN-JOB1-42',
      });

      expect(mockClient.getBuildResultWithLogs).toHaveBeenCalledWith('PROJ-PLAN-JOB1-42', {
        maxLogLines: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should get build result with logs using custom max_log_lines', async () => {
      const mockResult = {
        key: 'PROJ-PLAN-JOB1-42',
        buildState: 'Successful',
        lifeCycleState: 'Finished',
        logEntries: {
          size: 500,
          'start-index': 0,
          'max-result': 500,
          logEntry: [],
        },
      };
      (mockClient.getBuildResultWithLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_build_result_logs', {
        build_key: 'PROJ-PLAN-JOB1-42',
        max_log_lines: 500,
      });

      expect(mockClient.getBuildResultWithLogs).toHaveBeenCalledWith('PROJ-PLAN-JOB1-42', {
        maxLogLines: 500,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should get plan result with aggregated logs from all jobs', async () => {
      const mockResult = {
        key: 'PROJ-PLAN-42',
        buildState: 'Successful',
        lifeCycleState: 'Finished',
        isJobResult: false,
        jobs: [
          {
            jobKey: 'PROJ-PLAN-JOB1-42',
            jobName: 'JOB1',
            buildState: 'Successful',
            logEntries: {
              size: 100,
              logs: [
                { date: '2024-01-01 00:00:00', log: 'Job 1 log' },
              ],
            },
          },
          {
            jobKey: 'PROJ-PLAN-JOB2-42',
            jobName: 'JOB2',
            buildState: 'Successful',
            logEntries: {
              size: 150,
              logs: [
                { date: '2024-01-01 00:01:00', log: 'Job 2 log' },
              ],
            },
          },
        ],
        totalLogEntries: 250,
      };
      (mockClient.getBuildResultWithLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_build_result_logs', {
        build_key: 'PROJ-PLAN-42',
      });

      expect(mockClient.getBuildResultWithLogs).toHaveBeenCalledWith('PROJ-PLAN-42', {
        maxLogLines: undefined,
      });
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });

    it('should handle errors from getBuildResultWithLogs', async () => {
      (mockClient.getBuildResultWithLogs as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Build not found')
      );

      const result = await mockServer.invokeTool('bamboo_get_build_result_logs', {
        build_key: 'INVALID-BUILD-123',
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: 'Error: Build not found' }],
        isError: true,
      });
    });

    it('should handle in-progress build result', async () => {
      const mockResult = {
        key: 'PROJ-PLAN-42',
        buildState: 'Unknown',
        lifeCycleState: 'InProgress',
        isJobResult: false,
        jobs: [
          {
            jobKey: 'PROJ-PLAN-JOB1-42',
            jobName: 'JOB1',
            buildState: 'Unknown',
            logEntries: {
              size: 25,
              logs: [
                { date: '2024-01-01 00:00:00', log: 'Building...' },
              ],
            },
          },
        ],
        totalLogEntries: 25,
      };
      (mockClient.getBuildResultWithLogs as ReturnType<typeof vi.fn>).mockResolvedValue(mockResult);

      const result = await mockServer.invokeTool('bamboo_get_build_result_logs', {
        build_key: 'PROJ-PLAN-42',
        max_log_lines: 100,
      });

      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(mockResult, null, 2) }],
      });
    });
  });
});
