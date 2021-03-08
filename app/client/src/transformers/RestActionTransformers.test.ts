import { transformRestAction } from "transformers/RestActionTransformer";
import { PluginType, ApiAction } from "entities/Action";
import { POST_BODY_FORMAT_OPTIONS } from "constants/ApiEditorConstants";

// jest.mock("POST_");

const BASE_ACTION: ApiAction = {
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
    encodeParamsToggle: true,
    path: "users",
    headers: [],
    timeoutInMillisecond: 5000,
  },
  jsonPathKeys: [],
};

describe("Api action transformer", () => {
  it("Removes params from path", () => {
    const input: ApiAction = {
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

  it("bodyFormData should not be reset for non xxx-form-encoded-data type", () => {
    const input = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "POST",
        headers: [{ key: "content-type", value: "application/json" }],
        body: "{ name: 'test' }",
        bodyFormData: [
          {
            key: "hey",
            value: "ho",
            editable: true,
            mandatory: false,
            description: "I been tryin to do it right",
            type: "",
          },
        ],
      },
    };
    const output = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "POST",
        headers: [{ key: "content-type", value: "application/json" }],
        body: "{ name: 'test' }",
        bodyFormData: [
          {
            key: "hey",
            value: "ho",
            editable: true,
            mandatory: false,
            description: "I been tryin to do it right",
            type: "",
          },
        ],
      },
    };
    const result = transformRestAction(input);
    expect(result).toEqual(output);
  });

  it("body should not be reset for xxx-form-encoded-data type", () => {
    const input = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "POST",
        headers: [
          { key: "content-type", value: POST_BODY_FORMAT_OPTIONS[1].value },
        ],
        bodyFormData: [
          {
            key: "hey",
            value: "ho",
            editable: true,
            mandatory: false,
            description: "I been tryin to do it right",
            type: "",
          },
        ],
        body: "{ name: 'test' }",
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
        body: "{ name: 'test' }",
        bodyFormData: [
          {
            key: "hey",
            value: "ho",
            editable: true,
            mandatory: false,
            description: "I been tryin to do it right",
            type: "",
          },
        ],
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
        bodyFormData: [
          {
            key: "hey",
            value: "ho",
            editable: true,
            mandatory: false,
            description: "I been tryin to do it right",
            type: "",
          },
        ],
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
        bodyFormData: [
          {
            key: "hey",
            value: "ho",
            editable: true,
            mandatory: false,
            description: "I been tryin to do it right",
            type: "",
          },
        ],
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
