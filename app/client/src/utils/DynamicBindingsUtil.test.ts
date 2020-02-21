// import RealmExecutor from "jsExecution/RealmExecutor";
import {
  mockExecute,
  mockRegisterLibrary,
} from "../../test/__mocks__/RealmExecutorMock";
import {
  dependencySortedEvaluateDataTree,
  getDynamicValue,
  getEntityDependencies,
  parseDynamicString,
} from "./DynamicBindingUtils";
import { DataTree, ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

jest.mock("jsExecution/RealmExecutor", () => {
  return jest.fn().mockImplementation(() => {
    return { execute: mockExecute, registerLibrary: mockRegisterLibrary };
  });
});

beforeAll(() => {
  mockRegisterLibrary.mockClear();
  mockExecute.mockClear();
});

it("Gets the value from the data tree", () => {
  const dynamicBinding = "{{GetUsers.data}}";
  const nameBindingsWithData: DataTree = {
    GetUsers: {
      data: { text: "correct data" },
      config: {
        id: "id",
        name: "text",
        actionConfiguration: {},
        pageId: "",
        jsonPathKeys: [],
        datasource: { id: "" },
        pluginType: "1",
      },
      isLoading: false,
      ENTITY_TYPE: ENTITY_TYPE.ACTION,
      run: jest.fn(),
    },
  };
  const actualValue = { result: { text: "correct data" } };

  const value = getDynamicValue(dynamicBinding, nameBindingsWithData);

  expect(value).toEqual(actualValue);
});

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
    expect(parseDynamicString(dynamicString as string)).toStrictEqual(expected);
  });
});

it("evaluates the data tree", () => {
  const input = {
    widget1: {
      displayValue: "{{widget2.computedProperty}}",
    },
    widget2: {
      computedProperty: "{{ widget2.data[widget2.index] }}",
      data: "{{ apiData.node }}",
      index: 2,
    },
    apiData: {
      node: ["wrong value", "still wrong", "correct"],
    },
  };

  const dynamicBindings = [
    ["widget1.displayValue", "widget2.computedProperty"],
    ["widget2.computedProperty", "widget2.data"],
    ["widget2.computedProperty", "widget2.index"],
    ["widget2.data", "apiData.node"],
  ];

  const output = {
    widget1: {
      displayValue: "correct",
    },
    widget2: {
      computedProperty: "correct",
      data: ["wrong value", "still wrong", "correct"],
      index: 2,
    },
    apiData: {
      node: ["wrong value", "still wrong", "correct"],
    },
  };

  const result = dependencySortedEvaluateDataTree(input, dynamicBindings, true);
  expect(result).toEqual(output);
});

it("finds dependencies of a entity", () => {
  const depMap: Array<[string, string]> = [
    ["Widget5.text", "Widget2.data.visible"],
    ["Widget1.options", "Action1.data"],
    ["Widget2.text", "Widget1.selectedOption"],
    ["Widget3.text", "Widget4.selectedRow.name"],
    ["Widget6.label", "Action1.data.label"],
  ];
  const entity = "Action1";
  const result = ["Widget1", "Widget2", "Widget5", "Widget6"];

  const actual = getEntityDependencies(depMap, entity);

  expect(actual).toEqual(result);
});
