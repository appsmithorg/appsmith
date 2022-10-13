import * as fetchIntercept from "fetch-intercept";

class DisallowedOriginError extends Error {}

const _originalOpen = self.XMLHttpRequest.prototype.open;

export default function interceptAndOverrideHttpRequest() {
  self.XMLHttpRequest.prototype.open = function(
    method,
    url: string | URL,
    ...rest: any
  ) {
    if (location.origin === new URL(url).origin) {
      throw new DisallowedOriginError(
        `Cannot make requests to ${location.origin}`,
      );
    }
    return _originalOpen.call(this, method, url as string, ...rest);
  };

  return fetchIntercept.register({
    request: function(url, config) {
      if (location.origin === new URL(url).origin)
        return Promise.reject(
          new DisallowedOriginError(
            `Cannot make requests to ${location.origin}`,
          ),
        );
      return [url, config];
    },
  });
}
