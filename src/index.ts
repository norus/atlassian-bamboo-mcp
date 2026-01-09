#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createBambooClientFromEnv } from './bamboo-client.js';
import { registerServerTools } from './tools/server.js';
import { registerProjectTools } from './tools/projects.js';
import { registerPlanTools } from './tools/plans.js';
import { registerBranchTools } from './tools/branches.js';
import { registerBuildTools } from './tools/builds.js';
import { registerQueueTools } from './tools/queue.js';
import { registerDeploymentTools } from './tools/deployments.js';

async function main(): Promise<void> {
  // Create the Bamboo client from environment variables
  const client = createBambooClientFromEnv();

  // Create the MCP server
  const server = new McpServer({
    name: 'bamboo-mcp-server',
    version: '1.0.0',
  });

  // Register all tools
  registerServerTools(server, client);
  registerProjectTools(server, client);
  registerPlanTools(server, client);
  registerBranchTools(server, client);
  registerBuildTools(server, client);
  registerQueueTools(server, client);
  registerDeploymentTools(server, client);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
