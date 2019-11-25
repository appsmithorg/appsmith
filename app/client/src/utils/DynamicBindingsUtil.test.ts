import { getDynamicValue } from "./DynamicBindingUtils";
import { DataTree } from "reducers";

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
  const actualValue = "correct data";
  const value = getDynamicValue(dynamicBinding, dataTree);
  expect(value).toEqual(actualValue);
});
