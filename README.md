# Atlassian Bamboo MCP Server

[![CI](https://github.com/norus/atlassian-bamboo-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/norus/atlassian-bamboo-mcp/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/bamboo-mcp-server?color=red)](https://www.npmjs.com/package/bamboo-mcp-server)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.0-green)](https://modelcontextprotocol.io/)

A Model Context Protocol (MCP) server that brings Atlassian Bamboo CI/CD operations directly into AI assistants like Claude Code and Cursor.

## ❌ Without Bamboo MCP

Working with Bamboo CI/CD requires constant context switching:

- ❌ Switching to browser to check build status
- ❌ Manually navigating through Bamboo UI to find logs
- ❌ Copy-pasting build keys and deployment IDs
- ❌ No AI assistance for CI/CD troubleshooting

## ✅ With Bamboo MCP

Bamboo MCP brings your CI/CD operations directly into your AI workflow:

```txt
What's the status of the latest build for project MY-PROJECT?
```

```txt
Show me the deployment logs for deployment result 2661941325
```

```txt
Trigger a build for plan PROJ-PLAN with variable ENV=staging
```

No tab-switching, no manual navigation — just ask and get instant CI/CD insights.

## Features

- **26 tools** covering all major Bamboo operations
- **Build logs** with actual content (not just URLs)
- **Deployment logs** with full output
- **Proxy support** for corporate environments
- **TypeScript** with full type safety

## Installation

### Prerequisites

- Node.js 18+
- Bamboo personal access token ([how to create](#creating-a-bamboo-token))

### From Source

```bash
git clone https://github.com/norus/atlassian-bamboo-mcp.git
cd atlassian-bamboo-mcp
npm install
npm run build
```

### From npm

```bash
npm install -g bamboo-mcp-server
```

## Configuration

The server requires these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `BAMBOO_URL` | Yes | Base URL of your Bamboo server |
| `BAMBOO_TOKEN` | Yes | Personal access token |
| `BAMBOO_PROXY` | No | Proxy URL (e.g., `http://proxy:8080`) |

### Creating a Bamboo Token

1. Log into Bamboo
2. Go to **Profile** → **Personal access tokens**
3. Click **Create token**
4. Give it a name and appropriate permissions
5. Copy the token (you won't see it again)

## Setup

<details>
<summary><b>Claude Code</b></summary>

Run this command:

```bash
claude mcp add bamboo -- npx -y bamboo-mcp-server@latest
```

Or add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "bamboo": {
      "command": "npx",
      "args": ["-y", "bamboo-mcp-server@latest"],
      "env": {
        "BAMBOO_URL": "https://bamboo.example.com",
        "BAMBOO_TOKEN": "your-token"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

Add to your config file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bamboo": {
      "command": "npx",
      "args": ["-y", "bamboo-mcp-server@latest"],
      "env": {
        "BAMBOO_URL": "https://bamboo.example.com",
        "BAMBOO_TOKEN": "your-token",
        "BAMBOO_PROXY": "http://proxy:8080"
      }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "bamboo": {
      "command": "npx",
      "args": ["-y", "bamboo-mcp-server@latest"],
      "env": {
        "BAMBOO_URL": "https://bamboo.example.com",
        "BAMBOO_TOKEN": "your-token"
      }
    }
  }
}
```

</details>

<details>
<summary><b>npx</b></summary>

```bash
BAMBOO_URL="https://bamboo.example.com" \
BAMBOO_TOKEN="your-token" \
npx bamboo-mcp-server
```

</details>

<details>
<summary><b>Docker</b></summary>

#### Build the image

```bash
docker build -t bamboo-mcp-server .
```

#### Run with Docker

```bash
docker run -i --rm \
  -e BAMBOO_URL="https://bamboo.example.com" \
  -e BAMBOO_TOKEN="your-token" \
  -e BAMBOO_PROXY="http://host.docker.internal:8080" \
  bamboo-mcp-server
```

#### Proxy configuration

When using a proxy from Docker:
- **macOS/Windows**: Use `host.docker.internal` to reach the host (e.g., `http://host.docker.internal:8080`)
- **Linux**: Use `--network host` flag or the host's actual IP address

#### Use with Claude Desktop

```json
{
  "mcpServers": {
    "bamboo": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "BAMBOO_URL=https://bamboo.example.com",
        "-e", "BAMBOO_TOKEN=your-token",
        "-e", "BAMBOO_PROXY=http://host.docker.internal:8080",
        "bamboo-mcp-server"
      ]
    }
  }
}
```

#### Docker Compose

```yaml
services:
  bamboo-mcp:
    build: .
    environment:
      - BAMBOO_URL=https://bamboo.example.com
      - BAMBOO_TOKEN=${BAMBOO_TOKEN}
      - BAMBOO_PROXY=http://host.docker.internal:8080
    stdin_open: true
```

</details>

## Available Tools

### Server (2)

| Tool | Description |
|------|-------------|
| `bamboo_server_info` | Get Bamboo server version and state |
| `bamboo_health_check` | Check server health status |

### Projects (2)

| Tool | Description |
|------|-------------|
| `bamboo_list_projects` | List all projects |
| `bamboo_get_project` | Get project details by key |

### Plans (6)

| Tool | Description |
|------|-------------|
| `bamboo_list_plans` | List all build plans |
| `bamboo_get_plan` | Get plan details by key |
| `bamboo_search_plans` | Search plans by name |
| `bamboo_enable_plan` | Enable a build plan |
| `bamboo_disable_plan` | Disable a build plan |
| `bamboo_clone_plan` | Clone a build plan to a new plan |

### Branches (2)

| Tool | Description |
|------|-------------|
| `bamboo_list_plan_branches` | List branches for a plan |
| `bamboo_get_plan_branch` | Get branch details |

### Builds (7)

| Tool | Description |
|------|-------------|
| `bamboo_trigger_build` | Trigger a build (supports variables) |
| `bamboo_stop_build` | Stop a running build |
| `bamboo_get_build_result` | Get specific build result |
| `bamboo_get_latest_result` | Get latest build result |
| `bamboo_list_build_results` | List build results with filters |
| `bamboo_get_build_logs` | Get build log file URLs |
| `bamboo_get_build_result_logs` | Get build logs with actual content |

### Queue (2)

| Tool | Description |
|------|-------------|
| `bamboo_get_build_queue` | Get current build queue |
| `bamboo_get_deployment_queue` | Get deployment queue status |

### Deployments (6)

| Tool | Description |
|------|-------------|
| `bamboo_list_deployment_projects` | List deployment projects |
| `bamboo_get_deployment_project` | Get deployment project details |
| `bamboo_create_deployment_project` | Create a deployment project linked to a build plan |
| `bamboo_get_deployment_results` | Get deployment results for environment |
| `bamboo_get_deployment_result` | Get deployment result with logs |
| `bamboo_trigger_deployment` | Trigger a deployment |

## Example Prompts

```txt
Show me all failed builds in the last 24 hours
```

```txt
What's blocking the deployment queue?
```

```txt
Get the logs for build PROJ-PLAN-123 and tell me why it failed
```

```txt
Trigger a build for MY-PROJECT with variable DEPLOY_ENV=staging
```

```txt
List all branches for plan MY-PLAN and their build status
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run locally
BAMBOO_URL="https://bamboo.example.com" \
BAMBOO_TOKEN="your-token" \
node dist/index.js
```

## Troubleshooting

<details>
<summary><b>Connection refused / timeout</b></summary>

- Verify `BAMBOO_URL` is correct and accessible
- If behind a proxy, set `BAMBOO_PROXY`
- Check if your token has expired

</details>

<details>
<summary><b>401 Unauthorized</b></summary>

- Verify your `BAMBOO_TOKEN` is correct
- Ensure the token hasn't expired
- Check token permissions in Bamboo

</details>

<details>
<summary><b>Tool not found in Claude</b></summary>

- Restart Claude Code/Desktop after config changes
- Verify the path to `dist/index.js` is absolute
- Check Claude's MCP logs for errors

</details>

## Security

- **No hardcoded secrets** — all credentials via environment variables
- **Input validation** — Zod schemas on all tool inputs
- **Proxy support** — works in corporate environments
- **Read-heavy** — most operations are read-only

For security issues, please report via GitHub Security tab.

## License

MIT

## Contributing

Contributions welcome! Please read our contributing guidelines before submitting PRs.
