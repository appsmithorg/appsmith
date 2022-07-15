import { ValidationTypes } from "constants/WidgetValidation";
import { TableWidgetProps } from "widgets/TableWidgetV2/constants";

export default {
  sectionName: "Header options",
  children: [
    {
      propertyName: "isVisibleSearch",
      helpText: "Toggle visibility of the search box",
      label: "Search",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      propertyName: "isVisibleFilters",
      helpText: "Toggle visibility of the filters",
      label: "Filters",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      propertyName: "isVisibleDownload",
      helpText: "Toggle visibility of the data download",
      label: "Download",
      controlType: "SWITCH",
      isJSConvertible: true,
      isBindProperty: true,
      isTriggerProperty: false,
      validation: { type: ValidationTypes.BOOLEAN },
    },
    {
      propertyName: "isVisiblePagination",
      helpText: "Toggle visibility of the pagination",
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
