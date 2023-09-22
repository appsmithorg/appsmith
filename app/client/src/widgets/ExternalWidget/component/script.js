((global) => {
  const modelSubscribers = [];
  let onReady;

  global.addEventListener("message", (event) => {
    if (event.data.model) {
      window.appsmith.model = event.data.model || {};
    }
    if (event.data.type === "READY") {
      onReady && onReady();
    } else {
      modelSubscribers.forEach((fn) => {
        if (event.source === global.parent) {
          fn(event.data.model);
        }
      });
    }
  });

  global.appsmith = {
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
    onReady: (fn) => {
      onReady = fn;
    },
  };
})(window);
