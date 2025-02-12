import {
  extractApiUrlPath,
  transformRestAction,
} from "./RestActionTransformer";
import type { ApiAction } from "entities/Action";
import { PluginType } from "entities/Plugin";
import {
  HTTP_PROTOCOL,
  MultiPartOptionTypes,
  POST_BODY_FORMAT_OPTIONS,
} from "../constants/CommonApiConstants";

// jest.mock("POST_");

const BASE_ACTION: ApiAction = {
  dynamicBindingPathList: [],
  cacheResponse: "",
  executeOnLoad: false,
  invalids: [],
  isValid: false,
  workspaceId: "",
  applicationId: "",
  pageId: "",
  pluginId: "",
  id: "testId",
  baseId: "testBaseId",
  datasource: {
    id: "testDataSource",
  },
  name: "testName",
  pluginType: PluginType.API,
  actionConfiguration: {
    httpMethod: "GET",
    httpVersion: HTTP_PROTOCOL.HTTP11.value,
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

  it("Ensures that Api url path is being correctly extracted regardless of expressions witin dynamic bindings", () => {
    // testing for simple dynamic bindings in path
    const path1 = `/{{Text1.text ? 'users' : 'user'}}`;
    const output1 = `/{{Text1.text ? 'users' : 'user'}}`;

    const result1 = extractApiUrlPath(path1);

    expect(result1).toEqual(output1);

    // testing multiple dynamic bindings in path with empty query params
    const path2 = `/{{Text1.text ? 'users' : 'user'}}/{{"test"}}?`;
    const output2 = `/{{Text1.text ? 'users' : 'user'}}/{{"test"}}`;

    const result2 = extractApiUrlPath(path2);

    expect(result2).toEqual(output2);

    // testing multiple dynamic bindings in path with non-empty query params
    const path3 = `/{{Text1.text ? 'users' : 'user'}}/{{"test"}}?a=hello&b=world`;
    const output3 = `/{{Text1.text ? 'users' : 'user'}}/{{"test"}}`;

    const result3 = extractApiUrlPath(path3);

    expect(result3).toEqual(output3);

    // testing normal strings and dynamic bindings in path with non-empty query params
    const path4 = `/key/{{Text1.text}}?a=hello&b=world`;
    const output4 = `/key/{{Text1.text}}`;

    const result4 = extractApiUrlPath(path4);

    expect(result4).toEqual(output4);

    const path5 = "/{{Text1.text ?? 'user1'}}";
    const output5 = "/{{Text1.text ?? 'user1'}}";

    const result5 = extractApiUrlPath(path5);

    expect(result5).toEqual(output5);
  });
});
