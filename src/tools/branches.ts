import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BambooClient } from '../bamboo-client.js';
import { formatError, jsonResponse } from './utils.js';

export function registerBranchTools(server: McpServer, client: BambooClient): void {
  server.tool(
    'bamboo_list_plan_branches',
    'List all branches for a Bamboo build plan',
    {
      plan_key: z.string().describe('The plan key (e.g., "PROJ-PLAN")'),
      enabled_only: z.boolean().optional().describe('Only return enabled branches'),
      start_index: z.number().optional().describe('Starting index for pagination (default: 0)'),
      max_results: z.number().optional().describe('Maximum number of results to return (default: 25)'),
    },
    async ({ plan_key, enabled_only, start_index, max_results }) => {
      try {
        const branches = await client.listPlanBranches(plan_key, {
          enabledOnly: enabled_only,
          startIndex: start_index,
          maxResults: max_results,
        });
        return jsonResponse(branches);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_plan_branch',
    'Get details of a specific plan branch',
    {
      plan_key: z.string().describe('The plan key (e.g., "PROJ-PLAN")'),
      branch_name: z.string().describe('The branch name'),
    },
    async ({ plan_key, branch_name }) => {
      try {
        const branch = await client.getPlanBranch(plan_key, branch_name);
        return jsonResponse(branch);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
