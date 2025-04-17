# Appsmith Verification Workflow

This document outlines the process that Cursor should follow when verifying changes to the Appsmith codebase.

## Bug Fix Verification

When fixing a bug, follow these steps:

1. **Reproduce the issue**
   - Understand the reported bug and its root cause
   - Create a minimal reproduction of the issue
   - Identify the components affected

2. **Write test(s) for the bug**
   - Create failing tests that demonstrate the bug's existence
   - For frontend bugs: write Jest unit tests and/or Cypress integration tests
   - For backend bugs: write JUnit tests

3. **Implement the fix**
   - Make minimal, targeted changes to address the root cause
   - Ensure the tests now pass
   - Check for any unintended side effects

4. **Verify the fix**
   - Confirm the original issue is resolved
   - Run the full test suite to ensure no regressions
   - Check both development and production builds

5. **Quality checks**
   - Run type checking: `yarn run check-types`
   - Run linting: `yarn run lint`
   - Check for cyclic dependencies in client code
   - For backend: run Spotless checks
   - Verify Redux/React safety guidelines:
     - Use optional chaining (`?.`) or lodash/get for deep property access
     - Check for null/undefined before accessing nested properties
     - Avoid direct deep property chains (e.g., `obj.prop1.prop2.prop3`)
     - Handle potential nulls in Redux state access

6. **Performance verification**
   - Ensure the fix doesn't negatively impact performance
   - Check for memory leaks or increased resource usage
   - Verify response times aren't degraded

7. **CI/CD verification**
   - Ensure all GitHub workflow checks would pass with the changes
   - Verify both client and server builds

## Feature Implementation Verification

When implementing a new feature, follow these steps:

1. **Understand requirements**
   - Clearly define the feature's acceptance criteria
   - Identify all components that need to be modified

2. **Design test approach**
   - Plan unit, integration, and end-to-end tests before implementation
   - Create test scenarios that cover the feature's functionality
   - Consider edge cases and error handling

3. **Implement test cases**
   - Write tests for new functionality
   - Include positive and negative test cases
   - Cover edge cases and error conditions

4. **Implement the feature**
   - Develop the feature to pass the tests
   - Follow code style and patterns established in the project
   - Document the new functionality as needed

5. **Verify against acceptance criteria**
   - Confirm the feature meets all acceptance criteria
   - Perform manual testing for user experience
   - Get stakeholder sign-off if applicable

6. **Quality checks**
   - Same checks as for bug fixes
   - Additional check for documentation updates if needed
   - Verify UI/UX consistency

7. **Performance testing**
   - Check performance implications of the new feature
   - Ensure the feature is optimized for efficiency
   - Test under different load conditions if applicable

8. **CI/CD verification**
   - Same checks as for bug fixes
   - Additional check for new assets or dependencies

## Incrementally Learning From Changes

For each code change, Cursor should:

1. Analyze patterns in successful implementations
2. Record common pitfalls and how they were resolved
3. Update its understanding of the codebase structure
4. Note the relationships between components
5. Learn from test cases how different modules should interact
6. Understand the project's coding standards and conventions
7. Track performance considerations for different features
8. Maintain a knowledge graph of the codebase to provide better context

## Pre-commit Verification Checklist

Before considering a change complete, verify:

- [ ] All tests pass locally
- [ ] No linting issues reported
- [ ] Type checking passes
- [ ] No performance degradation
- [ ] Code follows project conventions
- [ ] Documentation is updated if needed
- [ ] No sensitive data is included
- [ ] The change satisfies the original requirements
- [ ] GitHub workflows would pass if the changes were committed
- [ ] React/Redux code follows safety best practices
  - [ ] Uses optional chaining or lodash/get for nested properties
  - [ ] Handles potential null values in state access
  - [ ] No direct deep object chaining without safety checks
  - [ ] Redux selectors properly handle state structure changes

## React/Redux Safety Guidelines

When working with React and Redux code, follow these guidelines:

### Safe Property Access

- **Avoid direct deep property access**:
  ```jsx
  // Unsafe
  const value = state.entities.users[userId].profile.preferences;
  
  // Safe - using optional chaining
  const value = state.entities?.users?.[userId]?.profile?.preferences;
  
  // Safe - using lodash/get with default value
  const value = get(state, `entities.users.${userId}.profile.preferences`, defaultValue);
  ```

### Redux State Access

- **Use selectors for all state access**:
  ```jsx
  // Define selector
  const getUserPreferences = (state, userId) => 
    get(state, ['entities', 'users', userId, 'profile', 'preferences'], {});
    
  // Use selector
  const preferences = useSelector(state => getUserPreferences(state, userId));
  ```

### Error Boundary Usage

- **Wrap components that access complex data structures**:
  ```jsx
  <ErrorBoundary fallback={<FallbackComponent />}>
    <ComponentWithComplexDataAccess />
  </ErrorBoundary>
  ```

### Data Validation

- **Validate data structure before usage**:
  ```jsx
  const isValidUserData = (userData) => 
    userData && 
    typeof userData === 'object' && 
    userData.profile !== undefined;
    
  // Use validation before accessing
  if (isValidUserData(userData)) {
    // Now safe to use userData.profile
  }
  ```

Following these guidelines will help prevent common issues like:
- Runtime errors from accessing properties of undefined
- Unexpected application crashes due to null property access
- Hard-to-debug errors in deeply nested state structures 