export function logPerformance(
  this: any,
  target: unknown,
  name: string,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  const loggedFn = (...args: any) => {
    const start = performance.now();
    const result = original.apply(this, args);
    const end = performance.now();
    console.log(`${name} took ${end - start} milliseconds`);
    return result;
  };
  return {
    ...descriptor,
    value: loggedFn,
  };
}
