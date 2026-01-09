# Contributing

Thanks for your interest in contributing to Atlassian Bamboo MCP Server!

## Getting started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/atlassian-bamboo-mcp.git`
3. Install dependencies: `npm install`
4. Build: `npm run build`

## Development

```bash
# Build the project
npm run build

# Watch mode for development
npm run dev

# Run locally
BAMBOO_URL="https://bamboo.example.com" \
BAMBOO_TOKEN="your-token" \
node dist/index.js
```

## Submitting changes

1. Create a feature branch: `git checkout -b my-feature`
2. Make your changes
3. Test your changes locally with a Bamboo server
4. Commit using conventional commits: `git commit -m "feat: add new feature"`
5. Push to your fork: `git push origin my-feature`
6. Open a Pull Request

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new features
- `fix:` bug fixes
- `docs:` documentation changes
- `chore:` maintenance tasks
- `refactor:` code refactoring

## Adding new tools

When adding new Bamboo API tools:

1. Add the tool in the appropriate file under `src/tools/`
2. Register it in `src/index.ts`
3. Update the tool count in `README.md` if needed
4. Test with a real Bamboo server

## Questions?

Open an issue if you have questions or need help.
