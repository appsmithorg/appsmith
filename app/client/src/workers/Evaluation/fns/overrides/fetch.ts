const _originalFetch = self.fetch;
const _OriginalRequest = self.Request;

export async function fetch(...args: Parameters<typeof _originalFetch>) {
  const request = new _OriginalRequest(args[0] as string, {
    ...args[1],
    credentials: "omit",
  });

  return _originalFetch(request);
}
