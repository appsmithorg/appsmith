import type { Action } from "entities/Action";
import { PluginType } from "entities/Plugin";
import equal from "fast-deep-equal/es6";
import {
  combineDynamicBindings,
  getDynamicBindings,
  getPropertyPath,
} from "./DynamicBindingUtils";
import {
  EVAL_VALUE_PATH,
  getDynamicBindingsChangesSaga,
  getDynamicStringSegments,
  getEvalValuePath,
  isChildPropertyPath,
} from "./DynamicBindingUtils";

describe.each([
  ["{{A}}", ["{{A}}"]],
  ["A {{B}}", ["A ", "{{B}}"]],
  [
    "Hello {{Customer.Name}}, the status for your order id {{orderId}} is {{status}}",
    [
      "Hello ",
      "{{Customer.Name}}",
      ", the status for your order id ",
      "{{orderId}}",
      " is ",
      "{{status}}",
    ],
  ],
  [
    "{{data.map(datum => {return {id: datum}})}}",
    ["{{data.map(datum => {return {id: datum}})}}"],
  ],
  ["{{}}{{}}}", ["{{}}", "{{}}", "}"]],
  ["{{{}}", ["{{{}}"]],
  ["{{ {{", ["{{ {{"]],
  ["}} }}", ["}} }}"]],
  ["}} {{", ["}} {{"]],
])("Parse the dynamic string(%s, %j)", (dynamicString, expected) => {
  test(`returns ${expected}`, () => {
    expect(getDynamicStringSegments(dynamicString as string)).toStrictEqual(
      expected,
    );
  });
});

describe("isChildPropertyPath function", () => {
  it("works", () => {
    const cases: Array<[string, string, boolean]> = [
      ["Table1.selectedRow", "Table1.selectedRow", true],
      ["Table1.selectedRow", "Table1.selectedRows", false],
      ["Table1.selectedRow", "Table1.selectedRow.email", true],
      ["Table1.selectedRow", "1Table1.selectedRow", false],
      ["Table1.selectedRow", "Table11selectedRow", false],
      ["Table1.selectedRow", "Table1.selectedRow", true],
      ["Dropdown1.options", "Dropdown1.options[1]", true],
      ["Dropdown1.options[1]", "Dropdown1.options[1].value", true],
      ["Dropdown1", "Dropdown1.options[1].value", true],
    ];

    cases.forEach((testCase) => {
      const result = isChildPropertyPath(testCase[0], testCase[1]);

      expect(result).toBe(testCase[2]);
    });
  });
});

describe("DynamicBindingPathlist", () => {
  it("Properly updates the dynamicBindingPathlist", () => {
    // @ts-expect-error: Action type mismatch
    const action: Action = {
      cacheResponse: "",
      id: "61810f59a0f5113e30ba72ac",
      workspaceId: "61800c6bd504bf710747bf9a",
      pluginType: PluginType.API,
      pluginId: "5ca385dc81b37f0004b4db85",
      name: "Api1",
      datasource: {
        // userPermissions: [],
        name: "DEFAULT_REST_DATASOURCE",
        pluginId: "5ca385dc81b37f0004b4db85",
        workspaceId: "61800c6bd504bf710747bf9a",
        datasourceConfiguration: {
          url: "https://thatcopy.pw",
        },
        invalids: [],
        messages: [],
        isValid: true,
        // new: true,
      },
      pageId: "61800cecd504bf710747bf9d",
      actionConfiguration: {
        // timeoutInMillisecond: 10000,
        // paginationType: "NONE",
        path: "/catapi/rest/",
        headers: [
          {
            key: "content-type",
            value: "application/json",
          },
        ],
        encodeParamsToggle: true,
        queryParameters: [
          {
            key: "{{Button1.text}}",
            value: "",
          },
          {
            key: "",
            value: "",
          },
        ],
        body: "{{Create_users.data}}",
        httpMethod: "POST",
        pluginSpecifiedTemplates: [
          {
            value: true,
          },
        ],
      },
      runBehavior: "MANUAL",
      dynamicBindingPathList: [
        {
          key: "body",
        },
        {
          key: "queryParameters[0].key",
        },
      ],
      isValid: true,
      invalids: [],
      messages: [],
      jsonPathKeys: ["Create_users.data", "Button1.text"],
      confirmBeforeExecute: false,
      // userPermissions: ["read:actions", "execute:actions", "manage:actions"],
      // validName: "Api1",
    };

    const value = [
      {
        key: "{{Button1.text}}",
        value: "",
      },
      {
        key: "",
        value: "",
      },
    ];
    const field = "actionConfiguration.queryParameters";

    const expectedResult = [
      {
        key: "body",
      },
      {
        key: "queryParameters[0].key",
      },
    ];

    const actualResult = getDynamicBindingsChangesSaga(action, value, field);

    expect(equal(expectedResult, actualResult)).toBeTruthy();
  });
});

