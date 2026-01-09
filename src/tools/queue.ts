import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BambooClient } from '../bamboo-client.js';
import { formatError, jsonResponse } from './utils.js';

export function registerQueueTools(server: McpServer, client: BambooClient): void {
  server.tool(
    'bamboo_get_build_queue',
    'Get the current Bamboo build queue',
    {
      expand: z.string().optional().describe('Fields to expand (default: "queuedBuilds")'),
    },
    async ({ expand }) => {
      try {
        const queue = await client.getBuildQueue(expand);
        return jsonResponse(queue);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_deployment_queue',
    'Get the current Bamboo deployment queue',
    {},
    async () => {
      try {
        const queue = await client.getDeploymentQueue();
        return jsonResponse(queue);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
