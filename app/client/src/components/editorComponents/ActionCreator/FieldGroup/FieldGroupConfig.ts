import { AppsmithFunction, FieldType } from "../constants";
import {
  CLEAR_INTERVAL,
  CLOSE_MODAL,
  COPY_TO_CLIPBOARD,
  createMessage,
  DOWNLOAD,
  EXECUTE_A_QUERY,
  GET_GEO_LOCATION,
  NAVIGATE_TO,
  NO_ACTION,
  OPEN_MODAL,
  RESET_WIDGET,
  SET_INTERVAL,
  SHOW_MESSAGE,
  STOP_WATCH_GEO_LOCATION,
  STORE_VALUE,
  WATCH_GEO_LOCATION,
} from "../../../../ce/constants/messages";

export const FIELD_GROUP_CONFIG = {
  [AppsmithFunction.none]: {
    label: createMessage(NO_ACTION),
    fields: [],
  },
  [AppsmithFunction.integration]: {
    label: createMessage(EXECUTE_A_QUERY),
    fields: [],
  },
  [AppsmithFunction.navigateTo]: {
    label: createMessage(NAVIGATE_TO),
    fields: [],
  },
  [AppsmithFunction.showAlert]: {
    label: createMessage(SHOW_MESSAGE),
    fields: [FieldType.ALERT_TEXT_FIELD, FieldType.ALERT_TYPE_SELECTOR_FIELD],
  },
  [AppsmithFunction.showModal]: {
    label: createMessage(OPEN_MODAL),
    fields: [FieldType.SHOW_MODAL_FIELD],
  },
  [AppsmithFunction.closeModal]: {
    label: createMessage(CLOSE_MODAL),
    fields: [FieldType.CLOSE_MODAL_FIELD],
  },
  [AppsmithFunction.storeValue]: {
    label: createMessage(STORE_VALUE),
    fields: [FieldType.KEY_TEXT_FIELD, FieldType.VALUE_TEXT_FIELD],
  },
  [AppsmithFunction.download]: {
    label: createMessage(DOWNLOAD),
    fields: [
      FieldType.DOWNLOAD_DATA_FIELD,
      FieldType.DOWNLOAD_FILE_NAME_FIELD,
      FieldType.DOWNLOAD_FILE_TYPE_FIELD,
    ],
  },
  [AppsmithFunction.copyToClipboard]: {
    label: createMessage(COPY_TO_CLIPBOARD),
    fields: [FieldType.COPY_TEXT_FIELD],
  },
  [AppsmithFunction.resetWidget]: {
    label: createMessage(RESET_WIDGET),
    fields: [FieldType.WIDGET_NAME_FIELD, FieldType.RESET_CHILDREN_FIELD],
  },
  [AppsmithFunction.setInterval]: {
    label: createMessage(SET_INTERVAL),
    fields: [
      FieldType.CALLBACK_FUNCTION_FIELD,
      FieldType.DELAY_FIELD,
      FieldType.ID_FIELD,
    ],
  },
  [AppsmithFunction.clearInterval]: {
    label: createMessage(CLEAR_INTERVAL),
    fields: [FieldType.CLEAR_INTERVAL_ID_FIELD],
  },
  [AppsmithFunction.getGeolocation]: {
    label: createMessage(GET_GEO_LOCATION),
    fields: [FieldType.CALLBACK_FUNCTION_FIELD],
  },
  [AppsmithFunction.watchGeolocation]: {
    label: createMessage(WATCH_GEO_LOCATION),
    fields: [],
  },
  [AppsmithFunction.stopWatchGeolocation]: {
    label: createMessage(STOP_WATCH_GEO_LOCATION),
    fields: [],
  },
};
