import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BambooClient } from '../bamboo-client.js';
import { formatError, jsonResponse, textResponse } from './utils.js';

export function registerBuildTools(server: McpServer, client: BambooClient): void {
  server.tool(
    'bamboo_trigger_build',
    'Trigger a build for a Bamboo plan',
    {
      plan_key: z.string().describe('The plan key to build (e.g., "PROJ-PLAN")'),
      stage: z.string().optional().describe('Specific stage to execute'),
      execute_all_stages: z.boolean().optional().describe('Execute all stages (default: true)'),
      custom_revision: z.string().optional().describe('Custom VCS revision to build'),
      variables: z.record(z.string()).optional().describe('Bamboo variables to pass to the build (key-value pairs)'),
    },
    async ({ plan_key, stage, execute_all_stages, custom_revision, variables }) => {
      try {
        const result = await client.triggerBuild(plan_key, {
          stage,
          executeAllStages: execute_all_stages,
          customRevision: custom_revision,
          variables,
        });
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_stop_build',
    'Stop a running build for a Bamboo plan',
    {
      plan_key: z.string().describe('The plan key to stop (e.g., "PROJ-PLAN")'),
    },
    async ({ plan_key }) => {
      try {
        const result = await client.stopBuild(plan_key);
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_build_result',
    'Get the result of a specific build',
    {
      build_key: z.string().describe('The build result key (e.g., "PROJ-PLAN-123")'),
      expand: z.string().optional().describe('Fields to expand (e.g., "changes,artifacts,testResults")'),
    },
    async ({ build_key, expand }) => {
      try {
        const result = await client.getBuildResult(build_key, expand);
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_latest_result',
    'Get the latest build result for a plan',
    {
      plan_key: z.string().describe('The plan key (e.g., "PROJ-PLAN")'),
      expand: z.string().optional().describe('Fields to expand (e.g., "changes,artifacts,testResults")'),
    },
    async ({ plan_key, expand }) => {
      try {
        const result = await client.getLatestBuildResult(plan_key, expand);
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_list_build_results',
    'List build results with optional filters',
    {
      project_key: z.string().optional().describe('Filter by project key'),
      plan_key: z.string().optional().describe('Filter by plan key (requires project_key)'),
      build_state: z.string().optional().describe('Filter by build state (e.g., "Successful", "Failed")'),
      start_index: z.number().optional().describe('Starting index for pagination (default: 0)'),
      max_results: z.number().optional().describe('Maximum number of results to return (default: 25)'),
      expand: z.string().optional().describe('Fields to expand in the response'),
      include_all_states: z.boolean().optional().describe('Include all build states including in-progress'),
    },
    async ({ project_key, plan_key, build_state, start_index, max_results, expand, include_all_states }) => {
      try {
        const results = await client.listBuildResults({
          projectKey: project_key,
          planKey: plan_key,
          buildState: build_state,
          startIndex: start_index,
          maxResults: max_results,
          expand,
          includeAllStates: include_all_states,
        });
        return jsonResponse(results);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_build_logs',
    'Get the build logs for a specific build. Returns log file URLs that can be accessed via browser.',
    {
      build_key: z.string().describe('The build result key (e.g., "PROJ-PLAN-123")'),
      job_key: z.string().optional().describe('Specific job key to get logs for'),
    },
    async ({ build_key, job_key }) => {
      try {
        const logs = await client.getBuildLogs(build_key, job_key);
        return jsonResponse(logs);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_build_result_logs',
    'Get build result with actual log content. For plan builds, fetches logs from all jobs. For job builds, returns logs directly.',
    {
      build_key: z.string().describe('The build result key - can be plan level (e.g., "PROJ-PLAN-123") or job level (e.g., "PROJ-PLAN-JOB1-123")'),
      max_log_lines: z.number().optional().describe('Maximum number of log lines per job (default: 1000)'),
    },
    async ({ build_key, max_log_lines }) => {
      try {
        const result = await client.getBuildResultWithLogs(build_key, {
          maxLogLines: max_log_lines,
        });
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_test_results',
    'Get a summary of test results for a build, including each failed test with its error messages (and the job it ran in for plan-level keys). Use this to find out why a build failed.',
    {
      build_key: z.string().describe('The build result key - plan level (e.g., "PROJ-PLAN-123") or job level (e.g., "PROJ-PLAN-JOB1-123")'),
    },
    async ({ build_key }) => {
      try {
        const result = await client.getTestResults(build_key);
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_build_comments',
    'Get comments on a build result',
    {
      build_key: z.string().describe('The build result key (e.g., "PROJ-PLAN-123")'),
    },
    async ({ build_key }) => {
      try {
        const result = await client.getBuildComments(build_key);
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_add_build_comment',
    'Add a comment to a build result',
    {
      build_key: z.string().describe('The build result key (e.g., "PROJ-PLAN-123")'),
      content: z.string().describe('The comment text'),
    },
    async ({ build_key, content }) => {
      try {
        await client.addBuildComment(build_key, content);
        return textResponse(`Comment added to build ${build_key}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_build_labels',
    'Get labels on a build result',
    {
      build_key: z.string().describe('The plan-level build result key (e.g., "PROJ-PLAN-123"); job-level keys are not accepted by Bamboo for labels'),
    },
    async ({ build_key }) => {
      try {
        const result = await client.getBuildLabels(build_key);
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_add_build_label',
    'Add a label to a build result',
    {
      build_key: z.string().describe('The plan-level build result key (e.g., "PROJ-PLAN-123"); job-level keys are not accepted by Bamboo for labels'),
      label: z.string().describe('The label name to add'),
    },
    async ({ build_key, label }) => {
      try {
        await client.addBuildLabel(build_key, label);
        return textResponse(`Label '${label}' added to build ${build_key}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_remove_build_label',
    'Remove a label from a build result',
    {
      build_key: z.string().describe('The plan-level build result key (e.g., "PROJ-PLAN-123"); job-level keys are not accepted by Bamboo for labels'),
      label: z.string().describe('The label name to remove'),
    },
    async ({ build_key, label }) => {
      try {
        await client.removeBuildLabel(build_key, label);
        return textResponse(`Label '${label}' removed from build ${build_key}`);
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'bamboo_get_broken_build_responsibility',
    'Get the users responsible for a broken build or plan',
    {
      plan_or_build_key: z.string().describe('A plan key (e.g., "PROJ-PLAN") or build result key (e.g., "PROJ-PLAN-123")'),
    },
    async ({ plan_or_build_key }) => {
      try {
        const result = await client.getBrokenBuildResponsibility(plan_or_build_key);
        return jsonResponse(result);
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
