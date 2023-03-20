import { ENTITY_TYPE } from "entities/DataTree/types";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

export const configTree = {
  MainContainer: {
    widgetId: "0",
    type: "CANVAS_WIDGET",
    dynamicBindingPathList: [],
    defaultProps: {},
    defaultMetaProps: [],
    logBlackList: {},
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    reactivePaths: {},
    triggerPaths: {},
    validationPaths: {},
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    privateWidgets: {},
    bindingPaths: {},
    dynamicTriggerPathList: [],
  },
  Button1: {
    type: "BUTTON_WIDGET",
    dynamicTriggerPathList: [],
    dynamicBindingPathList: [],
    defaultProps: {},
    defaultMetaProps: ["recaptchaToken"],
    logBlackList: {},
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    privateWidgets: {},
    widgetName: "Button1",
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    reactivePaths: {
      recaptchaToken: EvaluationSubstitutionType.TEMPLATE,
      text: EvaluationSubstitutionType.TEMPLATE,
      tooltip: EvaluationSubstitutionType.TEMPLATE,
      googleRecaptchaKey: EvaluationSubstitutionType.TEMPLATE,
      recaptchaType: EvaluationSubstitutionType.TEMPLATE,
      isVisible: EvaluationSubstitutionType.TEMPLATE,
      isDisabled: EvaluationSubstitutionType.TEMPLATE,
      animateLoading: EvaluationSubstitutionType.TEMPLATE,
      buttonVariant: EvaluationSubstitutionType.TEMPLATE,
      placement: EvaluationSubstitutionType.TEMPLATE,
    },
    triggerPaths: {
      onClick: true,
    },
    validationPaths: {
      text: {
        type: "TEXT",
      },
      tooltip: {
        type: "TEXT",
      },
      googleRecaptchaKey: {
        type: "TEXT",
      },
      recaptchaType: {
        type: "TEXT",
        params: {
          allowedValues: ["V3", "V2"],
          default: "V3",
        },
      },
      isVisible: {
        type: "BOOLEAN",
      },
      isDisabled: {
        type: "BOOLEAN",
      },
      animateLoading: {
        type: "BOOLEAN",
      },
      buttonVariant: {
        type: "TEXT",
        params: {
          allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
          default: "PRIMARY",
        },
      },
      placement: {
        type: "TEXT",
        params: {
          allowedValues: ["START", "BETWEEN", "CENTER"],
          default: "CENTER",
        },
      },
    },
  },
  Button2: {
    dynamicBindingPathList: [
      {
        key: "text",
      },
    ],
    widgetId: "l0yem4eh6l",
    widgetName: "Button2",
    type: "BUTTON_WIDGET",
    dynamicTriggerPathList: [],
    privateWidgets: {},
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    defaultProps: {},
    defaultMetaProps: ["recaptchaToken"],
    logBlackList: {},
    reactivePaths: {
      recaptchaToken: EvaluationSubstitutionType.TEMPLATE,
      text: EvaluationSubstitutionType.TEMPLATE,
      tooltip: EvaluationSubstitutionType.TEMPLATE,
      googleRecaptchaKey: EvaluationSubstitutionType.TEMPLATE,
      recaptchaType: EvaluationSubstitutionType.TEMPLATE,
      isVisible: EvaluationSubstitutionType.TEMPLATE,
      isDisabled: EvaluationSubstitutionType.TEMPLATE,
      animateLoading: EvaluationSubstitutionType.TEMPLATE,
      buttonVariant: EvaluationSubstitutionType.TEMPLATE,
      placement: EvaluationSubstitutionType.TEMPLATE,
    },
    triggerPaths: {
      onClick: true,
    },
    validationPaths: {
      text: {
        type: "TEXT",
      },
      tooltip: {
        type: "TEXT",
      },
      googleRecaptchaKey: {
        type: "TEXT",
      },
      recaptchaType: {
        type: "TEXT",
        params: {
          allowedValues: ["V3", "V2"],
          default: "V3",
        },
      },
      isVisible: {
        type: "BOOLEAN",
      },
      isDisabled: {
        type: "BOOLEAN",
      },
      animateLoading: {
        type: "BOOLEAN",
      },
      buttonVariant: {
        type: "TEXT",
        params: {
          allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
          default: "PRIMARY",
        },
      },
      placement: {
        type: "TEXT",
        params: {
          allowedValues: ["START", "BETWEEN", "CENTER"],
          default: "CENTER",
        },
      },
    },
  },
};

