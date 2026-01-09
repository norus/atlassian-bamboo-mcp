import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BambooClient } from '../bamboo-client.js';
import { formatError, jsonResponse } from './utils.js';

export function registerDeploymentTools(server: McpServer, client: BambooClient): void {
  server.tool(
    'bamboo_list_deployment_projects',
    'List all Bamboo deployment projects',
    {},
    async () => {
      try {
        const projects = await client.listDeploymentProjects();
        return jsonResponse(projects);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_deployment_project',
    'Get details of a specific deployment project',
    {
      project_id: z.string().describe('The deployment project ID'),
    },
    async ({ project_id }) => {
      try {
        const project = await client.getDeploymentProject(project_id);
        return jsonResponse(project);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_trigger_deployment',
    'Trigger a deployment to an environment',
    {
      version_id: z.string().describe('The release version ID to deploy'),
      environment_id: z.string().describe('The target environment ID'),
    },
    async ({ version_id, environment_id }) => {
      try {
        const result = await client.triggerDeployment(version_id, environment_id);
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_deployment_results',
    'Get deployment results for an environment',
    {
      environment_id: z.string().describe('The environment ID'),
      start_index: z.number().optional().describe('Starting index for pagination (default: 0)'),
      max_results: z.number().optional().describe('Maximum number of results to return (default: 25)'),
    },
    async ({ environment_id, start_index, max_results }) => {
      try {
        const results = await client.getDeploymentResults(environment_id, {
          startIndex: start_index,
          maxResults: max_results,
        });
        return jsonResponse(results);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_deployment_result',
    'Get a specific deployment result with optional logs',
    {
      deployment_result_id: z.string().describe('The deployment result ID'),
      include_logs: z.boolean().optional().describe('Include log entries (default: false)'),
      max_log_lines: z.number().optional().describe('Maximum number of log lines to return, most recent first (default: 1000)'),
    },
    async ({ deployment_result_id, include_logs, max_log_lines }) => {
      try {
        const result = await client.getDeploymentResult(deployment_result_id, {
          includeLogs: include_logs,
          maxLogLines: max_log_lines,
        });
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
