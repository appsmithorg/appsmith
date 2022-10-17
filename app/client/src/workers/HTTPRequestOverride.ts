import * as fetchIntercept from "fetch-intercept";

class DisallowedOriginError extends Error {}

const _originalXHR = self.XMLHttpRequest;
const _originalXHROpen = _originalXHR.prototype.open;

export default function interceptAndOverrideHttpRequest() {
  const XHRPrototype = XMLHttpRequest.prototype;
  //@ts-expect-error allow override
  self.XMLHttpRequest = function(args) {
    //@ts-expect-error allow override
    const obj = new XHRPrototype.constructor(args);
    obj.withCredentials = false;
    return obj;
  };
  XHRPrototype.open = function(
    method: string,
    url: string | URL,
    ...rest: any
  ) {
    let requestDestination = "";
    try {
      requestDestination = new URL(url)?.origin;
    } catch (e) {
      return _originalXHROpen.call(this, method, url as string, ...rest);
    }
    if (location.origin === requestDestination) {
      throw new DisallowedOriginError(
        `Cannot make requests to ${location.origin}`,
      );
    }
    return _originalXHROpen.call(this, method, url as string, ...rest);
  };
  self.XMLHttpRequest.prototype = XHRPrototype;

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
      config = { ...config, credentials: "omit" };
      return [url, config];
    },
  });
}
