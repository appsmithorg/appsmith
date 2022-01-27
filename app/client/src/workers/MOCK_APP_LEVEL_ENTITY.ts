export default {
  JSObject1: {
    name: "JSObject1",
    actionId: "61f0da7a1707594a97848ed5",
    pluginType: "JS",
    ENTITY_TYPE: "JSACTION",
    body:
      "export default {\n\tdebouncedFunc: _.debounce((callback) => callback && callback(),500),\n}",
    meta: {
      debouncedFunc: {
        arguments: [],
      },
    },
    bindingPaths: {
      body: "SMART_SUBSTITUTE",
      debouncedFunc: "SMART_SUBSTITUTE",
    },
    dynamicBindingPathList: [
      {
        key: "body",
      },
      {
        key: "debouncedFunc",
      },
    ],
    variables: [],
    dependencyMap: {
      body: ["debouncedFunc"],
    },
    __evaluation__: {
      errors: {
        debouncedFunc: [
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'now' is not defined.",
            errorSegment: "        var time = now(),",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["now", null, null, null],
            code: "W117",
            line: 1,
            ch: 20,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'shouldInvoke' is not defined.",
            errorSegment: "            isInvoking = shouldInvoke(time);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["shouldInvoke", null, null, null],
            code: "W117",
            line: 2,
            ch: 26,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'lastArgs' is not defined.",
            errorSegment: "        lastArgs = arguments;",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["lastArgs", null, null, null],
            code: "W117",
            line: 3,
            ch: 9,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'lastThis' is not defined.",
            errorSegment: "        lastThis = this;",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["lastThis", null, null, null],
            code: "W117",
            line: 4,
            ch: 9,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'lastCallTime' is not defined.",
            errorSegment: "        lastCallTime = time;",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["lastCallTime", null, null, null],
            code: "W117",
            line: 5,
            ch: 9,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'lastCallTime' is not defined.",
            errorSegment: "            return leadingEdge(lastCallTime);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["lastCallTime", null, null, null],
            code: "W117",
            line: 9,
            ch: 32,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'lastCallTime' is not defined.",
            errorSegment: "            return invokeFunc(lastCallTime);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["lastCallTime", null, null, null],
            code: "W117",
            line: 16,
            ch: 31,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'timerId' is not defined.",
            errorSegment: "          if (timerId === undefined) {",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["timerId", null, null, null],
            code: "W117",
            line: 8,
            ch: 15,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'timerId' is not defined.",
            errorSegment: "            clearTimeout(timerId);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["timerId", null, null, null],
            code: "W117",
            line: 14,
            ch: 26,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'timerId' is not defined.",
            errorSegment:
              "            timerId = setTimeout(timerExpired, wait);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["timerId", null, null, null],
            code: "W117",
            line: 15,
            ch: 13,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'timerId' is not defined.",
            errorSegment: "        if (timerId === undefined) {",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["timerId", null, null, null],
            code: "W117",
            line: 20,
            ch: 13,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'timerId' is not defined.",
            errorSegment: "          timerId = setTimeout(timerExpired, wait);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["timerId", null, null, null],
            code: "W117",
            line: 21,
            ch: 11,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'leadingEdge' is not defined.",
            errorSegment: "            return leadingEdge(lastCallTime);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["leadingEdge", null, null, null],
            code: "W117",
            line: 9,
            ch: 20,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'maxing' is not defined.",
            errorSegment: "          if (maxing) {",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["maxing", null, null, null],
            code: "W117",
            line: 12,
            ch: 15,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'timerExpired' is not defined.",
            errorSegment:
              "            timerId = setTimeout(timerExpired, wait);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["timerExpired", null, null, null],
            code: "W117",
            line: 15,
            ch: 34,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'timerExpired' is not defined.",
            errorSegment: "          timerId = setTimeout(timerExpired, wait);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["timerExpired", null, null, null],
            code: "W117",
            line: 21,
            ch: 32,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'wait' is not defined.",
            errorSegment:
              "            timerId = setTimeout(timerExpired, wait);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["wait", null, null, null],
            code: "W117",
            line: 15,
            ch: 48,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'wait' is not defined.",
            errorSegment: "          timerId = setTimeout(timerExpired, wait);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["wait", null, null, null],
            code: "W117",
            line: 21,
            ch: 46,
          },
          {
            errorType: "LINT",
            raw:
              "\n  function closedFunction () {\n    const result = function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }\n    return result;\n  }\n  closedFunction()\n  ",
            severity: "error",
            errorMessage: "'invokeFunc' is not defined.",
            errorSegment: "            return invokeFunc(lastCallTime);",
            originalBinding:
              "function debounced() {\n        var time = now(),\n            isInvoking = shouldInvoke(time);\n        lastArgs = arguments;\n        lastThis = this;\n        lastCallTime = time;\n\n        if (isInvoking) {\n          if (timerId === undefined) {\n            return leadingEdge(lastCallTime);\n          }\n\n          if (maxing) {\n            // Handle invocations in a tight loop.\n            clearTimeout(timerId);\n            timerId = setTimeout(timerExpired, wait);\n            return invokeFunc(lastCallTime);\n          }\n        }\n\n        if (timerId === undefined) {\n          timerId = setTimeout(timerExpired, wait);\n        }\n\n        return result;\n      }",
            variables: ["invokeFunc", null, null, null],
            code: "W117",
            line: 16,
            ch: 20,
          },
        ],
        body: [],
      },
    },
  },
};
