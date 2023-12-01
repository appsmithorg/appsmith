(function (nativeConsole) {
  const postMessage = (method, args) => {
    window.parent.postMessage(
      {
        type: "CUSTOM_WIDGET_CONSOLE",
        data: {
          type: method,
          args,
        },
      },
      "*",
    );
  };

  const createProxy = (method) =>
    new Proxy(nativeConsole[method], {
      apply(target, _this, args) {
        postMessage(method, args);
        return Reflect.apply(target, _this, args);
      },
    });

  ["log", "warn", "info"].forEach((method) => {
    nativeConsole[method] = createProxy(method);
  });

  window.addEventListener("error", (event) => {
    postMessage("error", [event.message]);
  });
})(window.console);
