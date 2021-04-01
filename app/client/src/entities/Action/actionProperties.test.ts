import { Action, PluginType } from "entities/Action/index";
import { getBindingPathsOfAction } from "entities/Action/actionProperties";

const DEFAULT_ACTION: Action = {
  actionConfiguration: {},
  cacheResponse: "",
  datasource: {
    id: "randomDatasource",
  },
  dynamicBindingPathList: [],
  executeOnLoad: false,
  id: "",
  invalids: [],
  isValid: false,
  jsonPathKeys: [],
  name: "",
  organizationId: "",
  pageId: "",
  pluginId: "",
  pluginType: PluginType.DB,
};

describe("getBindingPathsOfAction", () => {
  it("returns default list of no config is sent", () => {
    const response = getBindingPathsOfAction(DEFAULT_ACTION, undefined);
    expect(response).toStrictEqual({
      data: true,
      isLoading: true,
      config: true,
    });
  });

  it("returns correct values for basic config", () => {
    const config = [
      {
        sectionName: "",
        id: 1,
        children: [
          {
            label: "",
            configProperty: "actionConfiguration.body",
            controlType: "QUERY_DYNAMIC_TEXT",
          },
          {
            label: "",
            configProperty: "actionConfiguration.body2",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
          },
        ],
      },
    ];
    const basicAction = {
      ...DEFAULT_ACTION,
      actionConfiguration: {
        body: "basic action",
        body2: "another body",
      },
    };

    const response = getBindingPathsOfAction(basicAction, config);
    expect(response).toStrictEqual({
      data: true,
      isLoading: true,
      "config.body": true,
      "config.body2": true,
    });
  });

  it("returns correct values for array field config", () => {
    const config = [
      {
        sectionName: "",
        id: 1,
        children: [
          {
            label: "Test label",
            configProperty: "actionConfiguration.params",
            controlType: "ARRAY_FIELD",
            schema: [
              {
                label: "Key",
                key: "key",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Key",
              },
              {
                label: "Value",
                key: "value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Key",
              },
              {
                label: "random",
                key: "randomKey",
                controlType: "INPUT_TEXT",
                placeholderText: "random",
              },
            ],
          },
        ],
      },
    ];
    const basicAction = {
      ...DEFAULT_ACTION,
      actionConfiguration: {
        params: [
          {
            key: "test1",
            value: "test1",
            randomKey: "test1",
          },
          {
            key: "test2",
            value: "test2",
            randomKey: "test2",
          },
        ],
      },
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const response = getBindingPathsOfAction(basicAction, config);
    expect(response).toStrictEqual({
      data: true,
      isLoading: true,
      "config.params[0].key": true,
      "config.params[0].value": true,
      "config.params[1].key": true,
      "config.params[1].value": true,
    });
  });

  it("handles recursive sections", () => {
    const config = [
      {
        sectionName: "",
        id: 1,
        children: [
          {
            label: "random",
            configProperty: "actionConfiguration.randomKey",
            controlType: "INPUT_TEXT",
            placeholderText: "random",
          },
          {
            sectionName: "",
            id: 2,
            children: [
              {
                label: "Key",
                configProperty: "actionConfiguration.key",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Key",
              },
              {
                label: "Value",
                configProperty: "actionConfiguration.value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                placeholderText: "Key",
              },
            ],
          },
        ],
      },
    ];
    const basicAction = {
      ...DEFAULT_ACTION,
      actionConfiguration: {
        randomKey: "randomValue",
        key: "test1",
        test: "test2",
      },
    };

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const response = getBindingPathsOfAction(basicAction, config);
    expect(response).toStrictEqual({
      data: true,
      isLoading: true,
      "config.key": true,
      "config.value": true,
    });
  });
});
