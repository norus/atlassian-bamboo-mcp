import { vi } from 'vitest';

interface RegisteredTool {
  name: string;
  description: string;
  schema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export interface ToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export function createMockMcpServer() {
  const registeredTools: Map<string, RegisteredTool> = new Map();

  const mockServer = {
    tool: vi.fn((
      name: string,
      description: string,
      schema: Record<string, unknown>,
      handler: (args: Record<string, unknown>) => Promise<unknown>
    ) => {
      registeredTools.set(name, { name, description, schema, handler });
    }),
    getRegisteredTools: () => registeredTools,
    getTool: (name: string) => registeredTools.get(name),
    invokeTool: async (name: string, args: Record<string, unknown>): Promise<ToolResult> => {
      const tool = registeredTools.get(name);
      if (!tool) throw new Error(`Tool ${name} not found`);
      return tool.handler(args) as Promise<ToolResult>;
    },
  };

  return mockServer;
}

export type MockMcpServer = ReturnType<typeof createMockMcpServer>;

/**
 * Parse JSON from a tool result's text content.
 */
export function parseResultJson<T = unknown>(result: ToolResult): T {
  return JSON.parse(result.content[0].text) as T;
}
