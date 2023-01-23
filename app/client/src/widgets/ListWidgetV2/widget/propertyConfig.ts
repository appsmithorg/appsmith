import { get, isPlainObject } from "lodash";

import { EVALUATION_PATH, EVAL_VALUE_PATH } from "utils/DynamicBindingUtils";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { ValidationTypes } from "constants/WidgetValidation";
import { WidgetProps } from "widgets/BaseWidget";
import { ListWidgetProps } from ".";
import { getBindingTemplate } from "../constants";
import { AutocompleteDataType } from "utils/autocomplete/CodemirrorTernService";

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
        messages: ["Primary key cannot be empty"],
      };
    }

    const areKeysUnique = _.uniq(inputValue).length === listData.length;

    if (!areKeysUnique) {
      return {
        isValid: false,
        parsed: [], // Empty array as the inputValue is an array type
        messages: ["Primary keys are not unique."],
      };
    }
  } else {
    const message = isJSModeEnabled
      ? "Use currentItem/currentIndex to generate primary key or composite key"
      : "Select valid option form the primary key list";

    return {
      isValid: false,
      parsed: undefined, // undefined as we do not know what the data type of inputValue is so "[]" is not an appropriate value to return
      messages: [message],
    };
  }

  return {
    isValid: true,
    parsed: inputValue,
    messages: [""],
  };
};

const getPrimaryKeyFromDynamicValue = (
  prefixTemplate: string,
  suffixTemplate: string,
  dynamicValue?: any,
) => {
  if (!dynamicValue) return "";

  const updatedPrefix = `${prefixTemplate} currentItem[`;
  const updatedSuffix = `] ${suffixTemplate}`;
  const suffixLength = dynamicValue.length - updatedSuffix.length;

  const value = dynamicValue.substring(updatedPrefix.length, suffixLength);

  try {
    return JSON.parse(value);
  } catch (error) {
    return "";
  }
};

export const primaryKeyOptions = (props: ListWidgetProps) => {
  const { primaryKeys, widgetName } = props;
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
  options.push({
    label: prevSelectedKey,
    value: `${prefixTemplate} currentItem[${JSON.stringify(
      prevSelectedKey,
    )}] ${suffixTemplate}`,
  });

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
        helpText: "Takes in an array of objects to display items in the list.",
        propertyName: "listData",
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
        helpText:
          "Assign a unique column which improves performance and maintains values across page changes",
        label: "Primary key",
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
          "Bind the List.pageNo property in your API and call it onPageChange",
        label: "Server Side Pagination",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
      {
        helpText: "Triggers an action when a list page is changed",
        propertyName: "onPageChange",
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
        helpText: "Controls the visibility of the widget",
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
        helpText: "Controls the loading of the widget",
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
        helpText: "Triggers an action when an item is clicked",
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
        helpText: "Spacing between items in Pixels",
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
        helpText: "Background color of the list container",
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
        helpText: "Rounds the corners of the icon button's outer border edge",
        controlType: "BORDER_RADIUS_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
      {
        propertyName: "boxShadow",
        label: "Box Shadow",
        helpText:
          "Enables you to cast a drop shadow from the frame of the widget",
        controlType: "BOX_SHADOW_OPTIONS",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ],
  },
];
