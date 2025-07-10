# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cushion is a TypeScript monorepo library that acts as a middleware layer to absorb external API changes and maintain frontend stability. The library automatically transforms server responses to match expected client-side data structures, preventing breaking changes when external APIs evolve.

## Repository Structure

```
apps/
├── docs/          # VitePress documentation site
├── examples/      # Example implementations
└── playground/    # Interactive playground (Vite + React)

packages/
├── core/          # Main cushion library
├── react/         # React integration (planned)
├── vue/           # Vue integration (planned)
└── zod/           # Zod validation integration (planned)

tools/
├── biome-config/  # Shared Biome configuration
└── tsconfig/      # Shared TypeScript configurations
```

## Development Commands

### Core Development
```bash
# Install dependencies (uses pnpm)
pnpm install

# Build all packages
pnpm turbo build

# Run tests
pnpm turbo test

# Run linting (uses Biome instead of ESLint)
pnpm turbo lint

# Fix linting issues
pnpm turbo lint:fix

# Type checking
pnpm turbo type-check

# Development mode (watch)
pnpm turbo dev
```

### Package-Specific Commands
```bash
# Work on core package
cd packages/core
pnpm dev          # Watch mode with tsup
pnpm build        # Build with tsup
pnpm test         # Run tests with vitest
pnpm lint         # Check with biome
pnpm lint:fix     # Fix with biome
pnpm type-check   # TypeScript type checking
pnpm publint      # Validate package for publishing
```

### Testing
```bash
# Run all tests
pnpm turbo test

# Run tests in watch mode
cd packages/core && pnpm vitest watch

# Run tests with coverage
cd packages/core && pnpm vitest --coverage

# Run tests with verbose output
cd packages/core && pnpm test:comfort
```

## Architecture & Key Concepts

### Core Library Design
The library provides a cushioning layer between external APIs and frontend code:
- **setupCushion()**: Configures field mappings for specific API endpoints
- **absorb()**: Manual transformation function for one-off use cases
- Pattern-based routing for flexible endpoint matching
- Framework-agnostic design that works with any HTTP client

### Modern Tooling Stack (2025)
- **Biome**: Replaces ESLint + Prettier (Rust-based, faster)
- **Vitest**: Test runner (Vite-based, faster than Jest)
- **Tsup**: Build tool (esbuild-based bundler)
- **Turborepo**: Monorepo task orchestration
- **pnpm**: Package manager with workspace support
- **Changesets**: Version management and release automation

### Package Structure
- ESM-first approach (`"type": "module"`)
- Multiple entry points for tree-shaking
- TypeScript for type safety
- 80% test coverage requirement

### Key Implementation Patterns
1. **Monorepo with shared tooling**: Configurations in `/tools` directory
2. **Framework integrations**: Separate packages for React, Vue, Zod
3. **Multiple exports**: Core functionality split into `/core` and `/absorb` exports
4. **Progressive enhancement**: Works with any HTTP client (fetch, axios, etc.)

## Important Notes

- The project is in early development - core infrastructure is set up but minimal implementation exists
- No test files have been written yet
- React and Vue integration packages are empty placeholders
- Focus on developer experience with modern, fast tooling choices
- Uses Biome for linting/formatting (not ESLint/Prettier)
- Requires 80% test coverage when tests are implemented