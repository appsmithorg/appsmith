const _internalXHR = XMLHttpRequest;

export function initWindowProxy() {
  // @ts-expect-error: Types are not available
  self.window = new Proxy(
    {},
    {
      get(_, property: string) {
        return getPropertyFromMainThread("GET", property);
      },
    },
  );
}

function getPropertyFromMainThread(
  action: "GET" | "SET" | "DELETE" | "APPLY",
  property: string | null,
  _referenceId?: string,
  args?: any[],
): any {
  const req = new _internalXHR();
  req.open("POST", `/windowProxy/instruct`, false);
  req.send(JSON.stringify({ action, property, _referenceId, args }));
  const res = JSON.parse(req.responseText);
  debugger;
  if (res.data && res.data.hasOwnProperty("_referenceId")) {
    return new Proxy(
      res.data._referenceType === "function"
        ? function() {
            return {};
          }
        : {},
      proxyHandlerFactory(res.data._referenceId, res.data._referenceType),
    );
  }
  return res.data;
}

function proxyHandlerFactory(_referenceId: string, _referenceType: string) {
  const handler: ProxyHandler<any> = {};
  if (_referenceType === "function") {
    handler.apply = function(_, thisArg, argumentsList) {
      return getPropertyFromMainThread(
        "APPLY",
        null,
        _referenceId,
        argumentsList,
      );
    };
  } else {
    handler.get = function(_, property: string) {
      return getPropertyFromMainThread("GET", property, _referenceId);
    };
    handler.set = function(_, property: string, value) {
      return getPropertyFromMainThread("SET", property, _referenceId, [value]);
    };
  }
  return handler;
}
