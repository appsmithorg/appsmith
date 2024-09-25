((global) => {
  const modelSubscribers = [];
  const uiSubscribers = [];
  let onReady;
  // const heightObserver = new ResizeObserver((entries) => {
  //   const height = entries[0].contentRect.height;

  //   global.parent.postMessage(
  //     {
  //       type: "UPDATE_HEIGHT",
  //       data: {
  //         height,
  //       },
  //     },
  //     "*",
  //   );
  // });

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
        global.appsmith.modelProvider.subscribe(
          generateAppsmithCssVariables("model"),
        );
        global.appsmith.UIProvider.subscribe(
          generateAppsmithCssVariables("ui"),
        );

        // heightObserver.observe(global.document.body);
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
    // observeHeight: (element) => {
    //   heightObserver.disconnect();
    //   heightObserver.observe(element);
    // },
  };

  window.addEventListener("load", () => {
    global.parent.postMessage(
      {
        type: "READY",
      },
      "*",
    );
  });

  const generateAppsmithCssVariables = (provider) => (source) => {
    let cssTokens = document.getElementById(`appsmith-${provider}-css-tokens`);

    if (!cssTokens) {
      cssTokens = document.createElement("style");
      cssTokens.id = `appsmith-${provider}-css-tokens`;
      global.document.head.appendChild(cssTokens);
    }

    const cssTokensContent = Object.keys(source).reduce((acc, key) => {
      if (typeof source[key] === "string" || typeof source[key] === "number") {
        return `
      ${acc}
      --appsmith-${provider}-${key}: ${source[key]};
      `;
      } else {
        return acc;
      }
    }, "");

    cssTokens.innerHTML = `:root {${cssTokensContent}}`;
  };
})(window);
