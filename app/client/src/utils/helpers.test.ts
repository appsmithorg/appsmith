import { RenderModes } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { AutocompleteDataType } from "./autocomplete/TernServer";
import {
  flattenObject,
  getLocale,
  getSubstringBetweenTwoWords,
  captureInvalidDynamicBindingPath,
  mergeWidgetConfig,
  extractColorsFromString,
} from "./helpers";
import WidgetFactory from "./WidgetFactory";
import * as Sentry from "@sentry/react";
import { Colors } from "constants/Colors";

describe("flattenObject test", () => {
  it("Check if non nested object is returned correctly", () => {
    const testObject = {
      isVisible: true,
      isDisabled: false,
      tableData: false,
    };

    expect(flattenObject(testObject)).toStrictEqual(testObject);
  });

  it("Check if nested objects are returned correctly", () => {
    const tests = [
      {
        input: {
          isVisible: true,
          isDisabled: false,
          tableData: false,
          settings: {
            color: [
              {
                headers: {
                  left: true,
                },
              },
            ],
          },
        },
        output: {
          isVisible: true,
          isDisabled: false,
          tableData: false,
          "settings.color[0].headers.left": true,
        },
      },
      {
        input: {
          isVisible: true,
          isDisabled: false,
          tableData: false,
          settings: {
            color: true,
          },
        },
        output: {
          isVisible: true,
          isDisabled: false,
          tableData: false,
          "settings.color": true,
        },
      },
      {
        input: {
          numbers: [1, 2, 3],
          color: { header: "red" },
        },
        output: {
          "numbers[0]": 1,
          "numbers[1]": 2,
          "numbers[2]": 3,
          "color.header": "red",
        },
      },
      {
        input: {
          name: null,
          color: { header: {} },
          users: {
            id: undefined,
          },
        },
        output: {
          "color.header": {},
          name: null,
          "users.id": undefined,
        },
      },
    ];

    tests.map((test) =>
      expect(flattenObject(test.input)).toStrictEqual(test.output),
    );
  });
});

describe("#getSubstringBetweenTwoWords", () => {
  it("returns substring between 2 words from a string", () => {
    const input: [string, string, string][] = [
      ["aaa.bbb.ccc", "aaa.", ".ccc"],
      ["aaa.bbb.bbb.ccc", "aaa.", ".ccc"],
      ["aaa.aaa.aaa.aaa", "aaa", "aaa"],
      ["aaa...aaa.aaa.aaa", "aaa", "aaa"],
      ["aaa..bbb", "aaa.", ".bbb"],
      ["aaa.bbb", "aaa.", ".bbb"],
      ["aaabbb", "aaab", "abbb"],
    ];

    const output = ["bbb", "bbb.bbb", ".aaa.aaa.", "...aaa.aaa.", "", "", ""];

    input.forEach((inp, index) => {
      expect(getSubstringBetweenTwoWords(...inp)).toBe(output[index]);
    });
  });
});

describe("#mergeWidgetConfig", () => {
  it("should merge the widget configs", () => {
    const base = [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "someWidgetConfig",
          },
        ],
      },
      {
        sectionName: "icon",
        children: [
          {
            propertyName: "someWidgetIconConfig",
          },
        ],
      },
    ];
    const extended = [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "someOtherWidgetConfig",
          },
        ],
      },
      {
        sectionName: "style",
        children: [
          {
            propertyName: "someWidgetStyleConfig",
          },
        ],
      },
    ];
    const expected = [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "someOtherWidgetConfig",
          },
          {
            propertyName: "someWidgetConfig",
          },
        ],
      },
      {
        sectionName: "style",
        children: [
          {
            propertyName: "someWidgetStyleConfig",
          },
        ],
      },
      {
        sectionName: "icon",
        children: [
          {
            propertyName: "someWidgetIconConfig",
          },
        ],
      },
    ];

    expect(mergeWidgetConfig(extended, base)).toEqual(expected);
  });
});

