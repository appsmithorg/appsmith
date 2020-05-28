import { generateTypeDef } from "utils/autocomplete/dataTreeTypeDefCreator";
import { DataTreeAction } from "entities/DataTree/dataTreeFactory";

const isLoading = {
  "!type": "bool",
  "!doc": "Boolean value indicating if the entity is in loading state",
};
const isVisible = {
  "!type": "bool",
  "!doc": "Boolean value indicating if the widget is in visible state",
};

export const entityDefinitions = {
  ACTION: (entity: DataTreeAction) => ({
    "!doc":
      "Actions allow you to connect your widgets to your backend data in a secure manner.",
    "!url": "https://docs.appsmith.com/quick-start#connect-your-apis",
    isLoading: "bool",
    data: generateTypeDef(entity.data),
    run: "fn(onSuccess: fn() -> void, onError: fn() -> void) -> void",
  }),
  CONTAINER_WIDGET: {
    "!doc":
      "Containers are used to group widgets together to form logical higher order widgets. Containers let you organize your page better and move all the widgets inside them together.",
    "!url": "https://docs.appsmith.com/widget-reference/how-to-use-widgets",
    backgroundColor: {
      "!type": "string",
      "!url": "https://docs.appsmith.com/widget-reference/how-to-use-widgets",
    },
    isVisible: isVisible,
  },
  INPUT_WIDGET: {
    "!doc":
      "An input text field is used to capture a users textual input such as their names, numbers, emails etc. Inputs are used in forms and can have custom validations.",
    "!url": "https://docs.appsmith.com/widget-reference/input",
    text: {
      "!type": "string",
      "!doc": "The text value of the input",
      "!url": "https://docs.appsmith.com/widget-reference/input",
    },
    isValid: "bool",
    isVisible: isVisible,
    isDisabled: "bool",
  },
  TABLE_WIDGET: (widget: any) => ({
    "!doc":
      "The Table is the hero widget of Appsmith. You can display data from an API in a table, trigger an action when a user selects a row and even work with large paginated data sets",
    "!url": "https://docs.appsmith.com/widget-reference/table",
    selectedRow: generateTypeDef(widget.selectedRow),
    selectedRowIndex: "number",
    tableData: generateTypeDef(widget.tableData),
    pageNo: "number",
    pageSize: "number",
    isVisible: isVisible,
  }),
  DROP_DOWN_WIDGET: {
    "!doc":
      "Dropdown is used to capture user input/s from a specified list of permitted inputs. A Dropdown can capture a single choice as well as multiple choices",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    isVisible: isVisible,
    selectedOptionValue: {
      "!type": "string",
      "!doc": "The value selected in a single select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    selectedOptionValueArr: {
      "!type": "[string]",
      "!doc": "The array of values selected in a multi select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    isDisabled: "bool",
    options: "[dropdownOption]",
  },
  IMAGE_WIDGET: {
    "!doc":
      "Image widget is used to display images in your app. Images must be either a URL or a valid base64.",
    "!url": "https://docs.appsmith.com/widget-reference/image",
    image: "string",
    isVisible: isVisible,
  },
  TEXT_WIDGET: {
    "!doc":
      "‌Text widget is used to display textual information. Whether you want to display a paragraph or information or add a heading to a container, a text widget makes it easy to style and display text",
    "!url": "https://docs.appsmith.com/widget-reference/text",
    isVisible: isVisible,
    text: "string",
  },
  BUTTON_WIDGET: {
    "!doc":
      "Buttons are used to capture user intent and trigger actions based on that intent",
    "!url": "https://docs.appsmith.com/widget-reference/button",
    isVisible: isVisible,
    text: "string",
    isDisabled: "bool",
  },
  DATE_PICKER_WIDGET: {
    "!doc":
      "Datepicker is used to capture the date and time from a user. It can be used to filter data base on the input date range as well as to capture personal information such as date of birth",
    "!url": "https://docs.appsmith.com/widget-reference/datepicker",
    isVisible: isVisible,
    selectedDate: "string",
    isDisabled: "bool",
  },
  CHECKBOX_WIDGET: {
    "!doc":
      "Checkbox is a simple UI widget you can use when you want users to make a binary choice",
    "!url": "https://docs.appsmith.com/widget-reference/checkbox",
    isVisible: isVisible,
    isChecked: "bool",
    isDisabled: "bool",
  },
  RADIO_GROUP_WIDGET: {
    "!doc":
      "Radio widget lets the user choose only one option from a predefined set of options. It is quite similar to a SingleSelect Dropdown in its functionality",
    "!url": "https://docs.appsmith.com/widget-reference/radio",
    isVisible: isVisible,
    options: "[dropdownOption]",
    selectedOptionValue: "string",
    isRequired: "bool",
  },
  TABS_WIDGET: {
    isVisible: isVisible,
    tabs: "[tabs]",
    selectedTab: "string",
  },
  MODAL_WIDGET: {
    isVisible: isVisible,
    isOpen: "bool",
  },
  RICH_TEXT_EDITOR_WIDGET: {
    isVisible: isVisible,
    text: "string",
    isDisabled: "string",
  },
  CHART_WIDGET: {
    "!doc":
      "Chart widget is used to view the graphical representation of your data. Chart is the go-to widget for your data visualisation needs.",
    "!url": "https://docs.appsmith.com/widget-reference/chart",
    isVisible: isVisible,
    chartData: "chartData",
    xAxisName: "string",
    yAxisName: "string",
  },
  FORM_WIDGET: {
    "!doc":
      "Form is used to capture a set of data inputs from a user. Forms are used specifically because they reset the data inputs when a form is submitted and disable submission for invalid data inputs",
    "!url": "https://docs.appsmith.com/widget-reference/form",
    isVisible: isVisible,
  },
  FORM_BUTTON_WIDGET: {
    "!doc":
      "Form button is provided by default to every form. It is used for form submission and resetting form inputs",
    "!url": "https://docs.appsmith.com/widget-reference/form",
    isVisible: isVisible,
    text: "string",
    isDisabled: "bool",
  },
  MAP_WIDGET: {
    isVisible: isVisible,
    mapCenter: "latLong",
    center: "latLong",
    markers: "[mapMarker]",
    selectedMarker: "mapMarker",
  },
  FILE_PICKER_WIDGET: {
    "!doc":
      "Filepicker widget is used to allow users to upload files from their local machines to any cloud storage via API. Cloudinary and Amazon S3 have simple APIs for cloud storage uploads",
    "!url": "https://docs.appsmith.com/widget-reference/filepicker",
    isVisible: isVisible,
    files: "[?]",
    isDisabled: "bool",
    uploadedFileUrls: "string",
  },
};

export const GLOBAL_DEFS = {
  dropdownOption: {
    label: "string",
    value: "string",
  },
  tabs: {
    id: "string",
    label: "string",
  },
  chartDataPoint: {
    x: "string",
    y: "string",
  },
  chartData: {
    seriesName: "string",
    data: "[chartDataPoint]",
  },
  latLong: {
    lat: "number",
    long: "number",
  },
  mapMarker: {
    lat: "number",
    long: "number",
    title: "string",
    description: "string",
  },
};

export const GLOBAL_FUNCTIONS = {
  navigateTo: {
    "!doc": "Action to navigate the user to another page or url",
    "!type": "fn(pageNameOrUrl: string, params: {}) -> void",
  },
  showAlert: {
    "!doc": "Show a temporary notification style message to the user",
    "!type": "fn(message: string, style: string) -> void",
  },
  showModal: {
    "!doc": "Open a modal",
    "!type": "fn(modalName: string) -> void",
  },
  closeModal: {
    "!doc": "Close a modal",
    "!type": "fn(modalName: string) -> void",
  },
};
