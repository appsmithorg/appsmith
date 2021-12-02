import { Action, PluginType } from "entities/Action/index";
import { getBindingPathsOfAction } from "entities/Action/actionProperties";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

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
      data: EvaluationSubstitutionType.TEMPLATE,
      isLoading: EvaluationSubstitutionType.TEMPLATE,
      config: EvaluationSubstitutionType.TEMPLATE,
      datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
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
          {
            label: "",
            configProperty: "actionConfiguration.field1",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "SMART_SUBSTITUTE",
          },
          {
            label: "",
            configProperty: "actionConfiguration.field2",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "PARAMETER",
          },
        ],
      },
    ];
    const basicAction = {
      ...DEFAULT_ACTION,
      actionConfiguration: {
        body: "basic action",
        body2: "another body",
        field1: "test",
        field2: "anotherTest",
      },
    };

    const response = getBindingPathsOfAction(basicAction, config);
    expect(response).toStrictEqual({
      data: EvaluationSubstitutionType.TEMPLATE,
      isLoading: EvaluationSubstitutionType.TEMPLATE,
      datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
      "config.body": EvaluationSubstitutionType.TEMPLATE,
      "config.body2": EvaluationSubstitutionType.TEMPLATE,
      "config.field1": EvaluationSubstitutionType.SMART_SUBSTITUTE,
      "config.field2": EvaluationSubstitutionType.PARAMETER,
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
      data: EvaluationSubstitutionType.TEMPLATE,
      isLoading: EvaluationSubstitutionType.TEMPLATE,
      datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
      "config.params[0].key": EvaluationSubstitutionType.TEMPLATE,
      "config.params[0].value": EvaluationSubstitutionType.TEMPLATE,
      "config.params[1].key": EvaluationSubstitutionType.TEMPLATE,
      "config.params[1].value": EvaluationSubstitutionType.TEMPLATE,
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
      data: EvaluationSubstitutionType.TEMPLATE,
      isLoading: EvaluationSubstitutionType.TEMPLATE,
      datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
      "config.key": EvaluationSubstitutionType.TEMPLATE,
      "config.value": EvaluationSubstitutionType.TEMPLATE,
    });
  });

  it("checks for hidden field and returns bindingPaths accordingly", () => {
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
            hidden: {
              path: "actionConfiguration.template.setting",
              comparison: "EQUALS",
              value: false,
            },
          },
          {
            label: "",
            configProperty: "actionConfiguration.field1",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            evaluationSubstitutionType: "SMART_SUBSTITUTE",
            hidden: {
              path: "actionConfiguration.template.setting",
              comparison: "EQUALS",
              value: true,
            },
          },
        ],
      },
    ];
    const basicAction = {
      ...DEFAULT_ACTION,
      actionConfiguration: {
        body: "basic action",
        body2: "another body",
        field1: "alternate body",
        template: {
          setting: false,
        },
      },
    };

    const response = getBindingPathsOfAction(basicAction, config);
    expect(response).toStrictEqual({
      data: EvaluationSubstitutionType.TEMPLATE,
      isLoading: EvaluationSubstitutionType.TEMPLATE,
      datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
      "config.body": EvaluationSubstitutionType.TEMPLATE,
      "config.field1": EvaluationSubstitutionType.SMART_SUBSTITUTE,
    });

    basicAction.actionConfiguration.template.setting = true;

    const response2 = getBindingPathsOfAction(basicAction, config);
    expect(response2).toStrictEqual({
      data: EvaluationSubstitutionType.TEMPLATE,
      isLoading: EvaluationSubstitutionType.TEMPLATE,
      datasourceUrl: EvaluationSubstitutionType.TEMPLATE,
      "config.body": EvaluationSubstitutionType.TEMPLATE,
      "config.body2": EvaluationSubstitutionType.TEMPLATE,
    });
  });
});
