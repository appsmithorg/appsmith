((global) => {
  const modelSubscribers = [];
  const uiSubscribers = [];
  let onReady;

  global.addEventListener("message", (event) => {
    if (event.data.model) {
      window.appsmith.model = event.data.model;
    }
    if (event.data.dimensions) {
      window.appsmith.ui = event.data.dimensions;
    }

    switch (event.data.type) {
      case "READY_ACK":
        onReady && onReady();
        break;
      case "MODEL_UPDATE":
        modelSubscribers.forEach((fn) => {
          if (event.source === global.parent) {
            fn(event.data.model);
          }
        });
        break;
      case "UI_UPDATE":
        uiSubscribers.forEach((fn) => {
          if (event.source === global.parent) {
            fn(event.data.dimensions);
          }
        });
        break;
    }
  });

  global.appsmith = {
    UIProvider: {
      subscribe: (fn) => {
        uiSubscribers.push(fn);

        fn(global.appsmith.ui);

        return () => {
          const index = uiSubscribers.findIndex(fn);

          if (index > -1) {
            uiSubscribers.splice(index, 1);
          }
        };
      },
    },
    modelProvider: {
      subscribe: (fn) => {
        modelSubscribers.push(fn);

        fn(global.appsmith.model);

        return () => {
          const index = modelSubscribers.findIndex(fn);

          if (index > -1) {
            modelSubscribers.splice(index, 1);
          }
        };
      },
    },
    updateModel: (obj) => {
      global.parent.postMessage(
        {
          type: "UPDATE",
          data: obj,
        },
        "*",
      );
    },
    triggerEvent: (eventName, contextObj) => {
      global.parent.postMessage(
        {
          type: "EVENT",
          data: {
            eventName,
            contextObj,
          },
        },
        "*",
      );
    },
    model: {},
    ui: {},
    onReady: (fn) => {
      onReady = fn;
    },
  };

  window.addEventListener("load", () => {
    global.parent.postMessage(
      {
        type: "READY",
      },
      "*",
    );
  });
})(window);
