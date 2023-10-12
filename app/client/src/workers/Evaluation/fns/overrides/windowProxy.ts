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
  _ctxReferenceId?: string,
  args?: any[],
): any {
  const req = new _internalXHR();
  req.open("POST", `/windowProxy/instruct`, false);
  req.send(
    JSON.stringify({ action, property, _referenceId, args, _ctxReferenceId }),
  );
  const res = JSON.parse(req.responseText);
  if (res.data && res.data.hasOwnProperty("_referenceId")) {
    const { _referenceId, _referenceType } = res.data;
    return new Proxy(
      res.data._referenceType === "function"
        ? function temp() {
            return {};
          }
        : { _referenceId, _referenceType, _isProxy: true },
      proxyHandlerFactory(_referenceId, _referenceType),
    );
  }
  return res.data;
}

function proxyHandlerFactory(_referenceId: string, _referenceType: string) {
  const handler: ProxyHandler<any> = {};
  if (_referenceType === "function") {
    handler.apply = function (_, thisArg, argumentsList) {
      argumentsList = argumentsList.map((arg) =>
        JSON.parse(JSON.stringify(arg)),
      );
      return getPropertyFromMainThread(
        "APPLY",
        null,
        _referenceId,
        thisArg._referenceId,
        argumentsList,
      );
    };
  } else {
    handler.get = function (target, property: string) {
      if (["_referenceId", "_referenceType"].includes(property))
        return Reflect.get(target, property);
      return getPropertyFromMainThread("GET", property, _referenceId);
    };
    handler.set = function (_, property: string, value) {
      return getPropertyFromMainThread(
        "SET",
        property,
        _referenceId,
        undefined,
        [value],
      );
    };
  }
  return handler;
}
