import { AppsmithFunction, FieldType } from "../constants";
import {
  CLEAR_INTERVAL,
  CLEAR_STORE,
  CLOSE_MODAL,
  COPY_TO_CLIPBOARD,
  createMessage,
  DOWNLOAD,
  EXECUTE_A_QUERY,
  EXECUTE_JS_FUNCTION,
  GET_GEO_LOCATION,
  NAVIGATE_TO,
  NO_ACTION,
  SHOW_MODAL,
  POST_MESSAGE,
  REMOVE_VALUE,
  RESET_WIDGET,
  SET_INTERVAL,
  SHOW_ALERT,
  STOP_WATCH_GEO_LOCATION,
  STORE_VALUE,
  WATCH_GEO_LOCATION,
} from "ee/constants/messages";
import type { FieldGroupConfig } from "../types";

export const FIELD_GROUP_CONFIG: FieldGroupConfig = {
  [AppsmithFunction.none]: {
    label: createMessage(NO_ACTION),
    fields: [],
    defaultParams: "",
    icon: "no-action",
  },
  [AppsmithFunction.integration]: {
    label: createMessage(EXECUTE_A_QUERY),
    fields: [FieldType.PARAMS_FIELD],
    children: [{ label: "", value: "" }],
    defaultParams: "",
    icon: "query-main",
  },
  [AppsmithFunction.jsFunction]: {
    label: createMessage(EXECUTE_JS_FUNCTION),
    value: AppsmithFunction.jsFunction,
    fields: [],
    children: [{ label: "", value: "" }],
    defaultParams: "",
    icon: "js",
  },
  [AppsmithFunction.navigateTo]: {
    label: createMessage(NAVIGATE_TO),
    fields: [
      FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD,
      /**
       * The second field is dependent on activeTabNavigateTo value
       * if PAGE_NAME then this field will be PAGE_SELECTOR_FIELD (default)
       * if URL then this field will be URL_FIELD
       **/
      FieldType.PAGE_SELECTOR_FIELD,
      FieldType.QUERY_PARAMS_FIELD,
      FieldType.NAVIGATION_TARGET_FIELD,
    ],
    defaultParams: `"", {}, 'SAME_WINDOW'`,
    icon: "page-line",
  },
  [AppsmithFunction.showAlert]: {
    label: createMessage(SHOW_ALERT),
    fields: [FieldType.ALERT_TEXT_FIELD, FieldType.ALERT_TYPE_SELECTOR_FIELD],
    defaultParams: `"", ''`,
    icon: "message-2-line",
  },
  [AppsmithFunction.showModal]: {
    label: createMessage(SHOW_MODAL),
    fields: [FieldType.SHOW_MODAL_FIELD],
    defaultParams: ``,
    icon: "show-modal",
  },
  [AppsmithFunction.closeModal]: {
    label: createMessage(CLOSE_MODAL),
    fields: [FieldType.CLOSE_MODAL_FIELD],
    defaultParams: `''`,
    icon: "show-modal",
  },
  [AppsmithFunction.storeValue]: {
    label: createMessage(STORE_VALUE),
    fields: [FieldType.KEY_TEXT_FIELD_STORE_VALUE, FieldType.VALUE_TEXT_FIELD],
    defaultParams: `"", ""`,
    icon: "folder-download-line",
  },
  [AppsmithFunction.removeValue]: {
    label: createMessage(REMOVE_VALUE),
    fields: [FieldType.KEY_TEXT_FIELD_REMOVE_VALUE],
    defaultParams: `""`,
    icon: "folder-line",
  },
  [AppsmithFunction.clearStore]: {
    label: createMessage(CLEAR_STORE),
    fields: [],
    defaultParams: "",
    icon: "folder-reduce-line",
  },
  [AppsmithFunction.download]: {
    label: createMessage(DOWNLOAD),
    fields: [
      FieldType.DOWNLOAD_DATA_FIELD,
      FieldType.DOWNLOAD_FILE_NAME_FIELD,
      FieldType.DOWNLOAD_FILE_TYPE_FIELD,
    ],
    defaultParams: `"", "", ''`,
    icon: "download-line",
  },
  [AppsmithFunction.copyToClipboard]: {
    label: createMessage(COPY_TO_CLIPBOARD),
    fields: [FieldType.COPY_TEXT_FIELD],
    defaultParams: `""`,
    icon: "copy-control",
  },
  [AppsmithFunction.resetWidget]: {
    label: createMessage(RESET_WIDGET),
    fields: [FieldType.WIDGET_NAME_FIELD, FieldType.RESET_CHILDREN_FIELD],
    defaultParams: `"",true`,
    icon: "restart-line",
  },
  [AppsmithFunction.setInterval]: {
    label: createMessage(SET_INTERVAL),
    fields: [
      FieldType.CALLBACK_FUNCTION_FIELD_SET_INTERVAL,
      FieldType.DELAY_FIELD,
      FieldType.ID_FIELD,
    ],
    defaultParams: `() => {
      // add code here
    }, 5000, ''`,
    icon: "timer-flash-line",
  },
  [AppsmithFunction.clearInterval]: {
    label: createMessage(CLEAR_INTERVAL),
    fields: [FieldType.CLEAR_INTERVAL_ID_FIELD],
    defaultParams: `""`,
    icon: "timer-line",
  },
  [AppsmithFunction.getGeolocation]: {
    label: createMessage(GET_GEO_LOCATION),
    fields: [FieldType.CALLBACK_FUNCTION_FIELD_GEOLOCATION],
    defaultParams: `(location) => {
      // add code here
    }`,
    icon: "map-2-line",
  },
  [AppsmithFunction.watchGeolocation]: {
    label: createMessage(WATCH_GEO_LOCATION),
    fields: [],
    defaultParams: "",
    icon: "map-pin-user-line",
  },
  [AppsmithFunction.stopWatchGeolocation]: {
    label: createMessage(STOP_WATCH_GEO_LOCATION),
    fields: [],
    defaultParams: "",
    icon: "map-pin-5-line",
  },
  [AppsmithFunction.postWindowMessage]: {
    label: createMessage(POST_MESSAGE),
    fields: [
      FieldType.MESSAGE_FIELD,
      FieldType.SOURCE_FIELD,
      FieldType.TARGET_ORIGIN_FIELD,
    ],
    defaultParams: `"", "window", "*"`,
    icon: "chat-upload-line",
  },
};
