import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerServerTools } from '../../../src/tools/server.js';
import { createMockMcpServer, type MockMcpServer } from '../../helpers/mock-mcp-server.js';
import type { BambooClient } from '../../../src/bamboo-client.js';

describe('Server Tools', () => {
  let mockServer: MockMcpServer;
  let mockClient: Partial<BambooClient>;

  beforeEach(() => {
    mockServer = createMockMcpServer();
    mockClient = {
      getServerInfo: vi.fn(),
      healthCheck: vi.fn(),
    };
    registerServerTools(mockServer as any, mockClient as BambooClient);
  });

  describe('Tool Registration', () => {
    it('should register bamboo_server_info tool', () => {
      const tool = mockServer.getTool('bamboo_server_info');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_server_info');
      expect(tool?.description).toBe('Get Bamboo server information including version, edition, and state');
    });

    it('should register bamboo_health_check tool', () => {
      const tool = mockServer.getTool('bamboo_health_check');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('bamboo_health_check');
      expect(tool?.description).toBe('Check Bamboo server health status');
    });

    it('should register both tools with empty schema (no parameters)', () => {
      const serverInfoTool = mockServer.getTool('bamboo_server_info');
      const healthCheckTool = mockServer.getTool('bamboo_health_check');

      expect(serverInfoTool?.schema).toEqual({});
      expect(healthCheckTool?.schema).toEqual({});
    });
  });

  describe('bamboo_server_info', () => {
    it('should return server info on success', async () => {
      const mockServerInfo = {
        version: '9.2.1',
        edition: 'Data Center',
        buildDate: '2024-01-15T10:30:00.000Z',
        buildNumber: '90201',
        state: 'RUNNING',
      };

      vi.mocked(mockClient.getServerInfo!).mockResolvedValue(mockServerInfo);

      const result = await mockServer.invokeTool('bamboo_server_info', {});

      expect(mockClient.getServerInfo).toHaveBeenCalledOnce();
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockServerInfo, null, 2),
          },
        ],
      });
    });

    it('should return formatted error on API error', async () => {
      vi.mocked(mockClient.getServerInfo!).mockRejectedValue(new Error('Connection refused'));

      const result = await mockServer.invokeTool('bamboo_server_info', {});

      expect(mockClient.getServerInfo).toHaveBeenCalledOnce();
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Connection refused',
          },
        ],
        isError: true,
      });
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(mockClient.getServerInfo!).mockRejectedValue('Network failure');

      const result = await mockServer.invokeTool('bamboo_server_info', {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Network failure',
          },
        ],
        isError: true,
      });
    });
  });

  describe('bamboo_health_check', () => {
    it('should return health status on success', async () => {
      const mockHealthStatus = {
        status: 'RUNNING',
        healthy: true,
      };

      vi.mocked(mockClient.healthCheck!).mockResolvedValue(mockHealthStatus);

      const result = await mockServer.invokeTool('bamboo_health_check', {});

      expect(mockClient.healthCheck).toHaveBeenCalledOnce();
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockHealthStatus, null, 2),
          },
        ],
      });
    });

    it('should return formatted error on API error', async () => {
      vi.mocked(mockClient.healthCheck!).mockRejectedValue(new Error('Service unavailable'));

      const result = await mockServer.invokeTool('bamboo_health_check', {});

      expect(mockClient.healthCheck).toHaveBeenCalledOnce();
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: Service unavailable',
          },
        ],
        isError: true,
      });
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(mockClient.healthCheck!).mockRejectedValue(500);

      const result = await mockServer.invokeTool('bamboo_health_check', {});

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error: 500',
          },
        ],
        isError: true,
      });
    });
  });
});