describe("#getLocale", () => {
  it("should test that getLocale is returning navigator.languages[0]", () => {
    expect(getLocale()).toBe(navigator.languages[0]);
  });
});

describe("#captureInvalidDynamicBindingPath", () => {
  it("DSL should not be altered", () => {
    const baseDSL = {
      widgetName: "RadioGroup1",
      dynamicPropertyPathList: [],
      displayName: "Radio Group",
      iconSVG: "/static/media/icon.ba2b2ee0.svg",
      topRow: 57,
      bottomRow: 65,
      parentRowSpace: 10,
      type: "RADIO_GROUP_WIDGET",
      hideCard: false,
      defaultOptionValue: "{{1}}",
      animateLoading: true,
      parentColumnSpace: 33.375,
      dynamicTriggerPathList: [],
      leftColumn: 42,
      dynamicBindingPathList: [
        {
          key: "defaultOptionValue",
        },
        {
          key: "options",
        },
      ],
      options:
        '[\n  {\n    "label": "Yes",\n    "value": {{1 > 0 ? 1 : 0}}\n  },\n  {\n    "label": "No",\n    "value": 2\n  }\n]',
      isDisabled: false,
      key: "opzs6suotf",
      isRequired: false,
      rightColumn: 62,
      widgetId: "s195otz2jm",
      isVisible: true,
      label: "",
      version: 1,
      parentId: "0",
      renderMode: RenderModes.CANVAS,
      isLoading: false,
    };

    const getPropertyConfig = jest.spyOn(
      WidgetFactory,
      "getWidgetPropertyPaneConfig",
    );
    getPropertyConfig.mockReturnValueOnce([
      {
        sectionName: "General",
        children: [
          {
            helpText: "Displays a list of unique options",
            propertyName: "options",
            label: "Options",
            controlType: "OPTION_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                expected: {
                  type:
                    'Array<{ "label": "string", "value": "string" | number}>',
                  example: '[{"label": "abc", "value": "abc" | 1}]',
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
                fnString:
                  'function optionsCustomValidation(options, props, _) {\n  var validationUtil = (options, _) => {\n    var _isValid = true;\n    var message = "";\n    var valueType = "";\n    var uniqueLabels = {};\n\n    for (var i = 0; i < options.length; i++) {\n      var _options$i = options[i],\n          label = _options$i.label,\n          value = _options$i.value;\n\n      if (!valueType) {\n        valueType = typeof value;\n      } //Checks the uniqueness all the values in the options\n\n\n      if (!uniqueLabels.hasOwnProperty(value)) {\n        uniqueLabels[value] = "";\n      } else {\n        _isValid = false;\n        message = "path:value must be unique. Duplicate values found";\n        break;\n      } //Check if the required field "label" is present:\n\n\n      if (!label) {\n        _isValid = false;\n        message = "Invalid entry at index: " + i + ". Missing required key: label";\n        break;\n      } //Validation checks for the the label.\n\n\n      if (_.isNil(label) || label === "" || typeof label !== "string" && typeof label !== "number") {\n        _isValid = false;\n        message = "Invalid entry at index: " + i + ". Value of key: label is invalid: This value does not evaluate to type string";\n        break;\n      } //Check if all the data types for the value prop is the same.\n\n\n      if (typeof value !== valueType) {\n        _isValid = false;\n        message = "All value properties in options must have the same type";\n        break;\n      } //Check if the each object has value property.\n\n\n      if (_.isNil(value)) {\n        _isValid = false;\n        message = \'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>\';\n        break;\n      }\n    }\n\n    return {\n      isValid: _isValid,\n      parsed: _isValid ? options : [],\n      messages: [message]\n    };\n  };\n\n  var invalidResponse = {\n    isValid: false,\n    parsed: [],\n    messages: [\'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>\']\n  };\n\n  try {\n    if (_.isString(options)) {\n      options = JSON.parse(options);\n    }\n\n    if (Array.isArray(options)) {\n      return validationUtil(options, _);\n    } else {\n      return invalidResponse;\n    }\n  } catch (e) {\n    return invalidResponse;\n  }\n}',
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
            id: "6su4u0bwoe",
          },
          {
            helpText: "Sets a default selected option",
            propertyName: "defaultOptionValue",
            label: "Default Selected Value",
            // placeholderText: "Y",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                expected: {
                  type: "string |\nnumber (only works in mustache syntax)",
                  example: "abc | {{1}}",
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
                fnString:
                  'function defaultOptionValidation(value, props, _) {\n  //Checks if the value is not of object type in {{}}\n  if (_.isObject(value)) {\n    return {\n      isValid: false,\n      parsed: JSON.stringify(value, null, 2),\n      messages: ["This value does not evaluate to type: string or number"]\n    };\n  } //Checks if the value is not of boolean type in {{}}\n\n\n  if (_.isBoolean(value)) {\n    return {\n      isValid: false,\n      parsed: value,\n      messages: ["This value does not evaluate to type: string or number"]\n    };\n  }\n\n  return {\n    isValid: true,\n    parsed: value\n  };\n}',
              },
            },
            id: "8wpzo6szbl",
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
            id: "60kc73ivwp",
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
            id: "w4591dtf5l",
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
            id: "6p7181ccec",
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            // defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
            id: "y2gw796t2z",
          },
        ],
        id: "jfh7ud39r4",
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText:
              "Triggers an action when a user changes the selected option",
            propertyName: "onSelectionChange",
            label: "onSelectionChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
            id: "wqgudnqu5n",
          },
        ],
        id: "b2k5a0t632",
      },
    ]);
    const newDsl = captureInvalidDynamicBindingPath(baseDSL);
    expect(baseDSL).toEqual(newDsl);
  });

  it("Checks if dynamicBindingPathList contains a property path that doesn't have a binding", () => {
    const baseDSL = {
      widgetName: "RadioGroup1",
      dynamicPropertyPathList: [],
      displayName: "Radio Group",
      iconSVG: "/static/media/icon.ba2b2ee0.svg",
      topRow: 57,
      bottomRow: 65,
      parentRowSpace: 10,
      type: "RADIO_GROUP_WIDGET",
      hideCard: false,
      defaultOptionValue: "{{1}}",
      animateLoading: true,
      parentColumnSpace: 33.375,
      dynamicTriggerPathList: [],
      leftColumn: 42,
      dynamicBindingPathList: [
        {
          key: "defaultOptionValue",
        },
        {
          key: "options",
        },
      ],
      options: [],
      isDisabled: false,
      key: "opzs6suotf",
      isRequired: false,
      rightColumn: 62,
      widgetId: "s195otz2jm",
      isVisible: true,
      label: "",
      version: 1,
      parentId: "0",
      renderMode: RenderModes.CANVAS,
      isLoading: false,
    };

    const getPropertyConfig = jest.spyOn(
      WidgetFactory,
      "getWidgetPropertyPaneConfig",
    );
    getPropertyConfig.mockReturnValueOnce([
      {
        sectionName: "General",
        children: [
          {
            helpText: "Displays a list of unique options",
            propertyName: "options",
            label: "Options",
            controlType: "OPTION_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                expected: {
                  type:
                    'Array<{ "label": "string", "value": "string" | number}>',
                  example: '[{"label": "abc", "value": "abc" | 1}]',
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
                fnString:
                  'function optionsCustomValidation(options, props, _) {\n  var validationUtil = (options, _) => {\n    var _isValid = true;\n    var message = "";\n    var valueType = "";\n    var uniqueLabels = {};\n\n    for (var i = 0; i < options.length; i++) {\n      var _options$i = options[i],\n          label = _options$i.label,\n          value = _options$i.value;\n\n      if (!valueType) {\n        valueType = typeof value;\n      } //Checks the uniqueness all the values in the options\n\n\n      if (!uniqueLabels.hasOwnProperty(value)) {\n        uniqueLabels[value] = "";\n      } else {\n        _isValid = false;\n        message = "path:value must be unique. Duplicate values found";\n        break;\n      } //Check if the required field "label" is present:\n\n\n      if (!label) {\n        _isValid = false;\n        message = "Invalid entry at index: " + i + ". Missing required key: label";\n        break;\n      } //Validation checks for the the label.\n\n\n      if (_.isNil(label) || label === "" || typeof label !== "string" && typeof label !== "number") {\n        _isValid = false;\n        message = "Invalid entry at index: " + i + ". Value of key: label is invalid: This value does not evaluate to type string";\n        break;\n      } //Check if all the data types for the value prop is the same.\n\n\n      if (typeof value !== valueType) {\n        _isValid = false;\n        message = "All value properties in options must have the same type";\n        break;\n      } //Check if the each object has value property.\n\n\n      if (_.isNil(value)) {\n        _isValid = false;\n        message = \'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>\';\n        break;\n      }\n    }\n\n    return {\n      isValid: _isValid,\n      parsed: _isValid ? options : [],\n      messages: [message]\n    };\n  };\n\n  var invalidResponse = {\n    isValid: false,\n    parsed: [],\n    messages: [\'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>\']\n  };\n\n  try {\n    if (_.isString(options)) {\n      options = JSON.parse(options);\n    }\n\n    if (Array.isArray(options)) {\n      return validationUtil(options, _);\n    } else {\n      return invalidResponse;\n    }\n  } catch (e) {\n    return invalidResponse;\n  }\n}',
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
            id: "6su4u0bwoe",
          },
          {
            helpText: "Sets a default selected option",
            propertyName: "defaultOptionValue",
            label: "Default Selected Value",
            // placeholderText: "Y",
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                expected: {
                  type: "string |\nnumber (only works in mustache syntax)",
                  example: "abc | {{1}}",
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
                fnString:
                  'function defaultOptionValidation(value, props, _) {\n  //Checks if the value is not of object type in {{}}\n  if (_.isObject(value)) {\n    return {\n      isValid: false,\n      parsed: JSON.stringify(value, null, 2),\n      messages: ["This value does not evaluate to type: string or number"]\n    };\n  } //Checks if the value is not of boolean type in {{}}\n\n\n  if (_.isBoolean(value)) {\n    return {\n      isValid: false,\n      parsed: value,\n      messages: ["This value does not evaluate to type: string or number"]\n    };\n  }\n\n  return {\n    isValid: true,\n    parsed: value\n  };\n}',
              },
            },
            id: "8wpzo6szbl",
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
            id: "60kc73ivwp",
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
            id: "w4591dtf5l",
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
            id: "6p7181ccec",
          },
          {
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            // defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
            id: "y2gw796t2z",
          },
        ],
        id: "jfh7ud39r4",
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText:
              "Triggers an action when a user changes the selected option",
            propertyName: "onSelectionChange",
            label: "onSelectionChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
            id: "wqgudnqu5n",
          },
        ],
        id: "b2k5a0t632",
      },
    ]);

    const sentrySpy = jest.spyOn(Sentry, "captureException");

    captureInvalidDynamicBindingPath(baseDSL);
    expect(sentrySpy).toHaveBeenCalledWith(
      new Error(
        `INVALID_DynamicPathBinding_CLIENT_ERROR: Invalid dynamic path binding list: RadioGroup1.options`,
      ),
    );
  });
});

describe("#extractColorsFromString", () => {
  it("Check if the extractColorsFromString returns rgb, rgb, hex color strings", () => {
    const borderWithHex = `2px solid ${Colors.GREEN}`;
    const borderWithRgb = "2px solid rgb(0,0,0)";
    const borderWithRgba = `2px solid ${Colors.BOX_SHADOW_DEFAULT_VARIANT1}`;

    //Check Hex value
    expect(extractColorsFromString(borderWithHex)[0]).toEqual("#03b365");

    //Check rgba value
    expect(extractColorsFromString(borderWithRgba)[0]).toEqual(
      "rgba(0, 0, 0, 0.25)",
    );

    //Check rgb
    expect(extractColorsFromString(borderWithRgb)[0]).toEqual("rgb(0,0,0)");
  });
});
