import { transformRestAction } from "transformers/RestActionTransformer";
import { PluginType, ApiAction } from "entities/Action";
import {
  MultiPartOptionTypes,
  POST_BODY_FORMAT_OPTIONS,
  // POST_BODY_FORMAT_OPTIONS_ENUM,
} from "constants/ApiEditorConstants";

// jest.mock("POST_");

const BASE_ACTION: ApiAction = {
  dynamicBindingPathList: [],
  cacheResponse: "",
  executeOnLoad: false,
  invalids: [],
  isValid: false,
  workspaceId: "",
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
    formData: {
      apiContentType: "none",
    },
    timeoutInMillisecond: 5000,
  },
  jsonPathKeys: [],
  messages: [],
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
          {
            key: "content-type",
            value: POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED,
          },
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
          {
            key: "content-type",
            value: POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED,
          },
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
          {
            key: "content-type",
            value: POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED,
          },
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
          {
            key: "content-type",
            value: POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED,
          },
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

  it("filters empty pairs from form data", () => {
    const input: ApiAction = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "POST",
        headers: [
          {
            key: "content-type",
            value: POST_BODY_FORMAT_OPTIONS.MULTIPART_FORM_DATA,
          },
        ],
        body: "",
        bodyFormData: [
          {
            key: "hey",
            value: "ho",
            type: MultiPartOptionTypes.TEXT,
            editable: true,
            mandatory: false,
            description: "I been tryin to do it right",
          },
          {
            key: "",
            value: "",
            editable: true,
            mandatory: false,
            description: "I been tryin to do it right",
            type: "",
          },
        ],
      },
    };

    // output object should not include the second bodyFormData object
    // as its key, value and type are empty
    const output: ApiAction = {
      ...BASE_ACTION,
      actionConfiguration: {
        ...BASE_ACTION.actionConfiguration,
        httpMethod: "POST",
        headers: [
          {
            key: "content-type",
            value: POST_BODY_FORMAT_OPTIONS.MULTIPART_FORM_DATA,
          },
        ],
        body: "",
        bodyFormData: [
          {
            key: "hey",
            value: "ho",
            type: MultiPartOptionTypes.TEXT,
            editable: true,
            mandatory: false,
            description: "I been tryin to do it right",
          },
        ],
      },
    };
    const result = transformRestAction(input);
    expect(result).toEqual(output);
  });
});