export const lintingConfigTree = {
  Api2: {
    actionId: "62c46f53f184187f8821534c",
    name: "Api2",
    pluginId: "5ca385dc81b37f0004b4db85",
    pluginType: "API",
    dynamicBindingPathList: [],
    ENTITY_TYPE: ENTITY_TYPE.ACTION,
    bindingPaths: {
      "config.path": "TEMPLATE",
      "config.body": "SMART_SUBSTITUTE",
      "config.queryParameters[0].key": "TEMPLATE",
      "config.queryParameters[0].value": "TEMPLATE",
      "config.queryParameters[1].key": "TEMPLATE",
      "config.queryParameters[1].value": "TEMPLATE",
      "config.headers[0].key": "TEMPLATE",
      "config.headers[0].value": "TEMPLATE",
      "config.headers[1].key": "TEMPLATE",
      "config.headers[1].value": "TEMPLATE",
    },
    reactivePaths: {
      data: "TEMPLATE",
      isLoading: "TEMPLATE",
      datasourceUrl: "TEMPLATE",
      "config.path": "TEMPLATE",
      "config.body": "SMART_SUBSTITUTE",
      "config.queryParameters[0].key": "TEMPLATE",
      "config.queryParameters[0].value": "TEMPLATE",
      "config.queryParameters[1].key": "TEMPLATE",
      "config.queryParameters[1].value": "TEMPLATE",
      "config.headers[0].key": "TEMPLATE",
      "config.headers[0].value": "TEMPLATE",
      "config.headers[1].key": "TEMPLATE",
      "config.headers[1].value": "TEMPLATE",
    },
    dependencyMap: {
      "config.body": ["config.pluginSpecifiedTemplates[0].value"],
    },
    logBlackList: {},
  },
  Api1: {
    actionId: "62c48ef99ad402215f5226a4",
    name: "Api1",
    pluginId: "5ca385dc81b37f0004b4db85",
    pluginType: "API",
    dynamicBindingPathList: [],
    ENTITY_TYPE: ENTITY_TYPE.ACTION,
    bindingPaths: {
      "config.path": "TEMPLATE",
      "config.body": "SMART_SUBSTITUTE",
      "config.queryParameters[0].key": "TEMPLATE",
      "config.queryParameters[0].value": "TEMPLATE",
      "config.queryParameters[1].key": "TEMPLATE",
      "config.queryParameters[1].value": "TEMPLATE",
      "config.headers[0].key": "TEMPLATE",
      "config.headers[0].value": "TEMPLATE",
      "config.headers[1].key": "TEMPLATE",
      "config.headers[1].value": "TEMPLATE",
    },
    reactivePaths: {
      data: "TEMPLATE",
      isLoading: "TEMPLATE",
      datasourceUrl: "TEMPLATE",
      "config.path": "TEMPLATE",
      "config.body": "SMART_SUBSTITUTE",
      "config.queryParameters[0].key": "TEMPLATE",
      "config.queryParameters[0].value": "TEMPLATE",
      "config.queryParameters[1].key": "TEMPLATE",
      "config.queryParameters[1].value": "TEMPLATE",
      "config.headers[0].key": "TEMPLATE",
      "config.headers[0].value": "TEMPLATE",
      "config.headers[1].key": "TEMPLATE",
      "config.headers[1].value": "TEMPLATE",
    },
    dependencyMap: {
      "config.body": ["config.pluginSpecifiedTemplates[0].value"],
    },
    logBlackList: {},
  },
  JSObject1: {
    name: "JSObject1",
    actionId: "62bf37a0152a750d0c550d7c",
    pluginType: "JS",
    ENTITY_TYPE: "JSACTION",
    meta: {
      myFun2: {
        arguments: [],
        isAsync: true,
        confirmBeforeExecute: false,
      },
      myFun1: {
        arguments: [],
        isAsync: true,
        confirmBeforeExecute: false,
      },
    },
    bindingPaths: {
      body: "SMART_SUBSTITUTE",
      myVar1: "SMART_SUBSTITUTE",
      myVar2: "SMART_SUBSTITUTE",
      myFun2: "SMART_SUBSTITUTE",
      myFun1: "SMART_SUBSTITUTE",
    },
    reactivePaths: {
      body: "SMART_SUBSTITUTE",
      myVar1: "SMART_SUBSTITUTE",
      myVar2: "SMART_SUBSTITUTE",
      myFun2: "SMART_SUBSTITUTE",
      myFun1: "SMART_SUBSTITUTE",
    },
    dynamicBindingPathList: [
      {
        key: "body",
      },
      {
        key: "myVar1",
      },
      {
        key: "myVar2",
      },
      {
        key: "myFun2",
      },
      {
        key: "myFun1",
      },
    ],
    variables: ["myVar1", "myVar2"],
    dependencyMap: {
      body: ["myFun2", "myFun1"],
    },
  },
  MainContainer: {
    widgetId: "0",
    type: "CANVAS_WIDGET",
    dynamicTriggerPathList: [],
    dynamicBindingPathList: [],
    defaultProps: {},
    defaultMetaProps: [],
    logBlackList: {},
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    bindingPaths: {},
    reactivePaths: {},
    triggerPaths: {},
    validationPaths: {},
    ENTITY_TYPE: "WIDGET",
    privateWidgets: {},
  },
  Button3: {
    dynamicPropertyPathList: [
      {
        key: "onClick",
      },
    ],
    type: "BUTTON_WIDGET",
    dynamicTriggerPathList: [
      {
        key: "onClick",
      },
    ],
    dynamicBindingPathList: [
      {
        key: "buttonColor",
      },
      {
        key: "borderRadius",
      },
    ],
    widgetId: "qkqk9ezxvg",
    defaultProps: {},
    defaultMetaProps: ["recaptchaToken"],
    logBlackList: {},
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    bindingPaths: {
      text: "TEMPLATE",
      tooltip: "TEMPLATE",
      googleRecaptchaKey: "TEMPLATE",
      recaptchaType: "TEMPLATE",
      isVisible: "TEMPLATE",
      isDisabled: "TEMPLATE",
      animateLoading: "TEMPLATE",
      buttonColor: "TEMPLATE",
      buttonVariant: "TEMPLATE",
      borderRadius: "TEMPLATE",
      boxShadow: "TEMPLATE",
      placement: "TEMPLATE",
    },
    reactivePaths: {
      recaptchaToken: "TEMPLATE",
      buttonColor: "TEMPLATE",
      borderRadius: "TEMPLATE",
      text: "TEMPLATE",
      tooltip: "TEMPLATE",
      googleRecaptchaKey: "TEMPLATE",
      recaptchaType: "TEMPLATE",
      isVisible: "TEMPLATE",
      isDisabled: "TEMPLATE",
      animateLoading: "TEMPLATE",
      buttonVariant: "TEMPLATE",
      boxShadow: "TEMPLATE",
      placement: "TEMPLATE",
    },
    triggerPaths: {
      onClick: true,
    },
    validationPaths: {
      text: {
        type: "TEXT",
      },
      tooltip: {
        type: "TEXT",
      },
      googleRecaptchaKey: {
        type: "TEXT",
      },
      recaptchaType: {
        type: "TEXT",
        params: {
          allowedValues: ["V3", "V2"],
          default: "V3",
        },
      },
      isVisible: {
        type: "BOOLEAN",
      },
      isDisabled: {
        type: "BOOLEAN",
      },
      animateLoading: {
        type: "BOOLEAN",
      },
      buttonColor: {
        type: "TEXT",
      },
      buttonVariant: {
        type: "TEXT",
        params: {
          allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
          default: "PRIMARY",
        },
      },
      borderRadius: {
        type: "TEXT",
      },
      boxShadow: {
        type: "TEXT",
      },
      placement: {
        type: "TEXT",
        params: {
          allowedValues: ["START", "BETWEEN", "CENTER"],
          default: "CENTER",
        },
      },
    },
    ENTITY_TYPE: "WIDGET",
    privateWidgets: {},
  },
  Button2: {
    dynamicPropertyPathList: [
      {
        key: "onClick",
      },
    ],
    type: "BUTTON_WIDGET",
    dynamicTriggerPathList: [
      {
        key: "onClick",
      },
    ],
    dynamicBindingPathList: [
      {
        key: "buttonColor",
      },
      {
        key: "borderRadius",
      },
    ],
    widgetId: "vujfz3klqc",
    defaultProps: {},
    defaultMetaProps: ["recaptchaToken"],
    logBlackList: {},
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    bindingPaths: {
      text: "TEMPLATE",
      tooltip: "TEMPLATE",
      googleRecaptchaKey: "TEMPLATE",
      recaptchaType: "TEMPLATE",
      isVisible: "TEMPLATE",
      isDisabled: "TEMPLATE",
      animateLoading: "TEMPLATE",
      buttonColor: "TEMPLATE",
      buttonVariant: "TEMPLATE",
      borderRadius: "TEMPLATE",
      boxShadow: "TEMPLATE",
      placement: "TEMPLATE",
    },
    reactivePaths: {
      recaptchaToken: "TEMPLATE",
      buttonColor: "TEMPLATE",
      borderRadius: "TEMPLATE",
      text: "TEMPLATE",
      tooltip: "TEMPLATE",
      googleRecaptchaKey: "TEMPLATE",
      recaptchaType: "TEMPLATE",
      isVisible: "TEMPLATE",
      isDisabled: "TEMPLATE",
      animateLoading: "TEMPLATE",
      buttonVariant: "TEMPLATE",
      boxShadow: "TEMPLATE",
      placement: "TEMPLATE",
    },
    triggerPaths: {
      onClick: true,
    },
    validationPaths: {
      text: {
        type: "TEXT",
      },
      tooltip: {
        type: "TEXT",
      },
      googleRecaptchaKey: {
        type: "TEXT",
      },
      recaptchaType: {
        type: "TEXT",
        params: {
          allowedValues: ["V3", "V2"],
          default: "V3",
        },
      },
      isVisible: {
        type: "BOOLEAN",
      },
      isDisabled: {
        type: "BOOLEAN",
      },
      animateLoading: {
        type: "BOOLEAN",
      },
      buttonColor: {
        type: "TEXT",
      },
      buttonVariant: {
        type: "TEXT",
        params: {
          allowedValues: ["PRIMARY", "SECONDARY", "TERTIARY"],
          default: "PRIMARY",
        },
      },
      borderRadius: {
        type: "TEXT",
      },
      boxShadow: {
        type: "TEXT",
      },
      placement: {
        type: "TEXT",
        params: {
          allowedValues: ["START", "BETWEEN", "CENTER"],
          default: "CENTER",
        },
      },
    },
    ENTITY_TYPE: "WIDGET",
    privateWidgets: {},
  },
};

