// import RealmExecutor from "jsExecution/RealmExecutor";
import {
  mockExecute,
  mockRegisterLibrary,
} from "../../test/__mocks__/RealmExecutorMock";
jest.mock("jsExecution/RealmExecutor", () => {
  return jest.fn().mockImplementation(() => {
    return { execute: mockExecute, registerLibrary: mockRegisterLibrary };
  });
});
import { getDynamicValue, parseDynamicString } from "./DynamicBindingUtils";
import { getNameBindingsWithData } from "selectors/nameBindingsWithDataSelector";
import { AppState, DataTree } from "reducers";

beforeAll(() => {
  mockRegisterLibrary.mockClear();
  mockExecute.mockClear();
});

it("Gets the value from the data tree", () => {
  const dynamicBinding = "{{GetUsers.data}}";
  const dataTree: Partial<DataTree> = {
    apiData: {
      id: {
        body: {
          data: "correct data",
        },
        headers: {},
        statusCode: "0",
        duration: "0",
        size: "0",
      },
      someOtherId: {
        body: {
          data: "wrong data",
        },
        headers: {},
        statusCode: "0",
        duration: "0",
        size: "0",
      },
    },
    nameBindings: {
      GetUsers: "$.apiData.id.body",
    },
  };
  const appState: Partial<AppState> = {
    entities: dataTree as DataTree,
  };
  const nameBindingsWithData = getNameBindingsWithData(appState as AppState);
  const actualValue = "correct data";

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

it("Parse the dynamic string", () => {
  const dynamicBinding = "{{GetUsers.data}}";
  const dataTree: Partial<DataTree> = {
    apiData: {
      id: {
        body: {
          data: "correct data",
        },
        headers: {},
        statusCode: "0",
        duration: "0",
        size: "0",
      },
      someOtherId: {
        body: {
          data: "wrong data",
        },
        headers: {},
        statusCode: "0",
        duration: "0",
        size: "0",
      },
    },
    nameBindings: {
      GetUsers: "$.apiData.id.body",
    },
  };
  const appState: Partial<AppState> = {
    entities: dataTree as DataTree,
  };
  const nameBindingsWithData = getNameBindingsWithData(appState as AppState);
  const actualValue = "correct data";

  const value = getDynamicValue(dynamicBinding, nameBindingsWithData);

  expect(value).toEqual(actualValue);
});
