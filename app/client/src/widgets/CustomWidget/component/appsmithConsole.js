(function (nativeConsole) {
  const postMessage = (method, args) => {
    window.parent.postMessage(
      {
        type: "CUSTOM_WIDGET_CONSOLE_EVENT",
        data: {
          type: method,
          args: args.map((d) => ({
            message: d,
          })),
        },
      },
      "*",
    );
  };

  const createProxy = (method) =>
    new Proxy(nativeConsole[method], {
      apply(target, _this, args) {
        try {
          postMessage(method, args);
        } finally {
          return Reflect.apply(target, _this, args);
        }
      },
    });

  ["log", "warn", "info"].forEach((method) => {
    nativeConsole[method] = createProxy(method);
  });

  window.addEventListener("error", (event) => {
    postMessage("error", [event.message]);
  });
})(window.console);
