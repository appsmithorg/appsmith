import { ValidationTypes } from "constants/WidgetValidation";
import { WidgetProps } from "widgets/BaseWidget";
import { AutocompleteDataType } from "./autocomplete/TernServer";
import {
  convertFunctionsToString,
  enhancePropertyPaneConfig,
} from "./WidgetFactoryHelpers";
import { DynamicHeight } from "./WidgetFeatures";

const ORIGINAL_PROPERTY_CONFIG = [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "url",
        label: "URL",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter URL",
        inputType: "TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
      },
    ],
  },
  {
    sectionName: "Events",
    children: [
      {
        helpText: "Triggers an action when the video is played",
        propertyName: "onPlay",
        label: "onPlay",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Triggers an action when the video is paused",
        propertyName: "onPause",
        label: "onPause",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Triggers an action when the video ends",
        propertyName: "onEnd",
        label: "onEnd",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
];

const EXPECTED_PROPERTY_CONFIG = [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "url",
        label: "URL",
        controlType: "INPUT_TEXT",
        placeholderText: "Enter URL",
        inputType: "TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
      },
    ],
  },
  {
    sectionName: "Layout Features",
    children: [
      {
        helpText:
          "Dynamic Height: Configure the way the widget height react to content changes.",
        propertyName: "dynamicHeight",
        label: "Height",
        controlType: "DROP_DOWN",
        isBindProperty: false,
        isTriggerProperty: false,
        options: [
          {
            label: "Hug Contents",
            value: DynamicHeight.HUG_CONTENTS,
          },
          {
            label: "Fixed",
            value: DynamicHeight.FIXED,
          },
        ],
      },
      {
        propertyName: "minDynamicHeight",
        label: "Min Height (in rows)",
        helpText: "Minimum number of rows to occupy irrespective of contents",
        controlType: "INPUT_TEXT",
        hidden: (props: WidgetProps) => {
          return props.dynamicHeight !== DynamicHeight.HUG_CONTENTS;
        },
        dependencies: ["dynamicHeight"],
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "maxDynamicHeight",
        label: "Max Height (in rows)",
        helpText: "Maximum Height, after which contents will scroll",
        controlType: "INPUT_TEXT",
        dependencies: ["dynamicHeight"],
        hidden: (props: WidgetProps) => {
          return props.dynamicHeight !== DynamicHeight.HUG_CONTENTS;
        },
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
      },
    ],
  },
  {
    sectionName: "Events",
    children: [
      {
        helpText: "Triggers an action when the video is played",
        propertyName: "onPlay",
        label: "onPlay",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Triggers an action when the video is paused",
        propertyName: "onPause",
        label: "onPause",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
      {
        helpText: "Triggers an action when the video ends",
        propertyName: "onEnd",
        label: "onEnd",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
      },
    ],
  },
];

describe("Widget Factory Helper tests", () => {
  it("Make sure dynamicHeight property configs are added when enabled in widget", () => {
    const features = {
      dynamicHeight: true,
    };
    const result = enhancePropertyPaneConfig(
      ORIGINAL_PROPERTY_CONFIG,
      features,
    );
    expect(JSON.stringify(result)).toEqual(
      JSON.stringify(EXPECTED_PROPERTY_CONFIG),
    );
  });
  it("Make sure dynamicHeight property configs are NOT added when disabled in widget", () => {
    const features = {
      dynamicHeight: false,
    };

    const result_with_false = enhancePropertyPaneConfig(
      ORIGINAL_PROPERTY_CONFIG,
      features,
    );
    const result_with_undefined = enhancePropertyPaneConfig(
      ORIGINAL_PROPERTY_CONFIG,
      undefined,
    );

    expect(result_with_false).toStrictEqual(ORIGINAL_PROPERTY_CONFIG);
    expect(result_with_undefined).toStrictEqual(ORIGINAL_PROPERTY_CONFIG);
  });

  it("Makes sure that fn function validation params are converted to fnString", () => {
    const add = (value: unknown) => {
      return {
        parsed: (value as string) + "__suffix",
        message: [],
        isValid: true,
      };
    };
    const config = [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "url",
            label: "URL",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL",
            inputType: "TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: add,
                expected: {
                  type: "number",
                  example: `100`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
          },
        ],
      },
    ];

    const expected = [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "url",
            label: "URL",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL",
            inputType: "TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fnString: add.toString(),
                expected: {
                  type: "number",
                  example: `100`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
          },
        ],
      },
    ];
    const result = convertFunctionsToString(config);
    expect(result).toStrictEqual(expected);
  });
});
