import memo from "micro-memoize";

export function memoize(options: { maxSize: number }) {
  return (
    target: unknown,
    methodName: unknown,
    descriptor: PropertyDescriptor,
  ) => {
    descriptor.value = memo(descriptor.value, {
      maxSize: options.maxSize || 1,
    });
  };
}
