import { FIELD_GROUP_CONFIG } from "./FieldGroupConfig";
import { AppsmithFunction, FieldType } from "../constants";

describe("Test Field Group Config", () => {
  const cases = [
    {
      index: 0,
      input: AppsmithFunction.none,
      expectedLabel: "No action",
      expectedFields: [],
    },
    {
      index: 1,
      input: AppsmithFunction.integration,
      expectedLabel: "Execute a query",
      expectedFields: [FieldType.PARAMS_FIELD],
    },
    {
      index: 2,
      input: AppsmithFunction.jsFunction,
      expectedLabel: "Execute a JS function",
      expectedFields: [],
    },
    {
      index: 3,
      input: AppsmithFunction.navigateTo,
      expectedLabel: "Navigate to",
      expectedFields: [
        FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD,
        FieldType.PAGE_SELECTOR_FIELD,
        FieldType.QUERY_PARAMS_FIELD,
        FieldType.NAVIGATION_TARGET_FIELD,
      ],
    },
    {
      index: 4,
      input: AppsmithFunction.showAlert,
      expectedLabel: "Show alert",
      expectedFields: [
        FieldType.ALERT_TEXT_FIELD,
        FieldType.ALERT_TYPE_SELECTOR_FIELD,
      ],
    },
    {
      index: 5,
      input: AppsmithFunction.showModal,
      expectedLabel: "Show modal",
      expectedFields: [FieldType.SHOW_MODAL_FIELD],
    },
    {
      index: 6,
      input: AppsmithFunction.closeModal,
      expectedLabel: "Close modal",
      expectedFields: [FieldType.CLOSE_MODAL_FIELD],
    },
    {
      index: 7,
      input: AppsmithFunction.storeValue,
      expectedLabel: "Store value",
      expectedFields: [
        FieldType.KEY_TEXT_FIELD_STORE_VALUE,
        FieldType.VALUE_TEXT_FIELD,
      ],
    },
    {
      index: 8,
      input: AppsmithFunction.download,
      expectedLabel: "Download",
      expectedFields: [
        FieldType.DOWNLOAD_DATA_FIELD,
        FieldType.DOWNLOAD_FILE_NAME_FIELD,
        FieldType.DOWNLOAD_FILE_TYPE_FIELD,
      ],
    },
    {
      index: 9,
      input: AppsmithFunction.copyToClipboard,
      expectedLabel: "Copy to clipboard",
      expectedFields: [FieldType.COPY_TEXT_FIELD],
    },
    {
      index: 10,
      input: AppsmithFunction.resetWidget,
      expectedLabel: "Reset widget",
      expectedFields: [
        FieldType.WIDGET_NAME_FIELD,
        FieldType.RESET_CHILDREN_FIELD,
      ],
    },
    {
      index: 11,
      input: AppsmithFunction.setInterval,
      expectedLabel: "Set interval",
      expectedFields: [
        FieldType.CALLBACK_FUNCTION_FIELD_SET_INTERVAL,
        FieldType.DELAY_FIELD,
        FieldType.ID_FIELD,
      ],
    },
    {
      index: 12,
      input: AppsmithFunction.clearInterval,
      expectedLabel: "Clear interval",
      expectedFields: [FieldType.CLEAR_INTERVAL_ID_FIELD],
    },
    {
      index: 13,
      input: AppsmithFunction.getGeolocation,
      expectedLabel: "Get geolocation",
      expectedFields: [FieldType.CALLBACK_FUNCTION_FIELD_GEOLOCATION],
    },
    {
      index: 14,
      input: AppsmithFunction.watchGeolocation,
      expectedLabel: "Watch geolocation",
      expectedFields: [],
    },
    {
      index: 15,
      input: AppsmithFunction.stopWatchGeolocation,
      expectedLabel: "Stop watching geolocation",
      expectedFields: [],
    },
    {
      index: 15,
      input: AppsmithFunction.postWindowMessage,
      expectedLabel: "Post message",
      expectedFields: [
        FieldType.MESSAGE_FIELD,
        FieldType.SOURCE_FIELD,
        FieldType.TARGET_ORIGIN_FIELD,
      ],
    },
    {
      index: 15,
      input: AppsmithFunction.logoutUser,
      expectedLabel: "Logout user",
      expectedFields: [FieldType.URL_FIELD],
    },
  ];

  test.each(
    cases.map((x) => [x.index, x.input, x.expectedLabel, x.expectedFields]),
  )("test case %d", (index, input, expectedLabel, expectedFields) => {
    const result = FIELD_GROUP_CONFIG[input as string];

    expect(result.label).toStrictEqual(expectedLabel as string);
    expect(result.fields).toStrictEqual(expectedFields as string[]);
  });
});
