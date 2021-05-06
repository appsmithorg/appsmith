import { get } from "lodash";
import { WidgetProps } from "widgets/BaseWidget";
import { ListWidgetProps } from "./ListWidget";
import { VALIDATION_TYPES } from "constants/WidgetValidation";

const PropertyPaneConfig = [
  {
    sectionName: "General",
    children: [
      {
        helpText: "Takes in an array of objects to display items in the list.",
        propertyName: "items",
        label: "Items",
        controlType: "INPUT_TEXT",
        placeholderText: 'Enter [{ "col1": "val1" }]',
        inputType: "ARRAY",
        isBindProperty: true,
        isTriggerProperty: false,
        validation: VALIDATION_TYPES.LIST_DATA,
      },
      {
        propertyName: "backgroundColor",
        label: "Background",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
      },
      {
        propertyName: "itemBackgroundColor",
        label: "Item Background",
        controlType: "COLOR_PICKER",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
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
        validation: VALIDATION_TYPES.NUMBER,
      },
      {
        propertyName: "isVisible",
        label: "Visible",
        helpText: "Controls the visibility of the widget",
        controlType: "SWITCH",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
      },
    ],
  },
  {
    sectionName: "Actions",
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
          return {
            currentItem: Object.assign(
              {},
              ...Object.keys(get(props, "evaluatedValues.items.0", {})).map(
                (key) => ({
                  [key]: "",
                }),
              ),
            ),
          };
        },
      },
    ],
  },
];

export { PropertyPaneConfig as default };
