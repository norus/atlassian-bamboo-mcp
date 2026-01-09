/**
 * Shared utilities for MCP tool handlers
 */

interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Format a successful JSON response for MCP tools
 */
export function jsonResponse(data: unknown): ToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Format a text response for MCP tools
 */
export function textResponse(message: string): ToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
  };
}

/**
 * Format an error response for MCP tools
 */
export function formatError(error: unknown): ToolResponse {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: 'text',
        text: `Error: ${message}`,
      },
    ],
    isError: true,
  };
}
