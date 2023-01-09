const _originalFetch = self.fetch;

export default function interceptAndOverrideHttpRequest() {
  Object.defineProperty(self, "fetch", {
    writable: false,
    configurable: false,
    value: function(...args: any) {
      if (!self.ALLOW_ASYNC) {
        self.IS_ASYNC = true;
        return;
      }
      const request = new Request(args[0], { ...args[1], credentials: "omit" });
      return _originalFetch(request);
    },
  });
}
