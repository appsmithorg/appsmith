# CLAUDE.md - Appsmith Development Guide

This file provides guidance for Claude Code when working with the Appsmith codebase.

## Project Overview

Appsmith is a low-code platform for building internal tools. It's a monorepo with three main components:
- **Frontend (Client)**: React + Redux application at `app/client/`
- **Backend (Server)**: Spring Boot Java application at `app/server/`
- **RTS (Realtime Server)**: Node.js Express server at `app/client/packages/rts/`

## Quick Reference Commands

### Frontend (from `app/client/`)
```bash
yarn install              # Install dependencies
yarn start                # Start dev server
yarn build                # Production build
yarn test:unit            # Run unit tests
yarn lint                 # Run ESLint
yarn prettier             # Check Prettier formatting
yarn check-types          # TypeScript type check
```

### Backend (from `app/server/`)
```bash
mvn clean install         # Build and test
mvn spotless:apply        # Format code (run before committing)
mvn spotless:check        # Check formatting
mvn test                  # Run unit tests
```

## EE vs CE Architecture (CRITICAL)

Appsmith maintains parallel folder structures for Enterprise Edition (EE) and Community Edition (CE).

### Directory Structure
```
app/client/src/
├── ce/                    # Community Edition - base implementations
└── ee/                    # Enterprise Edition - extensions and premium features

app/server/appsmith-server/src/main/java/com/appsmith/server/
├── services/ce/           # CE service implementations
└── services/              # Wrapper services that extend CE
```

### File Creation Rules

**DEFAULT TO EE FOLDER** when creating new files:
- New features go in `ee/` first
- Premium/enterprise features (SSO, audit logs, RBAC)
- Enhanced components with additional functionality
- Organization/permission features
- License-gated functionality

**USE CE FOLDER** only for:
- Core infrastructure needed by both editions
- Bug fixes to existing CE files
- Shared types/interfaces
- Basic UI components without enterprise features

### The Re-export Pattern

When EE doesn't need to customize CE code, create a file in EE that re-exports:

```typescript
// ee/actions/applicationActions.ts
export * from "ce/actions/applicationActions";

// ee/AppRouter.tsx
export * from "ce/AppRouter";
import { default as CE_AppRouter } from "ce/AppRouter";
export default CE_AppRouter;
```

When EE needs to extend CE:
```typescript
// ee/components/MyComponent/index.tsx
import { BaseComponent } from "ce/components/MyComponent";

export function MyComponent(props) {
  // Enhanced EE implementation
}
```

### Import Conventions

**ALWAYS use absolute path aliases:**
```typescript
// CORRECT
import { Component } from "ce/components/Button";
import { hook } from "ee/hooks/useFeature";

// WRONG - never use relative imports across editions
import { Component } from "../../ce/components/Button";
```

### Backend EE/CE Pattern (Java)

```java
// 1. CE Interface (services/ce/)
public interface UserServiceCE {
    Mono<User> findById(String id);
}

// 2. CE Implementation (services/ce/)
public class UserServiceCEImpl implements UserServiceCE { }

// 3. Wrapper Interface (services/) - no CE suffix
public interface UserService extends UserServiceCE { }

// 4. Wrapper Implementation (services/)
@Service
public class UserServiceImpl extends UserServiceCEImpl implements UserService { }
```

## Tech Stack

### Frontend
- React 17.0.2 + TypeScript 5.5.4
- Redux + Redux Saga, Redux Toolkit 2.4.0
- Styled Components, Tailwind CSS, SASS
- Webpack 5.98.0
- Jest (unit), Cypress (E2E)
- Yarn 3.5.1 Workspaces

### Backend
- Spring Boot 3.3.13, Java 17
- Maven
- MongoDB (reactive), Redis
- Spring WebFlux, Project Reactor

### RTS
- Node.js 20.11.1, Express.js, TypeScript

## Code Style

### TypeScript/JavaScript
- ESLint with TypeScript strict mode
- Prettier: 80 char width, 2-space tabs, double quotes, trailing commas
- Avoid circular dependencies (checked in CI)
- Use lazy loading for CodeEditor and heavy components

### Java
- Google Java Format via Spotless
- Run `mvn spotless:apply` before committing
- Import order: java → javax → others → static

### EditorConfig
- UTF-8, LF line endings
- 2-space indent (4 for Java/Python/SQL)

## Pre-commit Hooks

Husky runs automatically on commit:
1. **Server changes**: `mvn spotless:apply`
2. **Client changes**: `npx lint-staged` (ESLint + Prettier)
3. **All files**: Gitleaks secret scanning

Pre-push hook prevents pushing EE code to CE repository.

## CI Quality Checks

Every PR runs:
- Server: Spotless check, unit tests
- Client: ESLint, Prettier, unit tests, cyclic dependency check
- Build verification
- Cypress E2E tests (on labeled PRs)

## File Naming Conventions

- **React Components**: PascalCase (`Button.tsx`, `UserProfile.tsx`)
- **Utilities/Hooks**: camelCase (`useAuth.ts`, `formatDate.ts`)
- **Tests**: `*.test.ts`, `*.test.tsx`, or `*.spec.ts`

## Import Order (Frontend)

1. React/React-related
2. Third-party libraries
3. Internal modules (absolute paths: `ce/`, `ee/`)
4. Relative imports
5. Style imports

## Key Patterns

1. **Reactive Programming**: Backend uses Spring WebFlux with Project Reactor
2. **Plugin Architecture**: Extensible data source connectors in `app/server/appsmith-plugins/`
3. **Feature Flags**: Gate EE features with `FEATURE_FLAG.license_*`
4. **Multi-tenant**: Organizations and workspaces model

## Security

- Gitleaks scans all staged files for secrets
- Never commit `.env` files with credentials
- Use environment variables for sensitive config

## Common Gotchas

1. **Always run `mvn spotless:apply`** before committing Java changes
2. **New files default to EE** - only use CE for core/shared code
3. **Use absolute imports** (`ce/...`, `ee/...`) not relative paths across editions
4. **Check for circular dependencies** - CI will fail if you introduce them
5. **Pre-push hook blocks EE code** from being pushed to CE repository
