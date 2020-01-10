import { transformRestAction } from "transformers/RestActionTransformer";
import { RestAction } from "api/ActionAPI";

const input: RestAction = {
  id: "testId",
  datasource: {
    id: "testDataSource",
  },
  name: "testName",
  pluginType: "API",
  actionConfiguration: {
    path: "users?page=1",
    queryParameters: [
      {
        key: "page",
        value: "1",
      },
    ],
  },
  jsonPathKeys: [],
};

const output = {
  id: "testId",
  datasource: {
    id: "testDataSource",
  },
  name: "testName",
  pluginType: "API",
  actionConfiguration: {
    path: "users",
    queryParameters: [
      {
        key: "page",
        value: "1",
      },
    ],
  },
  jsonPathKeys: [],
};

it("Transform the input", () => {
  const result = transformRestAction(input);
  expect(result).toEqual(output);
});
