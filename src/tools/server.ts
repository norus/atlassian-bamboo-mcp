import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BambooClient } from '../bamboo-client.js';

export function registerServerTools(server: McpServer, client: BambooClient): void {
  // Get server info
  server.tool(
    'bamboo_server_info',
    'Get Bamboo server information including version, edition, and state',
    {},
    async () => {
      try {
        const info = await client.getServerInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Health check
  server.tool(
    'bamboo_health_check',
    'Check Bamboo server health status',
    {},
    async () => {
      try {
        const health = await client.healthCheck();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(health, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
