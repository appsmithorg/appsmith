(function (nativeConsole) {
  const dispatchConsoleEvent = (method, args) => {
    const event = new CustomEvent("custom-widget-event", {
      detail: {
        type: "CUSTOM_WIDGET_CONSOLE_EVENT",
        data: {
          type: method,
          args: args.map((d) => ({
            message: d,
          })),
        },
      },
      bubbles: true,
      composed: true,
    });

    document.dispatchEvent(event);
  };

  const createProxy = (method) =>
    new Proxy(nativeConsole[method], {
      apply(target, _this, args) {
        try {
          dispatchConsoleEvent(method, args);
        } finally {
          return Reflect.apply(target, _this, args);
        }
      },
    });

  ["log", "warn", "info"].forEach((method) => {
    nativeConsole[method] = createProxy(method);
  });

  window.addEventListener("error", (event) => {
    dispatchConsoleEvent("error", [event.message]);
  });
})(window.console);
