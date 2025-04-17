# Lessons from Fixing Circular Dependencies in React Hooks

## Background

While working on the Appsmith codebase, we encountered a critical issue in the `useSyncParamsToPath` React hook that caused infinite re-renders and circular dependency problems. This hook was responsible for synchronizing URL paths and query parameters bidirectionally in the API panel. When a user changed the URL, parameters would get extracted and populated in the form, and when parameters were changed, the URL would get updated.

## The Problem

The initial implementation of the hook had several issues:

1. **Improper property access**: The hook was directly accessing nested properties like `values.actionConfiguration.path` without properly handling the case where these nested paths might not exist.

2. **Missing flexible configuration**: The hook couldn't be reused with different property paths since it had hardcoded property paths.

3. **Circular updates**: When the hook updated the path, it would trigger a re-render which would then trigger the hook again, causing an infinite loop.

4. **Missing safeguards**: The hook didn't have proper tracking of previous values or early exits to prevent unnecessary updates.

## The Solution

We implemented several patterns to fix these issues:

### 1. Safe nested property access using lodash/get

Instead of directly accessing nested properties:

```jsx
// Before
const path = values.actionConfiguration?.path;
const queryParameters = values.actionConfiguration?.queryParameters;
```

We used lodash's `get` function with default values:

```jsx
// After
import get from 'lodash/get';

const path = get(values, `${configProperty}.path`, "");
const queryParameters = get(values, `${configProperty}.params`, []);
```

This approach provides several benefits:
- Safely handles undefined or null intermediate values
- Provides sensible default values
- Makes the property path configurable using the `configProperty` parameter

### 2. Tracking previous values with useRef

We implemented a pattern to track previous values and prevent unnecessary updates:

```jsx
// Refs to track the last values to prevent infinite loops
const lastPathRef = useRef("");
const lastParamsRef = useRef<Property[]>([]);

useEffect(
  function syncParamsEffect() {
    // Early return if nothing has changed
    if (path === lastPathRef.current && isEqual(queryParameters, lastParamsRef.current)) {
      return;
    }
    
    // Update refs to current values
    lastPathRef.current = path;
    lastParamsRef.current = [...queryParameters];
    
    // Rest of the effect logic
  },
  [formValues, dispatch, formName, configProperty],
);
```

### 3. Directional updates

To prevent circular updates, we implemented a pattern where the hook would only process one update direction per effect execution:

```jsx
// Only one sync direction per effect execution to prevent loops
// Path changed - update params from path if needed
if (pathChanged) {
  // Logic to update params from path
  // Exit early after updating
  return;
}

// Params changed - update path from params if needed
if (paramsChanged) {
  // Logic to update path from params
}
```

### 4. Deep comparisons for complex objects

For comparing arrays of parameters, we implemented custom comparison logic that compares the actual values rather than just checking references:

```jsx
// Helper function to check if two arrays of params are functionally equivalent
const areParamsEquivalent = (params1: Property[], params2: Property[]): boolean => {
  if (params1.length !== params2.length) return false;
  
  // Create a map of key-value pairs for easier comparison
  const paramsMap1 = params1.reduce((map, param) => {
    if (param.key) map[param.key] = param.value;
    return map;
  }, {} as Record<string, any>);
  
  const paramsMap2 = params2.reduce((map, param) => {
    if (param.key) map[param.key] = param.value;
    return map;
  }, {} as Record<string, any>);
  
  return isEqual(paramsMap1, paramsMap2);
};
```

## Key Takeaways for React Hook Development

1. **Always use safe property access**:
   - For deep nested properties, use lodash's `get` with default values
   - Alternatively, use optional chaining (`?.`) but remember it doesn't provide default values

2. **Track previous values to prevent infinite loops**:
   - Use `useRef` to store previous values between renders
   - Compare new values against previous values before making updates

3. **Implement early exits**:
   - If nothing has changed, return early from your hook
   - Use deep equality checks for objects and arrays (e.g., `isEqual` from lodash)

4. **Make effects unidirectional in a single execution**:
   - In bidirectional sync, handle only one direction per effect execution
   - Exit early after making updates in one direction

5. **Make hooks flexible and reusable**:
   - Use parameters for configuration (e.g., `configProperty`)
   - Don't hardcode property paths or selectors

6. **Test bidirectional hooks thoroughly**:
   - Write tests for both directions of data flow
   - Test edge cases (undefined values, empty arrays, etc.)
   - Verify the hook prevents infinite loops with nearly identical input

## Implementation Example

The `useSyncParamsToPath` hook provides a real-world example of these patterns in action:

```tsx
// Hook to sync query parameters with URL path in both directions
export const useSyncParamsToPath = (formName: string, configProperty: string) => {
  const dispatch = useDispatch();
  const formValues = useSelector((state) => getFormData(state, formName));
  // Refs to track the last values to prevent infinite loops
  const lastPathRef = useRef("");
  const lastParamsRef = useRef<Property[]>([]);
  
  useEffect(
    function syncParamsEffect() {
      if (!formValues || !formValues.values) return;

      const values = formValues.values;
      const actionId = values.id;

      if (!actionId) return;

      // Correctly access nested properties using lodash's get
      const path = get(values, `${configProperty}.path`, "");
      const queryParameters = get(values, `${configProperty}.params`, []);
      
      // Early return if nothing has changed
      if (path === lastPathRef.current && isEqual(queryParameters, lastParamsRef.current)) {
        return;
      }

      // Check if params have changed but path hasn't - indicating params tab update
      const paramsChanged = !isEqual(queryParameters, lastParamsRef.current);
      const pathChanged = path !== lastPathRef.current;
      
      // Update refs to current values
      lastPathRef.current = path;
      lastParamsRef.current = [...queryParameters];

      // Only one sync direction per effect execution to prevent loops
      
      // Path changed - update params from path if needed
      if (pathChanged) {
        // Logic to update params from path
        // Exit early to prevent circular updates
        return; 
      }
      
      // Params changed - update path from params if needed
      if (paramsChanged) {
        // Logic to update path from params
      }
    },
    [formValues, dispatch, formName, configProperty],
  );
};
```

By implementing these patterns, we fixed the circular dependency and infinite loop issues while making the hook more reusable and robust. 