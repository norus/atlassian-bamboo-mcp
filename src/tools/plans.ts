import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BambooClient } from '../bamboo-client.js';

export function registerPlanTools(server: McpServer, client: BambooClient): void {
  // List plans
  server.tool(
    'bamboo_list_plans',
    'List all Bamboo build plans',
    {
      expand: z.string().optional().describe('Fields to expand in the response (e.g., "plans.plan.stages")'),
      start_index: z.number().optional().describe('Starting index for pagination (default: 0)'),
      max_results: z.number().optional().describe('Maximum number of results to return (default: 25)'),
    },
    async ({ expand, start_index, max_results }) => {
      try {
        const plans = await client.listPlans({
          expand,
          startIndex: start_index,
          maxResults: max_results,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(plans, null, 2),
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

  // Get plan
  server.tool(
    'bamboo_get_plan',
    'Get details of a specific Bamboo build plan by key',
    {
      plan_key: z.string().describe('The plan key (e.g., "PROJ-PLAN")'),
      expand: z.string().optional().describe('Fields to expand in the response'),
    },
    async ({ plan_key, expand }) => {
      try {
        const plan = await client.getPlan(plan_key, expand);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(plan, null, 2),
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

  // Search plans
  server.tool(
    'bamboo_search_plans',
    'Search for Bamboo build plans by name',
    {
      name: z.string().describe('The plan name to search for'),
      fuzzy: z.boolean().optional().describe('Enable fuzzy matching (default: true)'),
      start_index: z.number().optional().describe('Starting index for pagination (default: 0)'),
      max_results: z.number().optional().describe('Maximum number of results to return (default: 25)'),
    },
    async ({ name, fuzzy, start_index, max_results }) => {
      try {
        const plans = await client.searchPlans(name, {
          fuzzy,
          startIndex: start_index,
          maxResults: max_results,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(plans, null, 2),
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

  // Enable plan
  server.tool(
    'bamboo_enable_plan',
    'Enable a Bamboo build plan',
    {
      plan_key: z.string().describe('The plan key to enable (e.g., "PROJ-PLAN")'),
    },
    async ({ plan_key }) => {
      try {
        await client.enablePlan(plan_key);
        return {
          content: [
            {
              type: 'text',
              text: `Plan ${plan_key} has been enabled successfully.`,
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

  // Disable plan
  server.tool(
    'bamboo_disable_plan',
    'Disable a Bamboo build plan',
    {
      plan_key: z.string().describe('The plan key to disable (e.g., "PROJ-PLAN")'),
    },
    async ({ plan_key }) => {
      try {
        await client.disablePlan(plan_key);
        return {
          content: [
            {
              type: 'text',
              text: `Plan ${plan_key} has been disabled successfully.`,
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
