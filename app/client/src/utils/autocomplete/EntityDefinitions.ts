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
    inputType: "string",
    isDirty: "bool",
    isFocused: "bool",
    isLoading: isLoading,
    isValid: "bool",
    isVisible: isVisible,
    defaultText: "string",
    label: {
      "!type": "string",
      "!doc": "The label value of the input. Can be set as empty string",
      "!url": "https://docs.appsmith.com/widget-reference/input",
    },
  },
  TABLE_WIDGET: (widget: any) => ({
    "!doc":
      "The Table is the hero widget of Appsmith. You can display data from an API in a table, trigger an action when a user selects a row and even work with large paginated data sets",
    "!url": "https://docs.appsmith.com/widget-reference/table",
    isLoading: isLoading,
    isVisible: isVisible,
    selectedRow: generateTypeDef(widget.selectedRow),
    selectedRowIndex: "number",
    tableData: generateTypeDef(widget.tableData),
  }),
  DROP_DOWN_WIDGET: {
    "!doc":
      "Dropdown is used to capture user input/s from a specified list of permitted inputs. A Dropdown can capture a single choice as well as multiple choices",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    isLoading: isLoading,
    isVisible: isVisible,
    placeholderText: "string",
    label: "string",
    selectedIndex: "number",
    selectedIndexArr: "[number]",
    selectionType: "string",
    selectedOption: "dropdownOption",
    options: "[dropdownOption]",
    defaultOptionValue: "string",
    isRequired: "bool",
  },
  IMAGE_WIDGET: {
    "!doc":
      "Image widget is used to display images in your app. Images must be either a URL or a valid base64.",
    "!url": "https://docs.appsmith.com/widget-reference/image",
    isLoading: isLoading,
    image: "string",
    defaultImage: "string",
    isVisible: isVisible,
  },
  TEXT_WIDGET: {
    "!doc":
      "‌Text widget is used to display textual information. Whether you want to display a paragraph or information or add a heading to a container, a text widget makes it easy to style and display text",
    "!url": "https://docs.appsmith.com/widget-reference/text",
    isLoading: isLoading,
    isVisible: isVisible,
    text: "string",
    textStyle: "string",
    textAlign: "string",
    shouldScroll: "bool",
  },
  BUTTON_WIDGET: {
    "!doc":
      "Buttons are used to capture user intent and trigger actions based on that intent",
    "!url": "https://docs.appsmith.com/widget-reference/button",
    isLoading: isLoading,
    isVisible: isVisible,
    text: "string",
    buttonStyle: "string",
    isDisabled: "bool",
  },
  DATE_PICKER_WIDGET: {
    "!doc":
      "Datepicker is used to capture the date and time from a user. It can be used to filter data base on the input date range as well as to capture personal information such as date of birth",
    "!url": "https://docs.appsmith.com/widget-reference/datepicker",
    isLoading: isLoading,
    isVisible: isVisible,
    defaultDate: "string",
    selectedDate: "string",
    isDisabled: "bool",
    dateFormat: "string",
    label: "string",
    datePickerType: "string",
    maxDate: "Date",
    minDate: "Date",
    isRequired: "bool",
  },
  CHECKBOX_WIDGET: {
    "!doc":
      "Checkbox is a simple UI widget you can use when you want users to make a binary choice",
    "!url": "https://docs.appsmith.com/widget-reference/checkbox",
    isLoading: isLoading,
    isVisible: isVisible,
    label: "string",
    defaultCheckedState: "bool",
    isChecked: "bool",
    isDisabled: "bool",
  },
  RADIO_GROUP_WIDGET: {
    "!doc":
      "Radio widget lets the user choose only one option from a predefined set of options. It is quite similar to a SingleSelect Dropdown in its functionality",
    "!url": "https://docs.appsmith.com/widget-reference/radio",
    isLoading: isLoading,
    isVisible: isVisible,
    label: "string",
    options: "[dropdownOption]",
    selectedOptionValue: "string",
    defaultOptionValue: "string",
    isRequired: "bool",
  },
  TABS_WIDGET: {
    isLoading: isLoading,
    isVisible: isVisible,
    shouldScrollContents: "bool",
    tabs: "[tabs]",
    selectedTab: "string",
    selectedTabId: "string",
  },
  MODAL_WIDGET: {
    isLoading: isLoading,
    isVisible: isVisible,
    isOpen: "bool",
    canOutsideClickClose: "bool",
    canEscapeKeyClose: "bool",
    shouldScrollContents: "bool",
    size: "string",
  },
  RICH_TEXT_EDITOR_WIDGET: {
    isLoading: isLoading,
    isVisible: isVisible,
    defaultText: "string",
    text: "string",
    placeholder: "string",
    isDisabled: "string",
  },
  CHART_WIDGET: {
    "!doc":
      "Chart widget is used to view the graphical representation of your data. Chart is the go-to widget for your data visualisation needs.",
    "!url": "https://docs.appsmith.com/widget-reference/chart",
    isLoading: isLoading,
    isVisible: isVisible,
    chartType: "string",
    chartData: "chartData",
    xAxisName: "string",
    yAxisName: "string",
    chartName: "string",
  },
  FORM_WIDGET: {
    "!doc":
      "Form is used to capture a set of data inputs from a user. Forms are used specifically because they reset the data inputs when a form is submitted and disable submission for invalid data inputs",
    "!url": "https://docs.appsmith.com/widget-reference/form",
    isLoading: isLoading,
    isVisible: isVisible,
  },
  FORM_BUTTON_WIDGET: {
    "!doc":
      "Form button is provided by default to every form. It is used for form submission and resetting form inputs",
    "!url": "https://docs.appsmith.com/widget-reference/form",
    isLoading: isLoading,
    isVisible: isVisible,
    text: "string",
    buttonStyle: "string",
    isDisabled: "bool",
    resetFormOnClick: "bool",
    disabledWhenInvalid: "bool",
  },
  MAP_WIDGET: {
    isLoading: isLoading,
    isVisible: isVisible,
    enableSearch: "bool",
    zoomLevel: "number",
    allowZoom: "bool",
    enablePickLocation: "bool",
    mapCenter: "latLong",
    center: "latLong",
    defaultMarkers: "[mapMarker]",
    markers: "[mapMarker]",
    selectedMarker: "mapMarker",
  },
  FILE_PICKER_WIDGET: {
    "!doc":
      "Filepicker widget is used to allow users to upload files from their local machines to any cloud storage via API. Cloudinary and Amazon S3 have simple APIs for cloud storage uploads",
    "!url": "https://docs.appsmith.com/widget-reference/filepicker",
    isLoading: isLoading,
    isVisible: isVisible,
    label: "string",
    maxNumFiles: "number",
    maxFileSize: "number",
    files: "[?]",
    allowedFileTypes: "[string]",
    isRequired: "bool",
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
