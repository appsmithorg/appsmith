# Appsmith Testing Quick Reference

## Testing Requirements

### For Bug Fixes

1. **Unit Tests (Required)**
   - Reproduce the bug scenario
   - Verify the fix works correctly
   - Test edge cases and potential regressions
   - Place in the same directory as the fixed code with `.test.ts` extension

2. **End-to-End Tests (Required for user-facing changes)**
   - Create a Cypress test that simulates the user action that would trigger the bug
   - Verify the fix works correctly in the application context
   - Place in `app/client/cypress/e2e/Regression/`

3. **Redux/React Safety Tests (For Redux/React code)**
   - Test with both valid and null/undefined state structures
   - Verify that property access is handled safely
   - Test edge cases where nested properties might not exist

### For Feature Development

1. **Unit Tests (Required)**
   - Test each component or function individually
   - Cover the main functionality, edge cases, and error conditions
   - Place alongside the implemented code

2. **Integration Tests (For complex features)**
   - Test interactions between components
   - Verify that data flows correctly between components

3. **End-to-End Tests (For user-facing features)**
   - Simulate user interactions with the feature
   - Verify that the feature works correctly in the application context

## Test File Locations

- **Unit Tests:** Same directory as the code being tested (e.g., `Component.test.tsx`)
- **Cypress E2E Tests:** `app/client/cypress/e2e/Regression/[Category]/[Feature]_spec.js`
- **Backend Tests:** `app/server/src/test/java/com/appsmith/server/...`

## Templates

### Unit Test for Bug Fix (React Component)

```typescript
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MyComponent from "./MyComponent";

describe("MyComponent bug fix", () => {
  it("should reproduce the bug scenario", () => {
    // Arrange: Setup the conditions that trigger the bug
    render(<MyComponent prop="value" />);
    
    // Act: Perform the action that triggers the bug
    fireEvent.click(screen.getByText("Button"));
    
    // Assert: Verify the bug is fixed
    expect(screen.getByText("Expected Result")).toBeInTheDocument();
  });
  
  it("should maintain existing functionality", () => {
    // Test that related functionality still works
    render(<MyComponent prop="otherValue" />);
    expect(screen.getByText("Other Result")).toBeInTheDocument();
  });
});
```

### E2E Test for Bug Fix

```javascript
describe("Feature Bug Fix", { tags: ["@tag.Bugfix", "@tag.Regression"] }, function() {
  before(() => {
    cy.login();
    cy.createTestWorkspace();
  });

  it("should no longer exhibit the bug", () => {
    // Steps to reproduce the bug
    cy.get("[data-cy=element]").click();
    cy.get("[data-cy=other-element]").type("value");
    
    // Verify the bug is fixed
    cy.get("[data-cy=result]").should("have.text", "Expected Result");
  });
});
```

### Redux Safety Test

```typescript
import { configureStore } from '@reduxjs/toolkit';
import reducer, { selectUserData } from './userSlice';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import React from 'react';
import { useSelector } from 'react-redux';

describe("Redux safety tests", () => {
  // Test with missing nested properties
  it("should handle missing nested properties safely", () => {
    // Create store with incomplete state
    const store = configureStore({
      reducer: {
        user: reducer
      },
      preloadedState: {
        user: {
          // Missing nested user data structure
        }
      }
    });
    
    // Test selector with missing data
    const wrapper = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );
    
    const { result } = renderHook(() => useSelector(selectUserData), { wrapper });
    
    // Should not throw an error and return default/fallback value
    expect(result.current).toEqual(/* expected default value */);
  });
  
  it("should handle deep property access safely", () => {
    // Similar setup but with different state permutations
    // Test various incomplete state structures
  });
});
```

### Unit Test for Redux Sagas

```typescript
import { runSaga } from 'redux-saga';
import { mySaga } from './mySaga';

describe("mySaga", () => {
  it("should dispatch expected actions", async () => {
    // Mock dependencies
    const dispatched = [];
    const mockStore = {
      dispatch: (action) => dispatched.push(action),
      getState: () => ({ data: 'mock data' }),
    };
    
    // Run the saga
    await runSaga(mockStore, mySaga, { payload: { id: '123' } }).toPromise();
    
    // Assert expected actions were dispatched
    expect(dispatched).toEqual([
      { type: 'SOME_ACTION', payload: 'mock data' },
    ]);
  });
});
```

## Best Practices

1. **Test the User Experience**
   - Focus on testing what the user sees and experiences
   - Don't test implementation details unless necessary

2. **Use Descriptive Test Names**
   - Tests should clearly describe what they're testing
   - Use format: `should [expected behavior] when [condition]`

3. **Isolate Tests**
   - Each test should be independent
   - Don't rely on state from other tests

4. **Test Edge Cases**
   - Empty input, invalid input, boundary conditions
   - Error states and recovery
   - Null/undefined in Redux state trees
   - Missing nested properties

5. **Keep Tests Fast**
   - Tests should run quickly to encourage frequent testing
   - Use mocks for slow dependencies

6. **Test Coverage Guidelines**
   - 80%+ coverage for critical paths
   - Focus on business logic rather than UI details

7. **Redux/React Safety Testing**
   - Test selectors with incomplete state structures
   - Verify error boundaries catch property access errors
   - Test with various state permutations to ensure robustness

## Running Tests

### Frontend Unit Tests

```bash
cd app/client
yarn test         # Run all tests
yarn test:watch   # Run in watch mode
yarn test:coverage # Generate coverage report
```

### Cypress E2E Tests

```bash
cd app/client
yarn cypress:open  # Open Cypress UI
yarn cypress:run   # Run headless
```

### Backend Tests

```bash
cd app/server
./mvnw test
``` 