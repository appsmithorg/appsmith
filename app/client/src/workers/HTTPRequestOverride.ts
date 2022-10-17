import * as fetchIntercept from "fetch-intercept";

class DisallowedOriginError extends Error {}

const _originalXHR = self.XMLHttpRequest;
const _originalXHROpen = _originalXHR.prototype.open;

export default function interceptAndOverrideHttpRequest() {
  const XHRPrototype = Object.getPrototypeOf(_originalXHR);
  Object.assign(self, "XMLHttpRequest", {
    value: function(args: any) {
      const obj = new XHRPrototype.constructor(args);
      obj.withCredentials = false;
      return obj;
    },
  });
  self.XMLHttpRequest.prototype = XHRPrototype;
  self.XMLHttpRequest.prototype.open = function(
    method,
    url: string | URL,
    ...rest: any
  ) {
    try {
      const requestDestination = new URL(url)?.origin;
      if (location.origin === requestDestination) {
        throw new DisallowedOriginError(
          `Cannot make requests to ${location.origin}`,
        );
      }
    } catch (e) {}
    return _originalXHROpen.call(this, method, url as string, ...rest);
  };

  return fetchIntercept.register({
    request: function(url: string, config: any) {
      try {
        const requestDestination = new URL(url).origin;
        if (location.origin === requestDestination)
          return Promise.reject(
            new DisallowedOriginError(
              `Cannot make requests to ${location.origin}`,
            ),
          );
      } catch (e) {}
      config.credentials = "omit";
      return [url, config];
    },
  });
}
