import { Action, PluginType } from "entities/Action";
import _ from "lodash";
import {
  getDynamicBindingsChangesSaga,
  getDynamicStringSegments,
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
    const action: Action = {
      cacheResponse: "",
      id: "61810f59a0f5113e30ba72ac",
      organizationId: "61800c6bd504bf710747bf9a",
      pluginType: PluginType.API,
      pluginId: "5ca385dc81b37f0004b4db85",
      name: "Api1",
      datasource: {
        // userPermissions: [],
        name: "DEFAULT_REST_DATASOURCE",
        pluginId: "5ca385dc81b37f0004b4db85",
        organizationId: "61800c6bd504bf710747bf9a",
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
      executeOnLoad: false,
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
      // messages: [],
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

    expect(_.isEqual(expectedResult, actualResult)).toBeTruthy();
  });
});
