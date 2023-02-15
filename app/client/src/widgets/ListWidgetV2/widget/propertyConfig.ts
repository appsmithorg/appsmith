import { get, isPlainObject } from "lodash";
import log from "loglevel";

import { EVALUATION_PATH, EVAL_VALUE_PATH } from "utils/DynamicBindingUtils";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { ValidationTypes } from "constants/WidgetValidation";
import { WidgetProps } from "widgets/BaseWidget";
import { ListWidgetProps } from ".";
import { getBindingTemplate } from "../constants";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";
import { ErrorMessageType } from "entities/AppsmithConsole";

const MIN_ITEM_SPACING = 0;
const MAX_ITEM_SPACING = 16;

const isValidListData = (
  value: unknown,
): value is Exclude<ListWidgetProps["listData"], undefined> => {
  return Array.isArray(value) && value.length > 0 && isPlainObject(value[0]);
};

export const primaryColumnValidation = (
  inputValue: unknown,
  props: ListWidgetProps,
  _: any,
) => {
  const { listData = [], dynamicPropertyPathList = [] } = props;
  const isArray = Array.isArray(inputValue);
  const isJSModeEnabled = Boolean(
    dynamicPropertyPathList.find((d) => d.key === "primaryKeys"),
  );

  if (isArray) {
    if (inputValue.length === 0) {
      return {
        isValid: false,
        parsed: [],
        messages: [
          {
            name: ErrorMessageType.VALIDATION_ERROR,
            message:
              "This data identifier evaluates to an empty array. Please use an identifier that evaluates to a valid value.",
          },
        ],
      };
    }

    // when PrimaryKey is {{ currentItem["img"] }} and img doesn't exist in the data.
    if (inputValue.every((value) => _.isNil(value))) {
      return {
        isValid: false,
        parsed: inputValue, // undefined the chosen key doesn't exist.
        messages: [
          {
            name: ErrorMessageType.VALIDATION_ERROR,
            message:
              "This identifier isn't a data attribute. Use an existing data attribute as your data identifier.",
          },
        ],
      };
    }

    //  PrimaryKey evaluation has null or undefined values.
    if (inputValue.some((value) => _.isNil(value))) {
      return {
        isValid: false,
        parsed: inputValue,
        messages: [
          {
            name: ErrorMessageType.VALIDATION_ERROR,
            message:
              "This data identifier evaluates to null or undefined. Please use an identifier that evaluates to a valid value.",
          },
        ],
      };
    }

    const areKeysUnique = _.uniq(inputValue).length === listData.length;

    if (!areKeysUnique) {
      return {
        isValid: false,
        parsed: [], // Empty array as the inputValue is an array type
        messages: [
          {
            name: ErrorMessageType.VALIDATION_ERROR,
            message:
              "This data identifier is evaluating to a duplicate value. Please use an identifier that evaluates to a unique value.",
          },
        ],
      };
    }
  } else {
    const message = isJSModeEnabled
      ? "Use currentItem or currentIndex to find a good data identifier. You can also combine two or more data attributes or columns."
      : "Select an option from the dropdown or toggle JS on to define a data identifier.";

    return {
      isValid: false,
      parsed: undefined, // undefined as we do not know what the data type of inputValue is so "[]" is not an appropriate value to return
      messages: [{ name: ErrorMessageType.VALIDATION_ERROR, message }],
    };
  }

  return {
    isValid: true,
    parsed: inputValue,
    messages: [{ name: "", message: "" }],
  };
};

const getPrimaryKeyFromDynamicValue = (
  prefixTemplate: string,
  suffixTemplate: string,
  dynamicValue?: string,
) => {
  if (!dynamicValue) return "";

  const updatedPrefix = `${prefixTemplate} currentItem[`;
  const updatedSuffix = `] ${suffixTemplate}`;
  const suffixLength = dynamicValue.length - updatedSuffix.length;

  const value = dynamicValue.substring(updatedPrefix.length, suffixLength);

  try {
    return JSON.parse(value);
  } catch (error) {
    log.error(error);
    return "";
  }
};

export const primaryKeyOptions = (props: ListWidgetProps) => {
  const { widgetName } = props;
  // Since this is uneval value, coercing it to primitive type
  const primaryKeys = (props.primaryKeys as unknown) as string | undefined;
  const listData = props[EVALUATION_PATH]?.evaluatedValues?.listData || [];
  const { prefixTemplate, suffixTemplate } = getBindingTemplate(widgetName);

  const prevSelectedKey = getPrimaryKeyFromDynamicValue(
    prefixTemplate,
    suffixTemplate,
    primaryKeys,
  );
  const options: {
    label: string;
    value: string;
  }[] = [];

  // Add previously selected key to options
  if (prevSelectedKey) {
    options.push({
      label: prevSelectedKey,
      value: `${prefixTemplate} currentItem[${JSON.stringify(
        prevSelectedKey,
      )}] ${suffixTemplate}`,
    });
  }

  if (isValidListData(listData)) {
    Object.keys(listData[0]).forEach((key) => {
      if (key !== prevSelectedKey) {
        options.push({
          label: key,
          value: `${prefixTemplate} currentItem[${JSON.stringify(
            key,
          )}] ${suffixTemplate}`,
        });
      }
    });
  }
  return options;
};

