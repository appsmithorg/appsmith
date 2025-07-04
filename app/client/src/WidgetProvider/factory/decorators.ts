import memo from "micro-memoize";

type AnyFn = (...args: unknown[]) => unknown;

interface MemoizedWithClear {
  (...args: unknown[]): unknown;
  clearCache: () => void;
}

// Track all memoized functions
const memoizedFunctions = new Set<MemoizedWithClear>();

// Function to clear memoized cache
function clearMemoizedCache(fn: {
  cache: { keys: unknown[]; values: unknown[] };
}) {
  fn.cache.keys.length = fn.cache.values.length = 0;
}

// Create a memoize wrapper that adds cache clearing capability
function memoizeWithClear(fn: AnyFn): MemoizedWithClear {
  const memoized = memo(fn, {
    maxSize: 100,
  }) as unknown as MemoizedWithClear;

  // Add clearCache method to the memoized function
  memoized.clearCache = () => {
    clearMemoizedCache(
      memoized as unknown as { cache: { keys: unknown[]; values: unknown[] } },
    );
  };

  // Add to tracked functions
  memoizedFunctions.add(memoized);

  return memoized;
}

export function memoize(
  target: unknown,
  methodName: unknown,
  descriptor: PropertyDescriptor,
) {
  descriptor.value = memoizeWithClear(descriptor.value);
}

export function freeze(
  target: unknown,
  methodName: unknown,
  descriptor: PropertyDescriptor,
) {
  const originalFunction = descriptor.value;

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptor.value = (...args: any[]) => {
    const result = originalFunction.apply(target, args);

    return Object.freeze(result);
  };
}

// Function to clear all memoized caches
export function clearAllWidgetFactoryCache() {
  memoizedFunctions.forEach((fn) => fn.clearCache());
}