export const unEvalTreeWidgetSelectWidgetConfig = {
  ...configTree,
  Select2: {
    type: "SELECT_WIDGET",

    dynamicTriggerPathList: [],

    dynamicBindingPathList: [
      {
        key: "accentColor",
      },
      {
        key: "borderRadius",
      },
      {
        key: "isValid",
      },
      {
        key: "selectedOptionValue",
      },
      {
        key: "selectedOptionLabel",
      },
    ],
    widgetId: "kqre06w7ev",
    defaultProps: {
      value: "defaultOptionValue",
      label: "defaultOptionValue",
      filterText: "",
    },
    defaultMetaProps: ["value", "label", "filterText", "isDirty"],
    logBlackList: {
      isValid: true,
      selectedOptionValue: true,
      selectedOptionLabel: true,
    },
    propertyOverrideDependency: {
      value: {
        DEFAULT: "defaultOptionValue",
        META: "meta.value",
      },
      label: {
        DEFAULT: "defaultOptionValue",
        META: "meta.label",
      },
      filterText: {
        DEFAULT: "",
        META: "meta.filterText",
      },
    },
    overridingPropertyPaths: {
      defaultOptionValue: ["value", "meta.value", "label", "meta.label"],
      "meta.value": ["value"],
      "meta.label": ["label"],
      "": ["filterText"],
      "meta.filterText": ["filterText"],
    },
    bindingPaths: {
      options: "SMART_SUBSTITUTE",
      defaultOptionValue: "TEMPLATE",
      labelText: "TEMPLATE",
      labelWidth: "TEMPLATE",
      isFilterable: "TEMPLATE",
      serverSideFiltering: "TEMPLATE",
      isRequired: "TEMPLATE",
      placeholderText: "TEMPLATE",
      isVisible: "TEMPLATE",
      isDisabled: "TEMPLATE",
      animateLoading: "TEMPLATE",
      labelTextColor: "TEMPLATE",
      labelTextSize: "TEMPLATE",
      labelStyle: "TEMPLATE",
      accentColor: "TEMPLATE",
      borderRadius: "TEMPLATE",
      boxShadow: "TEMPLATE",
    },
    reactivePaths: {
      isValid: "TEMPLATE",
      selectedOptionValue: "TEMPLATE",
      selectedOptionLabel: "TEMPLATE",
      value: "TEMPLATE",
      label: "TEMPLATE",
      filterText: "TEMPLATE",
      isDirty: "TEMPLATE",
      "": "TEMPLATE",
      accentColor: "TEMPLATE",
      borderRadius: "TEMPLATE",
      defaultOptionValue: "TEMPLATE",
      "meta.value": "TEMPLATE",
      "meta.label": "TEMPLATE",
      "meta.filterText": "TEMPLATE",
      options: "SMART_SUBSTITUTE",
      labelText: "TEMPLATE",
      labelWidth: "TEMPLATE",
      isFilterable: "TEMPLATE",
      serverSideFiltering: "TEMPLATE",
      isRequired: "TEMPLATE",
      placeholderText: "TEMPLATE",
      isVisible: "TEMPLATE",
      isDisabled: "TEMPLATE",
      animateLoading: "TEMPLATE",
      labelTextColor: "TEMPLATE",
      labelTextSize: "TEMPLATE",
      labelStyle: "TEMPLATE",
      boxShadow: "TEMPLATE",
    },
    triggerPaths: {
      onOptionChange: true,
    },
    validationPaths: {
      options: {
        type: "ARRAY",
        params: {
          unique: ["value"],
          children: {
            type: "OBJECT",
            params: {
              required: true,
              allowedKeys: [
                {
                  name: "label",
                  type: "TEXT",
                  params: {
                    default: "",
                    requiredKey: true,
                  },
                },
                {
                  name: "value",
                  type: "TEXT",
                  params: {
                    default: "",
                    requiredKey: true,
                  },
                },
              ],
            },
          },
        },
      },
      defaultOptionValue: {
        type: "FUNCTION",
        params: {
          expected: {
            type: 'value1 or { "label": "label1", "value": "value1" }',
            example: 'value1 | { "label": "label1", "value": "value1" }',
            autocompleteDataType: "STRING",
          },
          fnString:
            'function defaultOptionValueValidation(value, props, _) {\n  var isValid;\n  var parsed;\n  var message = "";\n  var isServerSideFiltered = props.serverSideFiltering; // TODO: validation of defaultOption is dependent on serverSideFiltering and options, this property should reValidated once the dependencies change\n  //this issue is been tracked here https://github.com/appsmithorg/appsmith/issues/15303\n\n  var options = props.options;\n  /*\n   * Function to check if the object has `label` and `value`\n   */\n\n  var hasLabelValue = function hasLabelValue(obj) {\n    return _.isPlainObject(value) && obj.hasOwnProperty("label") && obj.hasOwnProperty("value") && _.isString(obj.label) && (_.isString(obj.value) || _.isFinite(obj.value));\n  };\n  /*\n   * When value is "{label: \'green\', value: \'green\'}"\n   */\n\n\n  if (typeof value === "string") {\n    try {\n      var parsedValue = JSON.parse(value);\n\n      if (_.isObject(parsedValue)) {\n        value = parsedValue;\n      }\n    } catch (e) {}\n  }\n\n  if (_.isString(value) || _.isFinite(value) || hasLabelValue(value)) {\n    /*\n     * When value is "", "green", 444, {label: "green", value: "green"}\n     */\n    isValid = true;\n    parsed = value;\n  } else {\n    isValid = false;\n    parsed = undefined;\n    message = \'value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }\';\n  }\n\n  if (isValid && !_.isNil(parsed) && parsed !== "") {\n    if (!Array.isArray(options) && typeof options === "string") {\n      try {\n        var parsedOptions = JSON.parse(options);\n\n        if (Array.isArray(parsedOptions)) {\n          options = parsedOptions;\n        } else {\n          options = [];\n        }\n      } catch (e) {\n        options = [];\n      }\n    }\n\n    var _parsedValue = parsed.hasOwnProperty("value") ? parsed.value : parsed;\n\n    var valueIndex = _.findIndex(options, function (option) {\n      return option.value === _parsedValue;\n    });\n\n    if (valueIndex === -1) {\n      if (!isServerSideFiltered) {\n        isValid = false;\n        message = "Default value is missing in options. Please update the value.";\n      } else {\n        if (!hasLabelValue(parsed)) {\n          isValid = false;\n          message = "Default value is missing in options. Please use {label : <string | num>, value : < string | num>} format to show default for server side data.";\n        }\n      }\n    }\n  }\n\n  return {\n    isValid: isValid,\n    parsed: parsed,\n    messages: [message]\n  };\n}',
        },
        dependentPaths: ["serverSideFiltering", "options"],
      },
      labelText: {
        type: "TEXT",
      },
      labelWidth: {
        type: "NUMBER",
        params: {
          natural: true,
        },
      },
      isFilterable: {
        type: "BOOLEAN",
      },
      serverSideFiltering: {
        type: "BOOLEAN",
      },
      isRequired: {
        type: "BOOLEAN",
      },
      placeholderText: {
        type: "TEXT",
      },
      isVisible: {
        type: "BOOLEAN",
      },
      isDisabled: {
        type: "BOOLEAN",
      },
      animateLoading: {
        type: "BOOLEAN",
      },
      labelTextColor: {
        type: "TEXT",
      },
      labelTextSize: {
        type: "TEXT",
      },
      labelStyle: {
        type: "TEXT",
      },
      accentColor: {
        type: "TEXT",
      },
      borderRadius: {
        type: "TEXT",
      },
      boxShadow: {
        type: "TEXT",
      },
    },
    ENTITY_TYPE: ENTITY_TYPE.WIDGET,
    privateWidgets: {},
  },
};
