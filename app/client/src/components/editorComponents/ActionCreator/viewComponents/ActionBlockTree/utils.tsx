import React from "react";
import { Icon } from "@appsmith/ads";
import { AppsmithFunction, FieldType } from "../../constants";
import type { ActionTree } from "../../types";
import { FIELD_GROUP_CONFIG } from "../../FieldGroup/FieldGroupConfig";
import { getFunctionName, getFunctionArguments } from "@shared/ast";
import { FIELD_CONFIG } from "../../Field/FieldConfig";
import { getCodeFromMoustache, getEvaluationVersion } from "../../utils";
import { ApiMethodIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { getCurrentActions } from "ee/selectors/entitiesSelector";
import { useSelector } from "react-redux";
import type { HTTP_METHOD } from "constants/ApiEditorConstants/CommonApiConstants";

function GetIconForAction(
  actionType: ActionTree["actionType"],
  code: string,
): React.FunctionComponent {
  const actions = useSelector(getCurrentActions);

  switch (actionType) {
    case AppsmithFunction.none:
      return () => <Icon name="no-action" />;

    case AppsmithFunction.navigateTo:
      return () => <Icon name="page-line" />;

    case AppsmithFunction.showAlert:
      return () => <Icon name="message-2-line" />;

    case AppsmithFunction.storeValue:
      return () => <Icon name="folder-download-line" />;

    case AppsmithFunction.copyToClipboard:
      return () => <Icon name="copy-control" />;

    case AppsmithFunction.download:
      return () => <Icon name="download-line" />;

    case AppsmithFunction.jsFunction:
      return () => <Icon name="js" />;

    case AppsmithFunction.closeModal:
    case AppsmithFunction.showModal:
      return () => <Icon name="show-modal" />;

    case AppsmithFunction.resetWidget:
      return () => <Icon name="restart-line" />;

    case AppsmithFunction.clearStore:
      return () => <Icon name="folder-reduce-line" />;

    case AppsmithFunction.removeValue:
      return () => <Icon name="folder-line" />;

    case AppsmithFunction.setInterval:
      return () => <Icon name="timer-flash-line" />;

    case AppsmithFunction.clearInterval:
      return () => <Icon name="timer-line" />;

    case AppsmithFunction.getGeolocation:
      return () => <Icon name="map-2-line" />;

    case AppsmithFunction.watchGeolocation:
      return () => <Icon name="map-pin-user-line" />;

    case AppsmithFunction.stopWatchGeolocation:
      return () => <Icon name="map-pin-5-line" />;

    case AppsmithFunction.integration:
      const functionName = getFunctionName(
        getCodeFromMoustache(code),
        getEvaluationVersion(),
      );
      const apiName = functionName.split(".")[0];
      const apiAction = actions.find(({ config }) => config.name === apiName);

      if (apiAction) {
        const method: keyof typeof HTTP_METHOD =
          apiAction.config.actionConfiguration.httpMethod;

        if (method) {
          return () => ApiMethodIcon(method, "12px", "28px");
        }
      }

      return () => <Icon name="query-main" />;

    case AppsmithFunction.postWindowMessage:
      return () => <Icon name="chat-upload-icon" />;

    default:
      return () => <Icon name="js" />;
  }
}

function getActionHeading(
  code: string,
  actionType: ActionTree["actionType"],
  minimal = false,
) {
  switch (actionType) {
    case AppsmithFunction.none:
      return "Select an action";

    case AppsmithFunction.navigateTo:
      return (
        FIELD_CONFIG[FieldType.PAGE_SELECTOR_FIELD].getter(code).slice(1, -1) ||
        "Select page"
      );

    case AppsmithFunction.showAlert:
      return (
        FIELD_CONFIG[FieldType.ALERT_TEXT_FIELD].getter(code) || "Add message"
      );

    case AppsmithFunction.storeValue:
      return (
        FIELD_CONFIG[FieldType.KEY_TEXT_FIELD_STORE_VALUE].getter(code) ||
        "Add key"
      );

    case AppsmithFunction.copyToClipboard:
      return FIELD_CONFIG[FieldType.COPY_TEXT_FIELD].getter(code) || "Add text";

    case AppsmithFunction.download:
      const fileName =
        FIELD_CONFIG[FieldType.DOWNLOAD_FILE_NAME_FIELD].getter(code);

      return fileName ? fileName : "Add data to download";

    case AppsmithFunction.jsFunction:
      if (minimal) {
        return getFunctionName(
          getCodeFromMoustache(code),
          getEvaluationVersion(),
        );
      } else {
        return (
          getFunctionName(getCodeFromMoustache(code), getEvaluationVersion()) +
          `(${getFunctionArguments(code, getEvaluationVersion())})`
        );
      }

    case AppsmithFunction.integration:
      return getFunctionName(
        getCodeFromMoustache(code),
        getEvaluationVersion(),
      );

    case AppsmithFunction.showModal:
      return (
        FIELD_CONFIG[FieldType.SHOW_MODAL_FIELD].getter(code).split(".")[0] ||
        "Select modal"
      );

    case AppsmithFunction.closeModal:
      return (
        FIELD_CONFIG[FieldType.CLOSE_MODAL_FIELD].getter(code).split(".")[0] ||
        "Select modal"
      );

    case AppsmithFunction.resetWidget:
      return (
        FIELD_CONFIG[FieldType.WIDGET_NAME_FIELD].getter(code).slice(1, -1) ||
        "Select widget"
      );

    case AppsmithFunction.clearStore:
      return "";

    case AppsmithFunction.removeValue:
      return (
        FIELD_CONFIG[FieldType.KEY_TEXT_FIELD_REMOVE_VALUE].getter(code) ||
        "Add key"
      );

    case AppsmithFunction.setInterval:
      return (
        getCodeFromMoustache(FIELD_CONFIG[FieldType.DELAY_FIELD].getter(code)) +
          "ms" || "Add interval"
      );

    case AppsmithFunction.clearInterval:
      return (
        FIELD_CONFIG[FieldType.CLEAR_INTERVAL_ID_FIELD].getter(code) || "Add Id"
      );

    case AppsmithFunction.getGeolocation:
      return (
        getCodeFromMoustache(
          FIELD_CONFIG[FieldType.CALLBACK_FUNCTION_FIELD_GEOLOCATION].getter(
            code,
          ),
        ) || "Add callback"
      );

    case AppsmithFunction.watchGeolocation:
      return "";

    case AppsmithFunction.stopWatchGeolocation:
      return "";

    case AppsmithFunction.postWindowMessage:
      return (
        FIELD_CONFIG[FieldType.MESSAGE_FIELD].getter(code) || "Add message"
      );
  }

  return "";
}

export function getActionInfo(
  code: string,
  actionType: ActionTree["actionType"],
  minimal = false,
) {
  const Icon = GetIconForAction(actionType, code);

  if (!actionType) {
    actionType = AppsmithFunction.none;
  }

  const actionTypeLabel = FIELD_GROUP_CONFIG[actionType].label;

  const action = getActionHeading(`{{${code}}}`, actionType, minimal);

  return { Icon, actionTypeLabel, action };
}

export function getActionTypeLabel(
  actionType: ActionTree["actionType"],
): string {
  return FIELD_GROUP_CONFIG[actionType].label;
}
