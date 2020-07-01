import { transformRestAction } from "transformers/RestActionTransformer";
import { PluginType, RestAction } from "entities/Action";
import { POST_BODY_FORMAT_OPTIONS } from "constants/ApiEditorConstants";

// jest.mock("POST_");

const BASE_ACTION: RestAction = {
  dynamicBindingPathList: [],
  cacheResponse: "",
  executeOnLoad: false,
  invalids: [],
  isValid: false,
  organizationId: "",
  pageId: "",
  pluginId: "",
  id: "testId",
  datasource: {
    id: "testDataSource",
  },
  name: "testName",
  pluginType: PluginType.API,
  actionConfiguration: {
    httpMethod: "GET",
    path: "users",
  },
  jsonPathKeys: [],
};

describe("Api action transformer", () => {
  it("Removes params from path", () => {
    const input: RestAction = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        path: "users?page=1",
        queryParameters: [
          {
            key: "page",
            value: "1",
          },
        ],
      },
    };

    const output = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        path: "users",
        queryParameters: [
          {
            key: "page",
            value: "1",
          },
        ],
      },
    };
    const result = transformRestAction(input);
    expect(result).toEqual(output);
  });

  it("removes body for GET calls", () => {
    const input = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "GET",
        body: [null, null],
      },
    };
    const output = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "GET",
      },
    };
    const result = transformRestAction(input);
    expect(result).toEqual(output);
  });

  it("Sets the correct body for JSON display type", () => {
    const input = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "POST",
        headers: [{ key: "content-type", value: "application/json" }],
        body: "{ name: 'test' }",
      },
    };
    const output = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "POST",
        headers: [{ key: "content-type", value: "application/json" }],
        body: "{ name: 'test' }",
      },
    };
    const result = transformRestAction(input);
    expect(result).toEqual(output);
  });

  it("Sets the correct body for xxx-form-encoded-data display type", () => {
    const input = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "POST",
        headers: [
          { key: "content-type", value: POST_BODY_FORMAT_OPTIONS[1].value },
        ],
        bodyFormData: [{ key: "hey", value: "ho" }],
      },
    };
    const output = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "POST",
        headers: [
          { key: "content-type", value: POST_BODY_FORMAT_OPTIONS[1].value },
        ],
        body: "",
        bodyFormData: [{ key: "hey", value: "ho" }],
      },
    };
    const result = transformRestAction(input);
    expect(result).toEqual(output);
  });

  it("Sets the correct body for custom/raw display type", () => {
    const input = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        headers: [{ key: "content-type", value: "text/html" }],
        httpMethod: "POST",
        body: "raw body",
      },
    };
    const output = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        headers: [{ key: "content-type", value: "text/html" }],
        httpMethod: "POST",
        body: "raw body",
      },
    };
    const result = transformRestAction(input);
    expect(result).toEqual(output);
  });
});
