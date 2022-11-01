import { get, isPlainObject } from "lodash";

import { AutocompleteDataType } from "utils/autocomplete/TernServer";
import { EVALUATION_PATH, EVAL_VALUE_PATH } from "utils/DynamicBindingUtils";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import { ValidationTypes } from "constants/WidgetValidation";
import { WidgetProps } from "widgets/BaseWidget";
import { ListWidgetProps } from ".";

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
  if (Array.isArray(inputValue)) {
    const areKeysUnique = _.uniq(inputValue).length === props.listData?.length;

    if (!areKeysUnique) {
      return {
        isValid: false,
        parsed: [],
        messages: ["Primary keys are not unique."],
      };
    }
  }

  return {
    isValid: true,
    parsed: inputValue,
    messages: [""],
  };
};

const PropertyPaneConfig = [
  {
    sectionName: "General",
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
        helpText:
          "Bind the List.pageNo property in your API and call it onPageChange",
        propertyName: "serverSidePaginationEnabled",
        label: "Server Side Pagination",
        controlType: "SWITCH",
        isBindProperty: false,
        isTriggerProperty: false,
      },
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
        propertyName: "infiniteScroll",
        label: "Infinite scroll",
        helpText: "Scrolls vertically, removes pagination",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        validation: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      {
        propertyName: "primaryKey",
        helpText:
          "Assign a unique column which improves performance and maintains values across page changes",
        label: "Primary key",
        controlType: "DROP_DOWN",
        customJSControl: "LIST_COMPUTE_CONTROL",
        isBindProperty: true,
        isTriggerProperty: false,
        isJSConvertible: true,
        dependencies: ["listData"],
        evaluatedDependencies: ["listData"],
        options: (props: ListWidgetProps) => {
          const listData =
            props[EVALUATION_PATH]?.evaluatedValues?.listData || [];

          if (isValidListData(listData)) {
            return Object.keys(listData[0]).map((key) => ({
              label: key,
              value: key,
            }));
          } else {
            return [];
          }
        },
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
        helpText: "Triggers an action when a grid list item is clicked",
        propertyName: "onListItemClick",
        label: "onListItemClick",
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
          };
        },
        dependencies: ["listData"],
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
          !props.serverSidePaginationEnabled,
        dependencies: ["serverSidePaginationEnabled"],
      },
      {
        helpText: "Triggers an action when a list page size is changed",
        propertyName: "onPageSizeChange",
        label: "onPageSizeChange",
        controlType: "ACTION_SELECTOR",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: true,
        hidden: (props: ListWidgetProps<WidgetProps>) =>
          !props.serverSidePaginationEnabled,
        dependencies: ["serverSidePaginationEnabled"],
      },
    ],
  },
  {
    sectionName: "Styles",
    children: [
      {
        propertyName: "backgroundColor",
        label: "Background Color",
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
      {
        propertyName: "itemBackgroundColor",
        label: "Item Background Color",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        defaultValue: "#FFFFFF",
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
      {
        helpText: "Spacing between items in Pixels",
        placeholderText: "0",
        propertyName: "gridGap",
        label: "Item Spacing (px)",
        controlType: "INPUT_TEXT",
        isBindProperty: true,
        isTriggerProperty: false,
        inputType: "INTEGER",
        validation: { type: ValidationTypes.NUMBER, params: { min: -8 } },
      },
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

export { PropertyPaneConfig as default };
