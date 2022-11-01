export default function interceptAndOverrideHttpRequest() {
  self.fetch = (function(_originalFetch) {
    return (...args) => {
      const request = new Request(args[0], { ...args[1], credentials: "omit" });
      return _originalFetch.call(undefined, request);
    };
  })(self.fetch);
}
