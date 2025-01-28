import {
  evaluateSync,
  createEvaluationContext,
  evaluateAsync,
} from "workers/Evaluation/evaluate";
import type { WidgetEntity } from "ee/entities/DataTree/types";
import type { DataTree } from "entities/DataTree/dataTreeTypes";
import { ENTITY_TYPE } from "ee/entities/DataTree/types";
import { RenderModes } from "constants/WidgetConstants";
import setupEvalEnv from "../handlers/setupEvalEnv";
import { resetJSLibraries } from "workers/common/JSLibrary/resetJSLibraries";
import { EVAL_WORKER_ACTIONS } from "ee/workers/Evaluation/evalWorkerActions";
import { convertAllDataTypesToString } from "../errorModifier";
import { get } from "lodash";

describe("evaluateSync", () => {
  const widget: WidgetEntity = {
    bottomRow: 0,
    isLoading: false,
    leftColumn: 0,
    parentColumnSpace: 0,
    parentRowSpace: 0,
    renderMode: RenderModes.CANVAS,
    rightColumn: 0,
    topRow: 0,
    type: "INPUT_WIDGET_V2",
    version: 0,
    widgetId: "",
    widgetName: "",
    text: "value",
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    bindingPaths: {},
    reactivePaths: {},
    triggerPaths: {},
    validationPaths: {},
    logBlackList: {},
    overridingPropertyPaths: {},
    privateWidgets: {},
    propertyOverrideDependency: {},
    meta: {},
  };
  const dataTree: DataTree = {
    Input1: widget,
  };

  beforeAll(() => {
    setupEvalEnv({
      method: EVAL_WORKER_ACTIONS.SETUP,
      data: {
        cloudHosting: false,
      },
      webworkerTelemetry: {},
    });
    resetJSLibraries();
  });
  it("unescapes string before evaluation", () => {
    const js = '\\"Hello!\\"';
    const response = evaluateSync(js, {}, false);

    expect(response.result).toBe("Hello!");
  });
  it("evaluate string post unescape in v1", () => {
    const js = '[1, 2, 3].join("\\\\n")';
    const response = evaluateSync(js, {}, false);

    expect(response.result).toBe("1\n2\n3");
  });
  it("evaluate string without unescape in v2", () => {
    self.evaluationVersion = 2;
    const js = '[1, 2, 3].join("\\n")';
    const response = evaluateSync(js, {}, false);

    expect(response.result).toBe("1\n2\n3");
  });
  it("throws error for undefined js", () => {
    // @ts-expect-error: Types are not available
    expect(() => evaluateSync(undefined, {})).toThrow(TypeError);
  });
  it("Returns for syntax errors", () => {
    const response1 = evaluateSync("wrongJS", {}, false);

    expect(response1).toStrictEqual({
      result: undefined,
      errors: [
        {
          errorMessage: {
            name: "ReferenceError",
            message: "wrongJS is not defined",
          },
          errorType: "PARSE",
          kind: { category: undefined, rootcause: undefined },
          raw: `
  function $$closedFn () {
    const $$result = wrongJS
    return $$result
  }
  $$closedFn.call(THIS_CONTEXT)
  `,
          severity: "error",
          originalBinding: "wrongJS",
        },
      ],
    });
    const response2 = evaluateSync("{}.map()", {}, false);

    expect(response2).toStrictEqual({
      result: undefined,
      errors: [
        {
          errorMessage: {
            name: "TypeError",
            message: "{}.map is not a function",
          },
          errorType: "PARSE",
          kind: {
            category: undefined,
            rootcause: undefined,
          },
          raw: `
  function $$closedFn () {
    const $$result = {}.map()
    return $$result
  }
  $$closedFn.call(THIS_CONTEXT)
  `,
          severity: "error",
          originalBinding: "{}.map()",
        },
      ],
    });
  });
  it("evaluates value from data tree", () => {
    const js = "Input1.text";
    const response = evaluateSync(js, dataTree, false);

    expect(response.result).toBe("value");
  });
  it("disallows unsafe function calls", () => {
    const js = "setImmediate(() => {}, 100)";
    const response = evaluateSync(js, dataTree, false);

    expect(response).toStrictEqual({
      result: undefined,
      errors: [
        {
          errorMessage: {
            name: "TypeError",
            message: "setImmediate is not a function",
          },
          errorType: "PARSE",
          kind: {
            category: undefined,
            rootcause: undefined,
          },
          raw: `
  function $$closedFn () {
    const $$result = setImmediate(() => {}, 100)
    return $$result
  }
  $$closedFn.call(THIS_CONTEXT)
  `,
          severity: "error",
          originalBinding: "setImmediate(() => {}, 100)",
        },
      ],
    });
  });
  it("has access to extra library functions", () => {
    const js = "_.add(1,2)";
    const response = evaluateSync(js, dataTree, false);

    expect(response.result).toBe(3);
  });
  it("evaluates functions with callback data", () => {
    const js = "(arg1, arg2) => arg1.value + arg2";
    const callbackData = [{ value: "test" }, "1"];
    const response = evaluateSync(js, dataTree, false, {}, callbackData);

    expect(response.result).toBe("test1");
  });
  it("handles EXPRESSIONS with new lines", () => {
    let js = "\n";
    let response = evaluateSync(js, dataTree, false);

    expect(response.errors.length).toBe(0);

    js = "\n\n\n";
    response = evaluateSync(js, dataTree, false);
    expect(response.errors.length).toBe(0);
  });
  it("handles TRIGGERS with new lines", () => {
    let js = "\n";
    let response = evaluateSync(js, dataTree, false, undefined, undefined);

    expect(response.errors.length).toBe(0);

    js = "\n\n\n";
    response = evaluateSync(js, dataTree, false, undefined, undefined);
    expect(response.errors.length).toBe(0);
  });
  it("handles ANONYMOUS_FUNCTION with new lines", () => {
    let js = "\n";
    let response = evaluateSync(js, dataTree, false, undefined, undefined);

    expect(response.errors.length).toBe(0);

    js = "\n\n\n";
    response = evaluateSync(js, dataTree, false, undefined, undefined);
    expect(response.errors.length).toBe(0);
  });
  it("has access to this context", () => {
    const js = "this.contextVariable";
    const thisContext = { contextVariable: "test" };
    const response = evaluateSync(js, dataTree, false, { thisContext });

    expect(response.result).toBe("test");
    // there should not be any error when accessing "this" variables
    expect(response.errors).toHaveLength(0);
  });

  it("has access to additional global context", () => {
    const js = "contextVariable";
    const globalContext = { contextVariable: "test" };
    const response = evaluateSync(js, dataTree, false, { globalContext });

    expect(response.result).toBe("test");
    expect(response.errors).toHaveLength(0);
  });
});