describe("getPropertyPath function", () => {
  it("test getPropertyPath", () => {
    const testCases = [
      ["Table1.searchText", "searchText"],
      ["Table1.selectedRow", "selectedRow"],
      ["Table1.meta.searchText", "meta.searchText"],
      ["Table1", "Table1"],
      ["Table1.", ""],
    ];

    testCases.forEach(([input, expectedResult]) => {
      const actualResult = getPropertyPath(input);

      expect(actualResult).toStrictEqual(expectedResult);
    });
  });
});

describe("getNestedEvalPath", () => {
  it("returns valid nested path", () => {
    const actualUnpopulatedNestedPath = getEvalValuePath(
      "Table1.primaryColumns.state",
      {
        isPopulated: false,
        fullPath: true,
      },
    );
    const actualPopulatedNestedPath = getEvalValuePath(
      "Table1.primaryColumns.state",
      {
        isPopulated: true,
        fullPath: true,
      },
    );
    const expectedUnpopulatedNestedPath = `Table1.${EVAL_VALUE_PATH}.['primaryColumns.state']`;
    const expectedPopulatedNestedPath = `Table1.${EVAL_VALUE_PATH}.primaryColumns.state`;

    expect(actualPopulatedNestedPath).toEqual(expectedPopulatedNestedPath);
    expect(actualUnpopulatedNestedPath).toEqual(expectedUnpopulatedNestedPath);
  });
});

describe("getDynamicBindings and combineDynamicBindings  function", () => {
  const testCases = [
    {
      js: "(function(){return true;})()",
      jsSnippets: ["(function(){return true;})()"],
      propertyValue: "{{(function(){return true;})()}}",
      stringSegments: ["{{(function(){return true;})()}}"],
    },
    {
      js: '"Hello " + (Customer.Name) + ", the status for your order id " + (orderId) + " is " + (status)',
      jsSnippets: ["", "Customer.Name", "", "orderId", "", "status"],
      propertyValue:
        "Hello {{Customer.Name}}, the status for your order id {{orderId}} is {{status}}",
      stringSegments: [
        "Hello ",
        "{{Customer.Name}}",
        ", the status for your order id ",
        "{{orderId}}",
        " is ",
        "{{status}}",
      ],
    },
    {
      js: "(data.map(datum => {return {id: datum}}))",
      jsSnippets: ["data.map(datum => {return {id: datum}})"],
      propertyValue: "{{data.map(datum => {return {id: datum}})}}",
      stringSegments: ["{{data.map(datum => {return {id: datum}})}}"],
    },
    {
      js: '"{{}}"',
      jsSnippets: [""],
      propertyValue: "{{}}",
      stringSegments: ["{{}}"],
    },
    {
      js: "(Query1.data.splice(1).map((data, ind) => ({...data, ind })))",
      jsSnippets: [
        "Query1.data.splice(1).map((data, ind) => ({...data, ind }))",
      ],
      propertyValue:
        "{{Query1.data.splice(1).map((data, ind) => ({...data, ind }))}}",
      stringSegments: [
        "{{Query1.data.splice(1).map((data, ind) => ({...data, ind }))}}",
      ],
    },
    {
      js: "(JSObject1.myFun1())",
      jsSnippets: ["JSObject1.myFun1()"],
      propertyValue: "{{JSObject1.myFun1()}}",
      stringSegments: ["{{JSObject1.myFun1()}}"],
    },
    {
      js: "showAlert(currentItem.name + 'Name', '');\nshowAlert(Button1.text, '');",
      jsSnippets: [
        "showAlert(currentItem.name + 'Name', '');\nshowAlert(Button1.text, '');",
      ],
      propertyValue:
        "{{showAlert(currentItem.name + 'Name', '');\nshowAlert(Button1.text, '');}}",
      stringSegments: [
        "{{showAlert(currentItem.name + 'Name', '');\nshowAlert(Button1.text, '');}}",
      ],
    },
    {
      js: '"code " + ( currentItem.nol || "Blue;")',
      jsSnippets: ["", ' currentItem.nol || "Blue;"'],
      propertyValue: 'code {{ currentItem.nol || "Blue;"}}',
      stringSegments: ["code ", '{{ currentItem.nol || "Blue;"}}'],
    },
  ];

  it("Returns expected js string", () => {
    testCases.forEach(({ js, jsSnippets, propertyValue, stringSegments }) => {
      expect(getDynamicBindings(propertyValue)).toStrictEqual({
        jsSnippets,
        stringSegments,
      });
      expect(combineDynamicBindings(jsSnippets, stringSegments)).toEqual(js);
    });
  });
});
