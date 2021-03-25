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
        ],
      },
    ];
    const basicAction = {
      ...DEFAULT_ACTION,
      actionConfiguration: {
        body: "basic action",
      },
    };

    const response = getBindingPathsOfAction(basicAction, config);
    expect(response).toStrictEqual({
      data: true,
      isLoading: true,
      "config.body": true,
    });
  });
});
