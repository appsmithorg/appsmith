import * as fetchIntercept from "fetch-intercept";

export default function interceptAndOverrideHttpRequest() {
  const XHRPrototype = XMLHttpRequest.prototype;
  //@ts-expect-error allow override
  self.XMLHttpRequest = function(args) {
    //@ts-expect-error allow override
    const obj = new XHRPrototype.constructor(args);
    Object.defineProperty(obj, "withCredentials", {
      configurable: false,
      writable: false,
      value: false,
    });
    return obj;
  };
  self.XMLHttpRequest.prototype = XHRPrototype;

  return fetchIntercept.register({
    request: function(...args) {
      const request = new Request(args[0], { ...args[1], credentials: "omit" });
      return [request];
    },
  });
}