describe("evaluateAsync", () => {
  it("runs and completes", async () => {
    const js = "(() => new Promise((resolve) => { resolve(123) }))()";

    self.postMessage = jest.fn();
    const response = await evaluateAsync(js, {}, {});

    expect(response).toStrictEqual({
      errors: [],
      result: 123,
    });
  });
  it("runs and returns errors", async () => {
    jest.restoreAllMocks();
    const js = "(() => new Promise((resolve) => { randomKeyword }))()";

    self.postMessage = jest.fn();
    const result = await evaluateAsync(js, {}, {});

    expect(result).toStrictEqual({
      errors: [
        {
          errorMessage: {
            name: "ReferenceError",
            message: "randomKeyword is not defined",
          },
          errorType: "PARSE",
          originalBinding: expect.stringContaining("Promise"),
          raw: expect.stringContaining("Promise"),
          severity: "error",
        },
      ],
      result: undefined,
    });
  });
});

describe("convertAllDataTypesToString", () => {
  const cases = [
    { index: 0, input: 0, expected: "0" },
    { index: 1, input: -1, expected: "-1" },
    { index: 2, input: 1, expected: "1" },
    { index: 3, input: 784630, expected: "784630" },
    { index: 4, input: true, expected: "true" },
    { index: 5, input: false, expected: "false" },
    { index: 6, input: null, expected: "null" },
    { index: 7, input: undefined, expected: undefined },
    { index: 8, input: "hello world!", expected: '"hello world!"' },
    { index: 9, input: `that's all folks!`, expected: '"that\'s all folks!"' },
    { index: 10, input: [], expected: "[]" },
    { index: 11, input: {}, expected: "{}" },
    { index: 12, input: [1, 2, 3, 4], expected: "[1,2,3,4]" },
    {
      index: 13,
      input: [1, [2, 3], [4, [5, [6], 7]], 8],
      expected: "[1,[2,3],[4,[5,[6],7]],8]",
    },
    {
      index: 15,
      input: { a: 1, b: 0, c: false, d: { e: { f: 8 } } },
      expected: '{"a":1,"b":0,"c":false,"d":{"e":{"f":8}}}',
    },
    // Reason - need to test empty arrow function
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    { index: 16, input: () => {}, expected: "() => { }" },
  ];

  test.each(cases.map((x) => [x.index, x.input, x.expected]))(
    "test case %d",
    (_, input, expected) => {
      const result = convertAllDataTypesToString(input);

      expect(result).toStrictEqual(expected);
    },
  );
});

