import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BambooClient } from '../bamboo-client.js';
import { formatError, jsonResponse } from './utils.js';

export function registerServerTools(server: McpServer, client: BambooClient): void {
  server.tool(
    'bamboo_server_info',
    'Get Bamboo server information including version, edition, and state',
    {},
    async () => {
      try {
        const info = await client.getServerInfo();
        return jsonResponse(info);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_health_check',
    'Check Bamboo server health status',
    {},
    async () => {
      try {
        const health = await client.healthCheck();
        return jsonResponse(health);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
