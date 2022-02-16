import { ValidationTypes } from "constants/WidgetValidation";
import { TableWidgetProps } from "widgets/TableWidgetV2/constants";

export default {
  sectionName: "Header options",
  children: [
    {
      helpText: "Toggle visibility of the search box",
      propertyName: "isVisibleSearch",
      label: "Search",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      helpText: "Toggle visibility of the filters",
      propertyName: "isVisibleFilters",
      label: "Filters",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      helpText: "Toggle visibility of the data download",
      propertyName: "isVisibleDownload",
      label: "Download",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      helpText: "Toggle visibility of the pagination",
      propertyName: "isVisiblePagination",
      label: "Pagination",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      propertyName: "delimiter",
      label: "CSV Separator",
      controlType: "INPUT_TEXT",
      placeholderText: "Enter CSV separator",
      helpText: "The character used for separating the CSV download file.",
      isBindProperty: true,
      isTriggerProperty: false,
      defaultValue: ",",
      validation: {
        type: ValidationTypes.TEXT,
      },
      hidden: (props: TableWidgetProps) => !props.isVisibleDownload,
      dependencies: ["isVisibleDownload"],
    },
  ],
};
