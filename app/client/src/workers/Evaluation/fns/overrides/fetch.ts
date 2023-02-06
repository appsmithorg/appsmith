const _originalFetch = self.fetch;

export function fetch(...args: Parameters<typeof _originalFetch>) {
  const request = new Request(args[0], { ...args[1], credentials: "omit" });
  return _originalFetch(request);
}
