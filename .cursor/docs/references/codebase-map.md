# Appsmith Codebase Map

This document provides a comprehensive overview of the Appsmith codebase structure to help Cursor AI better understand the organization and relationships between different components.

## Project Overview

Appsmith is a low-code platform that allows developers to build internal tools and dashboards by connecting to databases, APIs, and other data sources. The application consists of:

1. A React-based frontend (client)
2. A Java Spring Boot backend (server)
3. Various plugins for connecting to external data sources
4. A self-contained deployment architecture

## Directory Structure

The codebase is organized into the following main directories:

- `app/` - Contains the main application code
  - `client/` - Frontend application (React)
  - `server/` - Backend application (Java Spring Boot)
  - `util/` - Shared utilities
  - `monitoring/` - Monitoring and metrics

## Frontend Architecture (app/client)

The frontend is built with React, Redux, and TypeScript. Key directories include:

### Core Structure (app/client/src)
- `actions/` - Redux actions
- `reducers/` - Redux reducers
- `sagas/` - Redux sagas for side effects and async operations
- `selectors/` - Redux selectors
- `store.ts` - Redux store configuration

### UI Components
- `components/` - Reusable UI components
- `pages/` - Page-level components
- `widgets/` - Draggable widgets for the page builder
- `theme/` - Styling and theme definitions
- `icons/` - SVG icons and icon components

### Data and APIs
- `api/` - API client and service functions
- `constants/` - Application constants and configuration
- `utils/` - Utility functions
- `entities/` - Data models and entity definitions

### Edition-specific Code
- `ee/` - Enterprise Edition specific code
- `ce/` - Community Edition specific code

### Testing
- `test/` - Test utilities and mocks
- `cypress/` - End-to-end testing with Cypress

## Backend Architecture (app/server)

The backend is built with Java Spring Boot and MongoDB. Key packages include:

### Core Structure (app/server/appsmith-server/src/main/java/com/appsmith/server)
- `ServerApplication.java` - Main application entry point

### API Layer
- `controllers/` - REST API controllers
- `dtos/` - Data Transfer Objects
- `exceptions/` - Custom exception classes

### Business Logic
- `services/` - Business logic and service implementations
- `helpers/` - Helper classes and utilities
- `domains/` - Domain models

### Data Access
- `repositories/` - Data access repositories
- `configurations/` - Database and application configuration

### Features
- `applications/` - Application management
- `pages/` - Page management
- `actions/` - Action management (API, DB queries)
- `plugins/` - Plugin system for external integrations
- `datasources/` - Data source management
- `authentication/` - Authentication and authorization
- `organization/` - Organization management

### Extensions
- `appsmith-plugins/` - Plugin implementations
- `appsmith-git/` - Git integration features
- `appsmith-interfaces/` - Core interfaces
- `appsmith-ai/` - AI features implementation

## Key Concepts

### Frontend Concepts

1. **Widgets**: Draggable UI components that users can place on their pages
2. **Actions**: API calls, DB queries, or JS code that widgets can trigger
3. **Datasources**: Connections to external data sources like databases or APIs
4. **Pages**: Containers for widgets representing different views in an application
5. **Theme**: Visual styling applied to the entire application

### Backend Concepts

1. **Applications**: Container for pages and other resources
2. **Organizations**: Groups of users and applications
3. **Plugins**: Connectors to external services
4. **Actions**: Executable code blocks (API calls, DB queries)
5. **Datasources**: Connection configurations for external data systems

## Code Patterns

### Frontend Patterns

1. **Redux for State Management**:
   - Actions define state changes
   - Reducers implement state updates
   - Sagas handle side effects
   - Selectors extract state

2. **Component Structure**:
   - Functional components with hooks
   - Container/Presentation separation
   - Styled-components for styling
   - Typescript interfaces for type safety

3. **API Communication**:
   - Axios-based API clients
   - Redux sagas for async operations
   - Error handling middleware

### Backend Patterns

1. **Spring Boot Architecture**:
   - Controller -> Service -> Repository pattern
   - DTO pattern for API requests/responses
   - Reactive programming with Reactor

2. **Security**:
   - JWT-based authentication
   - RBAC (Role-Based Access Control)
   - Permission checks with Spring Security

3. **Database**:
   - MongoDB as primary datastore
   - Reactive repositories

## Common Workflows

### Frontend Development Workflow

1. Define Redux actions in `actions/`
2. Implement reducers in `reducers/`
3. Create sagas for async operations in `sagas/`
4. Build UI components in `components/` or `pages/`
5. Connect components to Redux using selectors

### Backend Development Workflow

1. Define DTOs in `dtos/`
2. Create domain models in `domains/`
3. Implement repositories in `repositories/`
4. Add business logic in `services/`
5. Expose APIs in `controllers/`

## Testing Approach

### Frontend Testing
- Unit tests with Jest and React Testing Library
- End-to-end tests with Cypress
- Visual regression tests

### Backend Testing
- Unit tests with JUnit
- Integration tests with Spring Boot Test
- API tests with RestAssured

## Performance Considerations

### Frontend Performance
- Memoization of heavy computations
- Code splitting for page loads
- Virtualization for large lists
- Optimized rendering with React.memo

### Backend Performance
- Query optimization in MongoDB
- Caching strategies
- Reactive programming for non-blocking operations

## Security Model

1. **Authentication**: JWT-based auth with refresh tokens
2. **Authorization**: RBAC with granular permissions
3. **Data Isolation**: Multi-tenancy support

## Enterprise vs Community Edition

The codebase is separated into:
- `ee/` - Enterprise features
- `ce/` - Community features

Key differences:
1. Enterprise: SSO, audit logs, role-based access
2. Community: Basic features, self-hosted option

## Important Files

### Frontend
- `client/src/index.tsx` - Application entry point
- `client/src/store.ts` - Redux store configuration
- `client/src/App.tsx` - Main application component

### Backend
- `server/appsmith-server/src/main/java/com/appsmith/server/ServerApplication.java` - Main entry point
- `server/appsmith-server/src/main/resources/application.yml` - Application configuration

## Development Guidelines

1. Follow the established patterns in the existing codebase
2. Use TypeScript interfaces for type safety in frontend
3. Add appropriate tests for all new features
4. Document complex logic with comments
5. Use reactive programming patterns in backend
6. Follow established file naming conventions

This map should help Cursor better understand the Appsmith codebase structure and provide more contextual assistance when working with the code. 