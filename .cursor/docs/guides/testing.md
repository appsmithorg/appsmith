# Appsmith Testing Guide

This guide outlines best practices for writing tests for the Appsmith codebase.

## Frontend Testing

### Unit Tests with Jest

Appsmith uses Jest for frontend unit tests. Unit tests should be written for individual components, utility functions, and Redux slices.

#### Test File Structure

Create test files with the `.test.ts` or `.test.tsx` extension in the same directory as the source file:

```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx
  utils/
    helpers.ts
    helpers.test.ts
```

#### Writing React Component Tests

```typescript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "./Button";

describe("Button component", () => {
  it("renders correctly with default props", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### Redux Testing

```typescript
import { configureStore } from "@reduxjs/toolkit";
import reducer, { 
  setUserInfo, 
  fetchUserInfo 
} from "./userSlice";

describe("User reducer", () => {
  it("should handle initial state", () => {
    expect(reducer(undefined, { type: "unknown" })).toEqual({
      userInfo: null,
      isLoading: false,
      error: null
    });
  });

  it("should handle setUserInfo", () => {
    const userInfo = { name: "Test User", email: "test@example.com" };
    expect(
      reducer(
        { userInfo: null, isLoading: false, error: null }, 
        setUserInfo(userInfo)
      )
    ).toEqual({
      userInfo,
      isLoading: false,
      error: null
    });
  });
});
```

### Testing Redux/React Safety Patterns

Safety when accessing deeply nested properties in Redux state is critical for application reliability. Here are patterns for testing these safety mechanisms:

#### Testing Redux Selectors with Incomplete State

```typescript
import { configureStore } from '@reduxjs/toolkit';
import reducer, { selectNestedData } from './dataSlice';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { useSelector } from 'react-redux';

describe("selectNestedData", () => {
  it("returns default value when state is incomplete", () => {
    // Set up store with incomplete state
    const store = configureStore({
      reducer: {
        data: reducer,
      },
      preloadedState: {
        data: {
          // Missing expected nested properties
        },
      },
    });

    // Wrap the hook with the Redux provider
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );

    // Render the hook with the selector
    const { result } = renderHook(() => useSelector(selectNestedData), { wrapper });

    // Verify the selector returns the fallback/default value
    expect(result.current).toEqual(/* expected default value */);
  });

  it("returns actual data when state is complete", () => {
    // Set up store with complete state
    const expectedData = { value: "test" };
    const store = configureStore({
      reducer: {
        data: reducer,
      },
      preloadedState: {
        data: {
          entities: {
            items: {
              123: {
                details: expectedData,
              },
            },
          },
        },
      },
    });

    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useSelector(state => 
      selectNestedData(state, '123')
    ), { wrapper });

    // Verify the selector returns the actual data
    expect(result.current).toEqual(expectedData);
  });
});
```

#### Testing Components with Error Boundaries

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from 'react-error-boundary';
import ComponentWithDeepAccess from './ComponentWithDeepAccess';

describe('ComponentWithDeepAccess with error boundary', () => {
  it('renders fallback UI when data is invalid', () => {
    // Define invalid data that would cause property access errors
    const invalidData = { 
      // Missing required nested structure
    };
    
    const FallbackComponent = () => <div>Error occurred</div>;
    
    render(
      <ErrorBoundary FallbackComponent={FallbackComponent}>
        <ComponentWithDeepAccess data={invalidData} />
      </ErrorBoundary>
    );
    
    // Verify the fallback component is rendered
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });
  
  it('renders normally with valid data', () => {
    // Define valid data with complete structure
    const validData = {
      user: {
        profile: {
          name: 'Test User'
        }
      }
    };
    
    const FallbackComponent = () => <div>Error occurred</div>;
    
    render(
      <ErrorBoundary FallbackComponent={FallbackComponent}>
        <ComponentWithDeepAccess data={validData} />
      </ErrorBoundary>
    );
    
    // Verify the component renders normally
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });
});
```

#### Testing Safe Property Access Utilities

```typescript
import { safeGet } from './propertyAccessUtils';

describe('safeGet utility', () => {
  it('returns the value when the path exists', () => {
    const obj = {
      a: {
        b: {
          c: 'value'
        }
      }
    };
    
    expect(safeGet(obj, 'a.b.c')).toBe('value');
  });
  
  it('returns default value when path does not exist', () => {
    const obj = {
      a: {}
    };
    
    expect(safeGet(obj, 'a.b.c', 'default')).toBe('default');
  });
  
  it('handles array indices in path', () => {
    const obj = {
      users: [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ]
    };
    
    expect(safeGet(obj, 'users.1.name')).toBe('User 2');
  });
  
  it('handles null and undefined input', () => {
    expect(safeGet(null, 'a.b.c', 'default')).toBe('default');
    expect(safeGet(undefined, 'a.b.c', 'default')).toBe('default');
  });
});
```

### Integration Tests with Cypress

Cypress is used for integration and end-to-end testing. These tests should verify the functionality of the application from a user's perspective.

#### Test File Structure

```
cypress/
  integration/
    Editor/
      Canvas.spec.ts
      PropertyPane.spec.ts
    Workspace/
      Applications.spec.ts
```

#### Writing Cypress Tests

```typescript
describe("Application Canvas", () => {
  before(() => {
    cy.visit("/applications/my-app/pages/page-1/edit");
  });

  it("should allow adding a widget to the canvas", () => {
    cy.get("[data-cy=entity-explorer]").should("be.visible");
    cy.get("[data-cy=widget-button]").drag("[data-cy=canvas-drop-zone]");
    cy.get("[data-cy=widget-card-button]").should("exist");
  });

  it("should open property pane when widget is selected", () => {
    cy.get("[data-cy=widget-card-button]").click();
    cy.get("[data-cy=property-pane]").should("be.visible");
    cy.get("[data-cy=property-pane-title]").should("contain", "Button");
  });
});
```

