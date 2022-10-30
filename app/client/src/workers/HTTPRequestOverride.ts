import * as fetchIntercept from "fetch-intercept";

export default function interceptAndOverrideHttpRequest() {
  return fetchIntercept.register({
    request: function(...args) {
      const request = new Request(args[0], { ...args[1], credentials: "omit" });
      return [request];
    },
  });
}
