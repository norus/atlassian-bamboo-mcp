import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BambooClient } from '../bamboo-client.js';
import { formatError, jsonResponse } from './utils.js';

export function registerProjectTools(server: McpServer, client: BambooClient): void {
  server.tool(
    'bamboo_list_projects',
    'List all Bamboo projects',
    {
      expand: z.string().optional().describe('Fields to expand in the response (e.g., "projects.project.plans")'),
      start_index: z.number().optional().describe('Starting index for pagination (default: 0)'),
      max_results: z.number().optional().describe('Maximum number of results to return (default: 25)'),
    },
    async ({ expand, start_index, max_results }) => {
      try {
        const projects = await client.listProjects({
          expand,
          startIndex: start_index,
          maxResults: max_results,
        });
        return jsonResponse(projects);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_project',
    'Get details of a specific Bamboo project by key',
    {
      project_key: z.string().describe('The project key (e.g., "PROJ")'),
      expand: z.string().optional().describe('Fields to expand in the response'),
    },
    async ({ project_key, expand }) => {
      try {
        const project = await client.getProject(project_key, expand);
        return jsonResponse(project);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
