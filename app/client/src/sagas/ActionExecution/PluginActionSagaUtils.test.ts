import { put } from "redux-saga/effects";
import { setDefaultActionDisplayFormat } from "./PluginActionSagaUtils";

const actionid = "test-id";

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
