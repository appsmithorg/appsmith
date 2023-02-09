const _originalFetch = self.fetch;

export default function interceptAndOverrideHttpRequest() {
  Object.defineProperty(self, "fetch", {
    writable: false,
    configurable: false,
    value: function(...args: any) {
      if (self.ALLOW_SYNC) {
        self.IS_SYNC = false;
        return;
      }
      const request = new Request(args[0], { ...args[1], credentials: "omit" });
      return _originalFetch(request);
    },
  });
}