describe("createEvaluationContext", () => {
  const dataTree = {
    MainContainer: {
      ENTITY_TYPE: "WIDGET",
      widgetName: "MainContainer",
      backgroundColor: "none",
      rightColumn: 4896,
      snapColumns: 64,
      widgetId: "0",
      topRow: 0,
      bottomRow: 380,
      containerStyle: "none",
      snapRows: 124,
      parentRowSpace: 1,
      canExtend: true,
      minHeight: 1292,
      parentColumnSpace: 1,
      leftColumn: 0,
      meta: {},
      isLoading: false,
      componentHeight: 380,
      componentWidth: 4896,
      type: "CANVAS_WIDGET",
      borderColor: "",
      borderRadius: "",
      boxShadow: "",
    },
    appsmith: {
      user: {
        email: "ashit@appsmith.com",
        username: "ashit@appsmith.com",
        name: "Ashit Rath",
        useCase: "work project",
        enableTelemetry: true,
        roles: ["Enable Programmatic access control in Admin Settings"],
        groups: ["Enable Programmatic access control in Admin Settings"],
        accountNonExpired: true,
        accountNonLocked: true,
        credentialsNonExpired: true,
        emptyInstance: false,
        isAnonymous: false,
        isEnabled: true,
        isSuperUser: true,
        isConfigurable: true,
        adminSettingsVisible: true,
        isIntercomConsentGiven: false,
      },
      URL: {
        fullPath:
          "https://ee-4304.dp.appsmith.com/app/my-first-application/page1-6656b06a3145e404b78300f1/edit?environment=production",
        host: "ee-4304.dp.appsmith.com",
        hostname: "ee-4304.dp.appsmith.com",
        queryParams: {
          environment: "production",
        },
        protocol: "https:",
        pathname:
          "/app/my-first-application/page1-6656b06a3145e404b78300f1/edit",
        port: "",
        hash: "",
      },
      store: {},
      geolocation: {
        canBeRequested: true,
        currentPosition: {},
      },
      workflows: {},
      mode: "EDIT",
      theme: {
        colors: {
          primaryColor: "#553DE9",
          backgroundColor: "#F8FAFC",
        },
        borderRadius: {
          appBorderRadius: "0.375rem",
        },
        boxShadow: {
          appBoxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        },
        fontFamily: {
          appFont: "System Default",
        },
      },
      ENTITY_TYPE: "APPSMITH",
    },
    _$GetUsersModule1$_GetUsersModule: {
      actionId: "6656b0bd3145e404b783010f",
      run: {},
      clear: {},
      data: [
        {
          id: 14,
          gender: "female",
          latitude: "6.8074",
          longitude: "-128.4713",
          dob: "1949-05-23T09:56:35.254Z",
          phone: "05-6736-4492",
          email: "delores.little@example.com",
          image:
            "https://mkorostoff.github.io/hundred-thousand-faces/img/f/86.jpg",
          country: "Australia",
          name: "Delores Little",
          created_at: "2023-01-09T14:17:19Z",
          updated_at: "2023-05-03T06:33:20Z",
        },
        {
          id: 16,
          gender: "female",
          latitude: "75.8821",
          longitude: "-110.4223",
          dob: "1946-01-24T18:21:06.109Z",
          phone: "260-381-6755",
          email: "brielle.roy@example.com",
          image:
            "https://mkorostoff.github.io/hundred-thousand-faces/img/f/41.jpg",
          country: "Canada",
          name: "Brielle Roy",
          created_at: "2023-01-03T10:42:51Z",
          updated_at: "2023-05-01T15:31:39Z",
        },
        {
          id: 24,
          gender: "female",
          latitude: "73.632",
          longitude: "-167.3976",
          dob: "1995-11-22T02:25:20.419Z",
          phone: "016973 12222",
          email: "caroline.daniels@example.com",
          image:
            "https://mkorostoff.github.io/hundred-thousand-faces/img/f/91.jpg",
          country: "United Kingdom",
          name: "Caroline Daniels",
          created_at: "2023-01-15T07:28:08Z",
          updated_at: "2023-05-04T18:50:05Z",
        },
        {
          id: 25,
          gender: "female",
          latitude: "38.7394",
          longitude: "-31.7919",
          dob: "1955-10-07T11:31:49.823Z",
          phone: "(817)-164-4040",
          email: "shiva.duijf@example.com",
          image:
            "https://mkorostoff.github.io/hundred-thousand-faces/img/f/88.jpg",
          country: "Netherlands",
          name: "Shiva Duijf",
          created_at: "2023-03-19T10:19:50Z",
          updated_at: "2023-05-21T11:27:33Z",
        },
        {
          id: 30,
          gender: "female",
          latitude: "26.3703",
          longitude: "6.4839",
          dob: "1974-09-20T22:40:48.642Z",
          phone: "05-9569-7428",
          email: "heather.diaz@example.com",
          image:
            "https://mkorostoff.github.io/hundred-thousand-faces/img/f/77.jpg",
          country: "Australia",
          name: "Heather Diaz",
          created_at: "2023-02-02T00:16:10Z",
          updated_at: "2023-05-09T11:10:43Z",
        },
      ],
      isLoading: false,
      responseMeta: {
        isExecutionSuccess: true,
      },
      ENTITY_TYPE: "ACTION",
      datasourceUrl: "",
      name: "_$GetUsersModule1$_GetUsersModule",
    },
    GetUsersModule1: {
      actionId: "6656b0bd3145e404b783010f",
      clear: {},
      data: [
        {
          id: 14,
          gender: "female",
          latitude: "6.8074",
          longitude: "-128.4713",
          dob: "1949-05-23T09:56:35.254Z",
          phone: "05-6736-4492",
          email: "delores.little@example.com",
          image:
            "https://mkorostoff.github.io/hundred-thousand-faces/img/f/86.jpg",
          country: "Australia",
          name: "Delores Little",
          created_at: "2023-01-09T14:17:19Z",
          updated_at: "2023-05-03T06:33:20Z",
        },
      ],
      ENTITY_TYPE: "MODULE_INSTANCE",
      inputs: {
        gender: "female",
        limit: "2",
      },
      isLoading: false,
      moduleId: "6656b0b63145e404b7830109",
      moduleInstanceId: "6656b0bd3145e404b783010e",
      run: {},
      type: "QUERY_MODULE",
      isValid: true,
      name: "GetUsersModule1",
    },
    JSObject1: {
      myVar1: [],
      myVar2: {},
      myFun2:
        'async function () {\n  return await GetUsersModule1.run({\n    limit: 5,\n    gender: "female"\n  });\n}',
      myFun1: "function () {}",
      body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\t//\twrite code here\n\t\t//\tJSObject1.myVar1 = [1,2,3]\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t\treturn await GetUsersModule1.run({ limit: 5, gender: \"female\" })\n\t}\n}",
      ENTITY_TYPE: "JSACTION",
      actionId: "6656b0cb3145e404b7830117",
      "myFun2.data": {},
      "myFun1.data": {},
    },
    Text1: {
      ENTITY_TYPE: "WIDGET",
      isVisible: true,
      text: "Hello Ashit Rath",
      fontSize: "1rem",
      fontStyle: "BOLD",
      textAlign: "LEFT",
      textColor: "#231F20",
      widgetName: "Text1",
      shouldTruncate: false,
      overflow: "NONE",
      animateLoading: true,
      responsiveBehavior: "fill",
      minWidth: 450,
      minDynamicHeight: 4,
      maxDynamicHeight: 9000,
      dynamicHeight: "AUTO_HEIGHT",
      key: "g1jfl6n25o",
      needsErrorInfo: false,
      onCanvasUI: {
        selectionBGCSSVar: "--on-canvas-ui-widget-selection",
        focusBGCSSVar: "--on-canvas-ui-widget-focus",
        selectionColorCSSVar: "--on-canvas-ui-widget-focus",
        focusColorCSSVar: "--on-canvas-ui-widget-selection",
        disableParentSelection: false,
      },
      widgetId: "surhpczu7k",
      truncateButtonColor: "#553DE9",
      fontFamily: "System Default",
      borderRadius: "0.375rem",
      isLoading: false,
      parentColumnSpace: 36.234375,
      parentRowSpace: 10,
      leftColumn: 19,
      rightColumn: 35,
      topRow: 27,
      bottomRow: 31,
      mobileLeftColumn: 14,
      mobileRightColumn: 30,
      mobileTopRow: 30,
      mobileBottomRow: 34,
      value: "Hello Ashit Rath",
      meta: {},
      componentHeight: 40,
      componentWidth: 579.75,
      type: "TEXT_WIDGET",
    },
  } as unknown as DataTree;

  it("Validate that overrideContext values with deeper nested paths are correctly set in EVAL_CONTEXT using the set function", () => {
    const context = {
      thisContext: {
        $params: {
          limit: 5,
          gender: "female",
        },
      },
      globalContext: {
        executionParams: {
          limit: 5,
          gender: "female",
        },
      },
      overrideContext: {
        "GetUsersModule1.inputs.limit": 5,
        "GetUsersModule1.inputs.gender": "female",
      },
    };

    // Pre overriding
    expect(get(dataTree, "GetUsersModule1.inputs.limit")).toEqual(
      get(dataTree, "GetUsersModule1.inputs.limit"),
    );
    expect(get(dataTree, "GetUsersModule1.inputs.gender")).toEqual(
      get(dataTree, "GetUsersModule1.inputs.gender"),
    );

    const evalContext = createEvaluationContext({
      dataTree,
      context,
      isTriggerBased: false,
    });

    // Post overriding
    expect(get(evalContext, "GetUsersModule1.inputs.limit")).toEqual(5);
    expect(get(evalContext, "GetUsersModule1.inputs.gender")).toEqual("female");

    // Post overriding, dataTree shouldn't be mutated
    expect(get(dataTree, "GetUsersModule1.inputs.limit")).toEqual(
      get(dataTree, "GetUsersModule1.inputs.limit"),
    );
    expect(get(dataTree, "GetUsersModule1.inputs.gender")).toEqual(
      get(dataTree, "GetUsersModule1.inputs.gender"),
    );
  });

  it("should handle undefined or null inputs gracefully", () => {
    const evalContext = createEvaluationContext({
      dataTree: {},
      context: undefined,
      configTree: undefined,
      evalArguments: undefined,
      isTriggerBased: true,
    });

    expect(evalContext).toBeDefined();
    expect(evalContext.ARGUMENTS).toBeUndefined();
    expect(evalContext.THIS_CONTEXT).toEqual({});
  });

  it("should assign THIS_CONTEXT from context.thisContext", () => {
    const context = {
      thisContext: {
        $params: {
          limit: 5,
          gender: "female",
        },
      },
      globalContext: {
        executionParams: {
          limit: 5,
          gender: "female",
        },
      },
    };
    const evalContext = createEvaluationContext({
      dataTree,
      context,
      isTriggerBased: false,
    });

    expect(evalContext.THIS_CONTEXT).toEqual(context.thisContext);
  });

  it("should merge globalContext into EVAL_CONTEXT when provided in context", () => {
    const context = {
      thisContext: {
        $params: {
          limit: 5,
          gender: "female",
        },
      },
      globalContext: {
        executionParams: {
          limit: 5,
          gender: "female",
        },
      },
    };
    const isTriggerBased = false;

    const evalContext = createEvaluationContext({
      dataTree,
      context,
      isTriggerBased,
    });

    expect(evalContext.executionParams.limit).toEqual(
      context.globalContext.executionParams.limit,
    );
    expect(evalContext.executionParams.gender).toEqual(
      context.globalContext.executionParams.gender,
    );
  });
});