export const PropertyPaneContentConfig = [
  {
    sectionName: "Data",
    children: [
      {
        propertyName: "listData",
        helpText: "Reference or write an array to display in the List.",
        label: "Items",
        controlType: "INPUT_TEXT",
        placeholderText: '[{ "name": "John" }]',
        inputType: "ARRAY",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.ARRAY },
        evaluationSubstitutionType: EvaluationSubstitutionType.SMART_SUBSTITUTE,
      },
      {
        propertyName: "primaryKeys",
        helperText:
          "Like keys in React, you must include a primary data identifier, often a column from your datasource. You could also combine two columns or data attributes.",
        label: "Data Identifier",
        controlType: "DROP_DOWN",
        dropdownUsePropertyValue: true,
        customJSControl: "LIST_COMPUTE_CONTROL",
        isBindProperty: true,
        isTriggerProperty: false,
        isJSConvertible: true,
        dependencies: ["listData"],
        evaluatedDependencies: ["listData"],
        options: primaryKeyOptions,
        validation: {
          type: ValidationTypes.FUNCTION,
          params: {
            fn: primaryColumnValidation,
            expected: {
              type: "Array<string | number>",
              example: `["1", "2", "3"]`,
              autocompleteDataType: AutocompleteDataType.ARRAY,
            },
          },
        },
      },
    ],
  },
  {
    sectionName: "Pagination",
    children: [
      // Disabling till List V2.1
      // {
      //   propertyName: "infiniteScroll",
      //   label: "Infinite scroll",
      //   helpText: "Scrolls vertically, removes pagination",
      //   controlType: "SWITCH",
      //   isJSConvertible: true,
      //   isBindProperty: true,
      //   isTriggerProperty: false,
      //   validation: {
      //     type: ValidationTypes.BOOLEAN,
      //   },
      // },
      {
        propertyName: "serverSidePagination",
        helpText:
          "Triggered by onPageChange, this helps you show your data one page at a time for better performance.",
        label: "Server Side Pagination",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        propertyName: "onPageChange",
        helpText:
          "Configure one or chain multiple Actions when the page is changed in a List. All nested Actions run at the same time.",
        label: "onPageChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        hidden: (props: ListWidgetProps<WidgetProps>) =>
          !props.serverSidePagination,
        dependencies: ["serverSidePagination"],
      },
    ],
  },
  {
    sectionName: "General",
    children: [
      {
        propertyName: "isVisible",
        label: "Visible",
        helpText: "Toggles the visibility of this List to end users",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      {
        propertyName: "animateLoading",
        label: "Animate Loading",
        controlType: "SWITCH",
        helpText:
          "Toggles the loading animation of this List on and off for end-users",
        defaultValue: true,
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.BOOLEAN },
      },
    ],
  },
  {
    sectionName: "Events",
    children: [
      {
        propertyName: "onItemClick",
        helpText: "Triggers an action when an item in this List is clicked",
        label: "onItemClick",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        additionalAutoComplete: (props: ListWidgetProps<WidgetProps>) => {
          let items = get(props, `${EVAL_VALUE_PATH}.listData`, []);

          if (Array.isArray(items)) {
            items = items.filter(Boolean);
          } else {
            items = [];
          }

          return {
            currentItem: Object.assign(
              {},
              ...Object.keys(get(items, "0", {})).map((key) => ({
                [key]: "",
              })),
            ),
            currentIndex: 0,
          };
        },
        dependencies: ["listData"],
      },
    ],
  },
];

export const PropertyPaneStyleConfig = [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "itemSpacing",
        helpText: "Sets the spacing between items in pixels to a max 16 px",
        placeholderText: "0",
        label: "Item Spacing (px)",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        inputType: "INTEGER",
        validation: {
          type: ValidationTypes.NUMBER,
          params: { min: MIN_ITEM_SPACING, max: MAX_ITEM_SPACING },
        },
      },
    ],
  },
  {
    sectionName: "Color",
    children: [
      {
        propertyName: "backgroundColor",
        label: "Background Color",
        helpText: "Sets the background color of this List",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            expected: {
              type: "Color name | hex code",
              example: "#FFFFFF",
              autocompleteDataType: AutocompleteDataType.STRING,
            },
          },
        },
      },
    ],
  },
  {
    sectionName: "Border and Shadow",
    children: [
      {
        propertyName: "borderRadius",
        label: "Border Radius",
        helpText: "Rounds the corners of the List's border",
        controlType: "BORDER_RADIUS_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "boxShadow",
        label: "Box Shadow",
        helpText: "Drops a shadow from the frame of this List",
        controlType: "BOX_SHADOW_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
];
