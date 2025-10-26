# Claude Code Configuration

This directory contains configuration for [Claude Code](https://claude.com/claude-code), Anthropic's AI coding assistant.

## Files

### `config.json`
Project-specific configuration that helps Claude Code understand:
- Project type and key conventions (ESM modules, TypeScript)
- Preferred tools and commands (build, test, lint)
- Important context about the codebase

### `commands/context.md`
A slash command `/context` that loads the AGENTS.md file. Use this at the start of a coding session to give Claude Code full context about the project architecture and conventions.

## Usage

When working with Claude Code on this project:

1. Run `/context` to load project context from AGENTS.md
2. Claude Code will automatically use the settings from `config.json`
3. These configurations help ensure consistent, project-appropriate assistance

## For Other AI Assistants

If you're using a different AI coding assistant:
- Read `../AGENTS.md` for comprehensive project documentation
- The `config.json` file provides hints about project structure and commands
- The slash commands are Claude Code specific, but the content is useful reference
