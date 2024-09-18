const _originalFetch = self.fetch;

export async function fetch(...args: Parameters<typeof _originalFetch>) {
  const request = new Request(args[0] as string, {
    ...args[1],
    credentials: "omit",
  });

  return _originalFetch(request);
}