## Backend Testing

### Unit Tests with JUnit

Backend unit tests should validate individual components and services.

#### Test File Structure

```
src/test/java/com/appsmith/server/
  services/
    ApplicationServiceTest.java
    UserServiceTest.java
  controllers/
    ApplicationControllerTest.java
```

#### Writing Java Unit Tests

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class ApplicationServiceTest {

    @Autowired
    private ApplicationService applicationService;

    @MockBean
    private WorkspaceService workspaceService;

    @Test
    public void testCreateApplication() {
        // Arrange
        Application application = new Application();
        application.setName("Test Application");
        
        Workspace workspace = new Workspace();
        workspace.setId("workspace-id");
        
        Mono<Workspace> workspaceMono = Mono.just(workspace);
        when(workspaceService.findById(any())).thenReturn(workspaceMono);
        
        // Act
        Mono<Application> result = applicationService.createApplication(application, "workspace-id");
        
        // Assert
        StepVerifier.create(result)
            .assertNext(app -> {
                assertThat(app.getId()).isNotNull();
                assertThat(app.getName()).isEqualTo("Test Application");
                assertThat(app.getWorkspaceId()).isEqualTo("workspace-id");
            })
            .verifyComplete();
    }
}
```

### Integration Tests

Backend integration tests should verify interactions between different components of the system.

```java
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ApplicationControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Before
    public void setUp() {
        applicationRepository.deleteAll().block();
    }

    @Test
    public void testGetAllApplications() {
        // Test implementation
    }
}
```

## Best Practices

### General Test Guidelines

1. **Test Isolation**: Each test should be independent of others.
2. **Test Coverage**: Aim for 80%+ coverage for critical code paths.
3. **Avoid Implementation Details**: Test behavior, not implementation.
4. **Concise Tests**: Keep tests focused on one behavior or functionality.
5. **Descriptive Names**: Use clear test names that describe what is being tested.

### Redux/React Safety Best Practices

1. **Always Check Property Existence**: Test edge cases where properties might not exist.
2. **Use Defensive Programming**: Design components and selectors to handle incomplete data gracefully.
3. **Test Error Boundaries**: Verify that error boundaries correctly catch and handle errors from property access.
4. **Test Default Values**: Ensure selectors return appropriate defaults when data is missing.
5. **Test Different State Permutations**: Create tests with various combinations of missing or incomplete state to ensure robustness.

### Performance Considerations

1. **Mock Heavy Dependencies**: Use mocks for API calls, databases, etc.
2. **Optimize Test Speed**: Keep tests fast to encourage frequent testing.
3. **Use Focused Tests**: Test only what needs to be tested.

## Troubleshooting Tests

### Common Issues

1. **Flaky Tests**: Tests that sometimes pass and sometimes fail.
   - Solution: Make tests more deterministic, avoid race conditions.

2. **Memory Leaks**: Tests that consume increasing memory.
   - Solution: Clean up resources, avoid global state.

3. **Slow Tests**: Tests that take too long to run.
   - Solution: Mock heavy dependencies, parallelize when possible.

### React-Specific Issues

1. **Component State Issues**: Components not updating as expected.
   - Solution: Use `act()` for state updates, wait for async operations.

2. **Redux State Access Errors**: Errors when accessing nested properties.
   - Solution: Use optional chaining, lodash/get, or default values in selectors.

3. **Rendering Errors**: Components not rendering as expected.
   - Solution: Verify props, check for conditionals that might prevent rendering.

## Advanced Testing Techniques

### Property-Based Testing

Test with a wide range of automatically generated inputs to find edge cases.

### Snapshot Testing

Useful for detecting unintended changes in UI components.

### Visual Regression Testing

Compare screenshots of components to detect visual changes.

### Load and Performance Testing

Test system behavior under high load or stress conditions.

### A/B Testing

Compare different implementations to determine which performs better.

## Test Data Best Practices

### Creating Test Fixtures

- Create reusable fixtures for common test data
- Use descriptive names for test fixtures
- Keep test data minimal but sufficient

### Mocking External Services

- Mock external API calls and dependencies
- Use realistic mock responses
- Consider edge cases and error conditions

## Testing Standards

### Frontend Testing Standards

1. Aim for 80%+ test coverage for utility functions
2. Test all Redux slices thoroughly
3. Focus on critical user journeys in integration tests
4. Test responsive behavior for key components
5. Include accessibility tests for UI components

### Backend Testing Standards

1. Test all public service methods 
2. Test both successful and error cases
3. Test database interactions with real repositories
4. Test API endpoints with WebTestClient
5. Mock external services to isolate tests

## Running Tests

### Frontend Tests

```bash
# Run all Jest tests
cd app/client
yarn run test:unit

# Run a specific test file
yarn jest src/path/to/test.ts

# Run Cypress tests
npx cypress run
```

### Backend Tests

```bash
# Run all backend tests
cd app/server
./mvnw test

# Run a specific test class
./mvnw test -Dtest=ApplicationServiceTest
```

## Best Practices for Test-Driven Development

1. Write failing tests first
2. Start with simple test cases
3. Refactor after tests pass
4. Use descriptive test names
5. Keep tests independent
6. Avoid test interdependence
7. Test edge cases and error conditions
8. Keep tests fast
9. Avoid testing implementation details
10. Review and update tests when requirements change 