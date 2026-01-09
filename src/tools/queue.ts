import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BambooClient } from '../bamboo-client.js';

export function registerQueueTools(server: McpServer, client: BambooClient): void {
  // Get build queue
  server.tool(
    'bamboo_get_build_queue',
    'Get the current Bamboo build queue',
    {
      expand: z.string().optional().describe('Fields to expand (default: "queuedBuilds")'),
    },
    async ({ expand }) => {
      try {
        const queue = await client.getBuildQueue(expand);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(queue, null, 2),
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

  // Get deployment queue
  server.tool(
    'bamboo_get_deployment_queue',
    'Get the current Bamboo deployment queue',
    {},
    async () => {
      try {
        const queue = await client.getDeploymentQueue();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(queue, null, 2),
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
