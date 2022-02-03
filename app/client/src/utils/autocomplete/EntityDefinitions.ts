import { generateTypeDef } from "utils/autocomplete/dataTreeTypeDefCreator";
import {
  DataTreeAction,
  DataTreeAppsmith,
} from "entities/DataTree/dataTreeFactory";
import _ from "lodash";
import { JSCollection } from "entities/JSCollection";
import { EVALUATION_PATH } from "utils/DynamicBindingUtils";

const isVisible = {
  "!type": "bool",
  "!doc": "Boolean value indicating if the widget is in visible state",
};

export const entityDefinitions: Record<string, unknown> = {
  APPSMITH: (entity: DataTreeAppsmith) => {
    const generatedTypeDef = generateTypeDef(
      _.omit(entity, "ENTITY_TYPE", EVALUATION_PATH),
    );
    if (
      typeof generatedTypeDef === "object" &&
      typeof generatedTypeDef.geolocation === "object"
    ) {
      return {
        ...generatedTypeDef,
        geolocation: {
          ...generatedTypeDef.geolocation,
          "!doc":
            "The user's geo location information. Only available when requested",
          "!url":
            "https://docs.appsmith.com/v/v1.2.1/framework-reference/geolocation",
          getCurrentPosition:
            "fn(onSuccess: fn() -> void, onError: fn() -> void, options: object) -> void",
          watchPosition: "fn(options: object) -> void",
          clearWatch: "fn() -> void",
        },
      };
    }
    return generatedTypeDef;
  },
  ACTION: (entity: DataTreeAction) => {
    const dataDef = generateTypeDef(entity.data);
    let data: Record<string, any> = {
      "!doc": "The response of the action",
    };
    if (_.isString(dataDef)) {
      data["!type"] = dataDef;
    } else {
      data = { ...data, ...dataDef };
    }
    return {
      "!doc":
        "Actions allow you to connect your widgets to your backend data in a secure manner.",
      "!url": "https://docs.appsmith.com/v/v1.2.1/framework-reference/run",
      isLoading: "bool",
      data,
      responseMeta: {
        "!doc": "The response meta of the action",
        "!type": "?",
      },
      run:
        "fn(onSuccess: fn() -> void, onError: fn() -> void) -> +Promise[:t=[!0.<i>.:t]]",
      clear: "fn() -> +Promise[:t=[!0.<i>.:t]]",
    };
  },
  AUDIO_WIDGET: {
    "!doc":
      "Audio widget can be used for playing a variety of audio formats like MP3, AAC etc.",
    "!url": "https://docs.appsmith.com/widget-reference/audio",
    playState: "number",
    autoPlay: "bool",
  },
  CONTAINER_WIDGET: {
    "!doc":
      "Containers are used to group widgets together to form logical higher order widgets. Containers let you organize your page better and move all the widgets inside them together.",
    "!url": "https://docs.appsmith.com/widget-reference/container",
    backgroundColor: {
      "!type": "string",
      "!url": "https://docs.appsmith.com/widget-reference/container",
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
    countryCode: {
      "!type": "string",
      "!doc": "Selected country code for Phone Number type input",
    },
    currencyCountryCode: {
      "!type": "string",
      "!doc": "Selected country code for Currency type input",
    },
  },
  TABLE_WIDGET: (widget: any) => ({
    "!doc":
      "The Table is the hero widget of Appsmith. You can display data from an API in a table, trigger an action when a user selects a row and even work with large paginated data sets",
    "!url": "https://docs.appsmith.com/widget-reference/table",
    selectedRow: generateTypeDef(widget.selectedRow),
    selectedRows: generateTypeDef(widget.selectedRows),
    selectedRowIndices: generateTypeDef(widget.selectedRowIndices),
    triggeredRow: generateTypeDef(widget.triggeredRow),
    selectedRowIndex: "number",
    tableData: generateTypeDef(widget.tableData),
    pageNo: "number",
    pageSize: "number",
    isVisible: isVisible,
    searchText: "string",
    totalRecordsCount: "number",
    sortOrder: {
      column: "string",
      order: ["asc", "desc"],
    },
  }),
  VIDEO_WIDGET: {
    "!doc":
      "Video widget can be used for playing a variety of URLs, including file paths, YouTube, Facebook, Twitch, SoundCloud, Streamable, Vimeo, Wistia, Mixcloud, and DailyMotion.",
    "!url": "https://docs.appsmith.com/widget-reference/video",
    playState: "number",
    autoPlay: "bool",
  },
  DROP_DOWN_WIDGET: {
    "!doc":
      "Select is used to capture user input/s from a specified list of permitted inputs. A Select can capture a single choice",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    isVisible: isVisible,
    filterText: {
      "!type": "[string]",
      "!doc": "The filter text for Server side filtering",
    },
    selectedOptionValue: {
      "!type": "string",
      "!doc": "The value selected in a single select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    selectedOptionLabel: {
      "!type": "string",
      "!doc": "The selected option label in a single select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    selectedOptionValues: {
      "!type": "[string]",
      "!doc": "The array of values selected in a multi select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    selectedOptionLabels: {
      "!type": "[string]",
      "!doc": "The array of selected option labels in a multi select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    isDisabled: "bool",
    options: "[dropdownOption]",
  },
  SELECT_WIDGET: {
    "!doc":
      "Select is used to capture user input/s from a specified list of permitted inputs. A Select can capture a single choice",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    isVisible: isVisible,
    filterText: {
      "!type": "[string]",
      "!doc": "The filter text for Server side filtering",
    },
    selectedOptionValue: {
      "!type": "string",
      "!doc": "The value selected in a single select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    selectedOptionLabel: {
      "!type": "string",
      "!doc": "The selected option label in a single select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    selectedOptionValues: {
      "!type": "[string]",
      "!doc": "The array of values selected in a multi select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    selectedOptionLabels: {
      "!type": "[string]",
      "!doc": "The array of selected option labels in a multi select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    isDisabled: "bool",
    options: "[dropdownOption]",
  },
  MULTI_SELECT_WIDGET: {
    "!doc":
      "MultiSelect is used to capture user input/s from a specified list of permitted inputs. A MultiSelect captures multiple choices from a list of options",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    isVisible: isVisible,
    filterText: {
      "!type": "[string]",
      "!doc": "The filter text for Server side filtering",
    },
    selectedOptionValues: {
      "!type": "[string]",
      "!doc": "The array of values selected in a multi select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    selectedOptionLabels: {
      "!type": "[string]",
      "!doc": "The array of selected option labels in a multi select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    isDisabled: "bool",
    options: "[dropdownOption]",
  },
  MULTI_SELECT_WIDGET_V2: {
    "!doc":
      "MultiSelect is used to capture user input/s from a specified list of permitted inputs. A MultiSelect captures multiple choices from a list of options",
    "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    isVisible: isVisible,
    filterText: {
      "!type": "[string]",
      "!doc": "The filter text for Server side filtering",
    },
    selectedOptionValues: {
      "!type": "[string]",
      "!doc": "The array of values selected in a multi select dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
    },
    selectedOptionLabels: {
      "!type": "[string]",
      "!doc": "The array of selected option labels in a multi select dropdown",
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
    recaptchaToken: "string",
  },
  DATE_PICKER_WIDGET: {
    "!doc":
      "Datepicker is used to capture the date and time from a user. It can be used to filter data base on the input date range as well as to capture personal information such as date of birth",
    "!url": "https://docs.appsmith.com/widget-reference/datepicker",
    isVisible: isVisible,
    selectedDate: "string",
    isDisabled: "bool",
  },
  DATE_PICKER_WIDGET2: {
    "!doc":
      "Datepicker is used to capture the date and time from a user. It can be used to filter data base on the input date range as well as to capture personal information such as date of birth",
    "!url": "https://docs.appsmith.com/widget-reference/datepicker",
    isVisible: isVisible,
    selectedDate: "string",
    formattedDate: "string",
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
  SWITCH_WIDGET: {
    "!doc":
      "Switch is a simple UI widget you can use when you want users to make a binary choice",
    "!url": "https://docs.appsmith.com/widget-reference/switch",
    isVisible: isVisible,
    isSwitchedOn: "bool",
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
    selectedDataPoint: "chartDataPoint",
  },
  FORM_WIDGET: (widget: any) => ({
    "!doc":
      "Form is used to capture a set of data inputs from a user. Forms are used specifically because they reset the data inputs when a form is submitted and disable submission for invalid data inputs",
    "!url": "https://docs.appsmith.com/widget-reference/form",
    isVisible: isVisible,
    data: generateTypeDef(widget.data),
  }),
  FORM_BUTTON_WIDGET: {
    "!doc":
      "Form button is provided by default to every form. It is used for form submission and resetting form inputs",
    "!url": "https://docs.appsmith.com/widget-reference/form",
    isVisible: isVisible,
    text: "string",
    isDisabled: "bool",
    recaptchaToken: "string",
  },
  MAP_WIDGET: {
    isVisible: isVisible,
    center: "latLong",
    markers: "[mapMarker]",
    selectedMarker: "mapMarker",
  },
  FILE_PICKER_WIDGET: {
    "!doc":
      "Filepicker widget is used to allow users to upload files from their local machines to any cloud storage via API. Cloudinary and Amazon S3 have simple APIs for cloud storage uploads",
    "!url": "https://docs.appsmith.com/widget-reference/filepicker",
    isVisible: isVisible,
    files: "[file]",
    isDisabled: "bool",
  },
  FILE_PICKER_WIDGET_V2: {
    "!doc":
      "Filepicker widget is used to allow users to upload files from their local machines to any cloud storage via API. Cloudinary and Amazon S3 have simple APIs for cloud storage uploads",
    "!url": "https://docs.appsmith.com/widget-reference/filepicker",
    isVisible: isVisible,
    files: "[file]",
    isDisabled: "bool",
  },
  LIST_WIDGET: (widget: any) => ({
    "!doc":
      "Containers are used to group widgets together to form logical higher order widgets. Containers let you organize your page better and move all the widgets inside them together.",
    "!url": "https://docs.appsmith.com/widget-reference/list",
    backgroundColor: {
      "!type": "string",
      "!url": "https://docs.appsmith.com/widget-reference/how-to-use-widgets",
    },
    isVisible: isVisible,
    gridGap: "number",
    selectedItem: generateTypeDef(widget.selectedItem),
    items: generateTypeDef(widget.items),
    listData: generateTypeDef(widget.listData),
    pageNo: generateTypeDef(widget.pageNo),
    pageSize: generateTypeDef(widget.pageSize),
  }),
  RATE_WIDGET: {
    "!doc": "Rating widget is used to display ratings in your app.",
    "!url": "https://docs.appsmith.com/widget-reference/rate",
    isVisible: isVisible,
    value: "number",
    maxCount: "number",
  },
  IFRAME_WIDGET: (widget: any) => ({
    "!doc": "Iframe widget is used to display iframes in your app.",
    "!url": "https://docs.appsmith.com/widget-reference/iframe",
    isVisible: isVisible,
    source: "string",
    title: "string",
    message: generateTypeDef(widget.message),
  }),
  DIVIDER_WIDGET: {
    "!doc": "Divider is a simple UI widget used as a separator",
    "!url": "https://docs.appsmith.com/widget-reference/divider",
    isVisible: isVisible,
    orientation: "string",
    capType: "string",
    capSide: "number",
    strokeStyle: "string",
    dividerColor: "string",
    thickness: "number",
  },
  MENU_BUTTON_WIDGET: {
    "!doc":
      "Menu button widget is used to represent a set of actions in a group.",
    "!url": "https://docs.appsmith.com/widget-reference/menu-button",
    isVisible: isVisible,
    label: "string",
  },
  //TODO: fix this after development
  SINGLE_SELECT_TREE_WIDGET: {
    "!doc":
      "TreeSelect is used to capture user input from a specified list of permitted inputs/Nested Inputs.",
    "!url": "https://docs.appsmith.com/widget-reference/treeselect",
    isVisible: isVisible,
    selectedOptionValue: {
      "!type": "string",
      "!doc": "The value selected in a treeselect dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/treeselect",
    },
    selectedOptionLabel: {
      "!type": "string",
      "!doc": "The selected option label in a treeselect dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/treeselect",
    },
    isDisabled: "bool",
    isValid: "bool",
    options: "[dropdownOption]",
  },
  MULTI_SELECT_TREE_WIDGET: {
    "!doc":
      "Multi TreeSelect is used to capture user inputs from a specified list of permitted inputs/Nested Inputs. A TreeSelect can capture a single choice as well as multiple choices",
    "!url": "https://docs.appsmith.com/widget-reference/treeselect",
    isVisible: isVisible,
    selectedOptionValues: {
      "!type": "[string]",
      "!doc": "The array of values selected in a treeselect dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/treeselect",
    },
    selectedOptionLabels: {
      "!type": "[string]",
      "!doc": "The array of selected option labels in a treeselect dropdown",
      "!url": "https://docs.appsmith.com/widget-reference/treeselect",
    },
    isDisabled: "bool",
    isValid: "bool",
    options: "[dropdownOption]",
  },
  ICON_BUTTON_WIDGET: {
    "!doc":
      "Icon button widget is just an icon, along with all other button properties.",
    "!url": "https://docs.appsmith.com/widget-reference/icon-button",
    isVisible: isVisible,
  },
  CHECKBOX_GROUP_WIDGET: {
    "!doc":
      "Checkbox group widget allows users to easily configure multiple checkboxes together.",
    "!url": "https://docs.appsmith.com/widget-reference/checkbox-group",
    isVisible: isVisible,
    isDisabled: "bool",
    isValid: "bool",
    options: "[dropdownOption]",
    selectedValues: "[string]",
  },
  STATBOX_WIDGET: {
    "!doc": "Show and highlight stats from your data sources",
    "!url": "https://docs.appsmith.com/widget-reference/stat-box",
    isVisible: isVisible,
  },
  AUDIO_RECORDER_WIDGET: {
    "!doc":
      "Audio recorder widget allows users to record using their microphone, listen to the playback, and export the data to a data source.",
    "!url": "https://docs.appsmith.com/widget-reference/recorder",
    isVisible: isVisible,
    blobUrl: "string",
    dataURL: "string",
    rawBinary: "string",
  },
  PROGRESSBAR_WIDGET: {
    "!doc": "Progress bar is a simple UI widget used to show progress",
    "!url": "https://docs.appsmith.com/widget-reference/progressbar",
    isVisible: isVisible,
    progress: "number",
  },
  SWITCH_GROUP_WIDGET: {
    "!doc":
      "Switch group widget allows users to create many switch components which can easily by used in a form",
    "!url": "https://docs.appsmith.com/widget-reference/switch-group",
    selectedValues: "[string]",
  },
  CAMERA_WIDGET: {
    "!doc":
      "Camera widget allows users to take a picture or record videos through their system camera using browser permissions.",
    "!url": "https://docs.appsmith.com/widget-reference/camera",
    imageBlobURL: "string",
    imageDataURL: "string",
    imageRawBinary: "string",
    videoBlobURL: "string",
    videoDataURL: "string",
    videoRawBinary: "string",
  },
  MAP_CHART_WIDGET: {
    "!doc":
      "Map Chart widget shows the graphical representation of your data on the map.",
    "!url": "https://docs.appsmith.com/widget-reference/map-chart",
    isVisible: isVisible,
    selectedDataPoint: "mapChartDataPoint",
  },
  INPUT_WIDGET_V2: {
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
  CURRENCY_INPUT_WIDGET: {
    "!doc":
      "An input text field is used to capture a currency value. Inputs are used in forms and can have custom validations.",
    "!url": "https://docs.appsmith.com/widget-reference/input",
    text: {
      "!type": "string",
      "!doc": "The formatted text value of the input",
      "!url": "https://docs.appsmith.com/widget-reference/input",
    },
    value: {
      "!type": "number",
      "!doc": "The value of the input",
      "!url": "https://docs.appsmith.com/widget-reference/input",
    },
    isValid: "bool",
    isVisible: isVisible,
    isDisabled: "bool",
    countryCode: {
      "!type": "string",
      "!doc": "Selected country code for Currency",
    },
    currencyCode: {
      "!type": "string",
      "!doc": "Selected Currency code",
    },
  },
  PHONE_INPUT_WIDGET: {
    "!doc":
      "An input text field is used to capture a phone number. Inputs are used in forms and can have custom validations.",
    "!url": "https://docs.appsmith.com/widget-reference/input",
    text: {
      "!type": "string",
      "!doc": "The text value of the input",
      "!url": "https://docs.appsmith.com/widget-reference/input",
    },
    isValid: "bool",
    isVisible: isVisible,
    isDisabled: "bool",
    countryCode: {
      "!type": "string",
      "!doc": "Selected country code for Phone Number",
    },
    dialCode: {
      "!type": "string",
      "!doc": "Selected dialing code for Phone Number",
    },
  },
  CIRCULAR_PROGRESS_WIDGET: {
    "!doc": "Circular Progress is a simple UI widget used to show progress",
    "!url": "https://docs.appsmith.com/widget-reference/circular-progress",
    isVisible: isVisible,
    progress: "number",
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
  file: {
    data: "string",
    name: "text",
    type: "file",
  },
  mapChartDataPoint: {
    id: "string",
    label: "string",
    originalId: "string",
    shortLabel: "string",
    value: "number",
  },
};

export const GLOBAL_FUNCTIONS = {
  "!name": "DATA_TREE.APPSMITH.FUNCTIONS",
  navigateTo: {
    "!doc": "Action to navigate the user to another page or url",
    "!type":
      "fn(pageNameOrUrl: string, params: {}, target?: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  showAlert: {
    "!doc": "Show a temporary notification style message to the user",
    "!type": "fn(message: string, style: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  showModal: {
    "!doc": "Open a modal",
    "!type": "fn(modalName: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  closeModal: {
    "!doc": "Close a modal",
    "!type": "fn(modalName: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  storeValue: {
    "!doc": "Store key value data locally",
    "!type": "fn(key: string, value: any) -> +Promise[:t=[!0.<i>.:t]]",
  },
  download: {
    "!doc": "Download anything as a file",
    "!type":
      "fn(data: any, fileName: string, fileType?: string) -> +Promise[:t=[!0.<i>.:t]]",
  },
  copyToClipboard: {
    "!doc": "Copy text to clipboard",
    "!type": "fn(data: string, options: object) -> +Promise[:t=[!0.<i>.:t]]",
  },
  resetWidget: {
    "!doc": "Reset widget values",
    "!type":
      "fn(widgetName: string, resetChildren: boolean) -> +Promise[:t=[!0.<i>.:t]]",
  },
  setInterval: {
    "!doc": "Execute triggers at a given interval",
    "!type": "fn(callback: fn, interval: number, id?: string) -> void",
  },
  clearInterval: {
    "!doc": "Stop executing a setInterval with id",
    "!type": "fn(id: string) -> void",
  },
};

export const getPropsForJSActionEntity = (
  entity: JSCollection,
): Record<string, string> => {
  const properties: Record<string, string> = {};
  const actions = entity.actions;
  if (actions && actions.length > 0)
    for (let i = 0; i < entity.actions.length; i++) {
      const action = entity.actions[i];
      properties[action.name + "()"] = "Function";
    }
  const variablesProps = entity.variables;
  if (variablesProps && variablesProps.length > 0) {
    for (let i = 0; i < variablesProps.length; i++) {
      const variableProp = variablesProps[i];
      properties[variableProp.name] = variableProp.value;
    }
  }
  return properties;
};
