import { put } from "redux-saga/effects";
import {
  RESP_HEADER_DATATYPE,
  setDefaultActionDisplayFormat,
} from "./PluginActionSagaUtils";
import { createActionExecutionResponse } from "./PluginActionSagaUtils";
import { ActionResponseDataTypes } from "./PluginActionSagaUtils";
import { HTTP_METHOD } from "PluginActionEditor/constants/CommonApiConstants";

const actionid = "test-id";

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const plugin: any = {
  id: "test-plugin",
  name: "Test",
  type: "API",
  packageName: "test-package",
  uiComponent: "ApiEditorForm",
  datasourceComponent: "RestAPIDatasourceForm",
  templates: {
    test: "test",
  },
  responseType: "JSON",
};

describe("PluginActionSagasUtils", () => {
  it("should set the default action display format without any bugs as long as dataTypes is there", () => {
    const payload = {
      body: [],
      headers: {
        headers: ["test-headers"],
      },
      statusCode: "200",
      dataTypes: [
        {
          dataType: "JSON",
        },
      ],
      duration: "1000",
      size: "10kb",
    };

    const generator = setDefaultActionDisplayFormat(actionid, plugin, payload);

    expect(generator.next().value).toEqual(
      put({
        type: "SET_ACTION_RESPONSE_DISPLAY_FORMAT",
        payload: {
          id: "test-id",
          field: "responseDisplayFormat",
          value: "JSON",
        },
      }),
    );
  });

  it("If the response type is not present in the dataType, then it should pick the first dataType in the array", () => {
    const payload = {
      body: [],
      headers: {
        headers: ["test-headers"],
      },
      statusCode: "200",
      dataTypes: [
        {
          dataType: "TABLE",
        },
        {
          dataType: "RAW",
        },
      ],
      duration: "1000",
      size: "10kb",
    };

    const generator = setDefaultActionDisplayFormat(actionid, plugin, payload);

    expect(generator.next().value).toEqual(
      put({
        type: "SET_ACTION_RESPONSE_DISPLAY_FORMAT",
        payload: {
          id: "test-id",
          field: "responseDisplayFormat",
          value: "TABLE",
        },
      }),
    );
  });

  it("If dataType is an empty array, then no action should be dispatched and no bugs should happen", () => {
    const payload = {
      body: [],
      headers: {
        headers: ["test-headers"],
      },
      statusCode: "200",
      dataTypes: [],
      duration: "1000",
      size: "10kb",
    };

    const generator = setDefaultActionDisplayFormat(actionid, plugin, payload);

    expect(generator.next().value).toBeUndefined();
  });
});

describe("createActionExecutionResponse", () => {
  it("should handle regular response without binary data", () => {
    const response = {
      data: {
        body: { key: "value" },
        statusCode: "200 OK",
        headers: {},
        isExecutionSuccess: true,
        request: {
          url: "https://example.com",
          headers: {},
          body: {},
          httpMethod: HTTP_METHOD.GET,
        },
        dataTypes: [{ dataType: "JSON" }],
      },
      clientMeta: {
        duration: "100",
        size: "50",
      },
      responseMeta: {
        status: 200,
        success: true,
      },
    };

    const result = createActionExecutionResponse(response);

    expect(result).toEqual({
      ...response.data,
      ...response.clientMeta,
    });
  });

  it("should decode base64 binary response", () => {
    const rawData = "test binary data";
    const base64String = btoa(rawData);
    const response = {
      data: {
        body: base64String,
        statusCode: "200 OK",
        headers: {
          [RESP_HEADER_DATATYPE]: [ActionResponseDataTypes.BINARY],
        },
        isExecutionSuccess: true,
        request: {
          url: "https://example.com",
          headers: {},
          body: {},
          httpMethod: HTTP_METHOD.GET,
        },
        dataTypes: [{ dataType: "JSON" }],
      },
      clientMeta: {
        duration: "100",
        size: "50",
      },
      responseMeta: {
        status: 200,
        success: true,
      },
    };

    const result = createActionExecutionResponse(response);

    expect(result.body).toBe(rawData);
  });

  it("should not decode response if status code is not 200 OK", () => {
    const base64String = btoa("test binary data");
    const response = {
      data: {
        body: base64String,
        statusCode: "404 Not Found",
        headers: {
          [RESP_HEADER_DATATYPE]: [ActionResponseDataTypes.BINARY],
        },
        isExecutionSuccess: true,
        request: {
          url: "https://example.com",
          headers: {},
          body: {},
          httpMethod: HTTP_METHOD.GET,
        },
        dataTypes: [{ dataType: "JSON" }],
      },
      clientMeta: {
        duration: "100",
        size: "50",
      },
      responseMeta: {
        status: 200,
        success: true,
      },
    };

    const result = createActionExecutionResponse(response);

    expect(result.body).toBe(base64String);
  });

  it("should not decode response if header type is not BINARY", () => {
    const base64String = btoa("test binary data");
    const response = {
      data: {
        body: base64String,
        statusCode: "200 OK",
        headers: {
          [RESP_HEADER_DATATYPE]: ["JSON"],
        },
        isExecutionSuccess: true,
        request: {
          url: "https://example.com",
          headers: {},
          body: {},
          httpMethod: HTTP_METHOD.GET,
        },
        dataTypes: [{ dataType: "JSON" }],
      },
      clientMeta: {
        duration: "100",
        size: "50",
      },
      responseMeta: {
        status: 200,
        success: true,
      },
    };

    const result = createActionExecutionResponse(response);

    expect(result.body).toBe(base64String);
  });
});
