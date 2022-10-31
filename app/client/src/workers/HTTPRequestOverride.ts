import { register } from "fetch-intercept";

const _originalXMLHttpRequest = self.XMLHttpRequest;

export default function interceptAndOverrideHttpRequest() {
  return register({
    request: function(...args) {
      const request = new Request(args[0], { ...args[1], credentials: "omit" });
      return [request];
    },
  });
}
