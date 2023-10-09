import memo from "micro-memoize";

export function memoize(
  target: unknown,
  methodName: unknown,
  descriptor: PropertyDescriptor,
) {
  descriptor.value = memo(descriptor.value, {
    maxSize: 100,
  });
}

export function freeze(
  target: unknown,
  methodName: unknown,
  descriptor: PropertyDescriptor,
) {
  const originalFunction = descriptor.value;

  descriptor.value = (...args: any[]) => {
    const result = originalFunction.apply(target, args);

    return Object.freeze(result);
  };
}
