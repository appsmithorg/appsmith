import type { DataTree } from "entities/DataTree/dataTreeFactory";
import { errorModifier } from "../errorModifier";
import DependencyMap from "entities/DependencyMap";

describe("Test error modifier", () => {
  const dataTree = {
    Api2: {
      run: {},
      clear: {},
      name: "Api2",
      pluginType: "API",
      config: {},
      dynamicBindingPathList: [
        {
          key: "config.path",
        },
      ],
      responseMeta: {
        isExecutionSuccess: false,
      },
      ENTITY_TYPE: "ACTION",
      isLoading: false,
      bindingPaths: {
        "config.path": "TEMPLATE",
        "config.body": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[2].value.limitBased.limit.value":
          "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        data: "TEMPLATE",
        isLoading: "TEMPLATE",
        datasourceUrl: "TEMPLATE",
        "config.path": "TEMPLATE",
        "config.body": "SMART_SUBSTITUTE",
        "config.pluginSpecifiedTemplates[1].value": "SMART_SUBSTITUTE",
      },
      dependencyMap: {
        "config.body": ["config.pluginSpecifiedTemplates[0].value"],
      },
      logBlackList: {},
      datasourceUrl: "",
      __evaluation__: {
        errors: {
          config: [],
        },
        evaluatedValues: {
          "config.path": "/users/undefined",
          config: {
            timeoutInMillisecond: 10000,
            paginationType: "NONE",
            path: "/users/test",
            headers: [],
            encodeParamsToggle: true,
            queryParameters: [],
            bodyFormData: [],
            httpMethod: "GET",
            selfReferencingDataPaths: [],
            pluginSpecifiedTemplates: [
              {
                value: true,
              },
            ],
            formData: {
              apiContentType: "none",
            },
          },
        },
      },
    },
    JSObject1: {
      name: "JSObject1",
      actionId: "637cda3b2f8e175c6f5269d5",
      pluginType: "JS",
      ENTITY_TYPE: "JSACTION",
      body: "export default {\n\tstoreTest2: () => {\n\t\tlet values = [\n\t\t\t\t\tstoreValue('val1', 'number 1'),\n\t\t\t\t\tstoreValue('val2', 'number 2'),\n\t\t\t\t\tstoreValue('val3', 'number 3'),\n\t\t\t\t\tstoreValue('val4', 'number 4')\n\t\t\t\t];\n\t\treturn Promise.all(values)\n\t\t\t.then(() => {\n\t\t\tshowAlert(JSON.stringify(appsmith.store))\n\t\t})\n\t\t\t.catch((err) => {\n\t\t\treturn showAlert('Could not store values in store ' + err.toString());\n\t\t})\n\t},\n\tnewFunction: function() {\n\t\tJSObject1.storeTest()\n\t}\n}",
      meta: {
        newFunction: {
          arguments: [],
          isAsync: false,
          confirmBeforeExecute: false,
        },
        storeTest2: {
          arguments: [],
          isAsync: true,
          confirmBeforeExecute: false,
        },
      },
      bindingPaths: {
        body: "SMART_SUBSTITUTE",
        newFunction: "SMART_SUBSTITUTE",
        storeTest2: "SMART_SUBSTITUTE",
      },
      reactivePaths: {
        body: "SMART_SUBSTITUTE",
        newFunction: "SMART_SUBSTITUTE",
        storeTest2: "SMART_SUBSTITUTE",
      },
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "newFunction",
        },
        {
          key: "storeTest2",
        },
      ],
      variables: [],
      dependencyMap: {
        body: ["newFunction", "storeTest2"],
      },
      __evaluation__: {
        errors: {
          storeTest2: [],
          newFunction: [],
          body: [],
        },
      },
    },
  } as unknown as DataTree;

  beforeAll(() => {
    const dependencyMap = new DependencyMap();
    errorModifier.updateAsyncFunctions(dataTree, {}, dependencyMap);
  });

  it("TypeError for defined Api in data field ", () => {
    const error = new Error();
    error.name = "TypeError";
    error.message = "Api2.run is not a function";
    const { errorMessage: result } = errorModifier.run(error);
    expect(result).toEqual({
      name: "ValidationError",
      message:
        "Found a reference to Api2.run() during evaluation. Data fields cannot execute framework actions. Please remove any direct/indirect references to Api2.run() and try again.",
    });
  });

  it("TypeError for undefined Api in data field ", () => {
    const error = new Error();
    error.name = "TypeError";
    error.message = "Api1.run is not a function";
    const { errorMessage: result } = errorModifier.run(error);
    expect(result).toEqual({
      name: "TypeError",
      message: "Api1.run is not a function",
    });
  });

  it("ReferenceError for platform function in data field", () => {
    const error = new Error();
    error.name = "ReferenceError";
    error.message = "storeValue is not defined";
    const { errorMessage: result } = errorModifier.run(error);
    expect(result).toEqual({
      name: "ValidationError",
      message:
        "Found a reference to storeValue() during evaluation. Data fields cannot execute framework actions. Please remove any direct/indirect references to storeValue() and try again.",
    });
  });

  it("ReferenceError for undefined function in data field", () => {
    const error = new Error();
    error.name = "ReferenceError";
    error.message = "storeValue2 is not defined";
    const { errorMessage: result } = errorModifier.run(error);
    expect(result).toEqual({
      name: error.name,
      message: error.message,
    });
  });
});
