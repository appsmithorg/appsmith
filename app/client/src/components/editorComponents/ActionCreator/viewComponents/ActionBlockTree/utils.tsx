import React from "react";
import { Icon } from "design-system-old";
import { AppsmithFunction, FieldType } from "../../constants";
import { ActionTree } from "../../types";
import { FIELD_GROUP_CONFIG } from "../../FieldGroup/FieldGroupConfig";
import { getFunctionName, getFunctionArguments } from "@shared/ast";
import { FIELD_CONFIG } from "../../Field/FieldConfig";
import { getCodeFromMoustache } from "../../utils";
import { ApiMethodIcon } from "pages/Editor/Explorer/ExplorerIcons";
import { getActionsForCurrentPage } from "selectors/entitiesSelector";
import { useSelector } from "react-redux";
import { HTTP_METHOD } from "constants/ApiEditorConstants/CommonApiConstants";

function getIconForAction(
  actionType: ActionTree["actionType"],
  code: string,
): React.FunctionComponent {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const actions = useSelector(getActionsForCurrentPage);

  switch (actionType) {
    case AppsmithFunction.none:
      return () => <Icon name="no-action" />;

    case AppsmithFunction.navigateTo:
      return () => <Icon name="navigate-to" />;

    case AppsmithFunction.showAlert:
      return () => <Icon name="show-alert" />;

    case AppsmithFunction.storeValue:
      return () => <Icon name="store-value" />;

    case AppsmithFunction.copyToClipboard:
      return () => <Icon name="copy-to-clipboard" />;

    case AppsmithFunction.download:
      return () => <Icon name="download-action" />;

    case AppsmithFunction.jsFunction:
      return () => <Icon name="execute-js" />;

    case AppsmithFunction.closeModal:
    case AppsmithFunction.showModal:
      return () => <Icon name="modal" />;

    case AppsmithFunction.resetWidget:
      return () => <Icon name="reset-widget" />;

    case AppsmithFunction.clearStore:
      return () => <Icon name="clear-store" />;

    case AppsmithFunction.removeValue:
      return () => <Icon name="remove-store" />;

    case AppsmithFunction.setInterval:
      return () => <Icon name="set-interval" />;

    case AppsmithFunction.clearInterval:
      return () => <Icon name="clear-interval" />;

    case AppsmithFunction.getGeolocation:
      return () => <Icon name="get-geolocation" />;

    case AppsmithFunction.watchGeolocation:
      return () => <Icon name="watch-geolocation" />;

    case AppsmithFunction.stopWatchGeolocation:
      return () => <Icon name="stop-watch-geolocation" />;

    case AppsmithFunction.integration:
      const functionName = getFunctionName(
        getCodeFromMoustache(code),
        self.evaluationVersion,
      );
      const apiName = functionName.split(".")[0];
      const apiAction = actions.find(({ config }) => config.name === apiName);

      if (apiAction) {
        const method: keyof typeof HTTP_METHOD =
          apiAction.config.actionConfiguration.httpMethod;

        if (method) {
          return () => (
            <ApiMethodIcon height="12px" type={method} width="28px" />
          );
        }
      }

      return () => <Icon name="execute-query" />;

    case AppsmithFunction.postWindowMessage:
      return () => <Icon name="post-message" />;
  }

  return React.Fragment;
}

function getActionHeading(code: string, actionType: ActionTree["actionType"]) {
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
      const fileName = FIELD_CONFIG[FieldType.DOWNLOAD_FILE_NAME_FIELD].getter(
        code,
      );
      return fileName ? fileName : "Add data to download";

    case AppsmithFunction.jsFunction:
      return (
        getFunctionName(getCodeFromMoustache(code), self.evaluationVersion) +
        `(${getFunctionArguments(code, self.evaluationVersion)})`
      );

    case AppsmithFunction.integration:
      return getFunctionName(
        getCodeFromMoustache(code),
        self.evaluationVersion,
      );

    case AppsmithFunction.showModal:
      return (
        FIELD_CONFIG[FieldType.SHOW_MODAL_FIELD].getter(code) || "Select modal"
      );

    case AppsmithFunction.closeModal:
      return (
        FIELD_CONFIG[FieldType.CLOSE_MODAL_FIELD].getter(code) || "Select modal"
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
        "Add ID"
      );

    case AppsmithFunction.setInterval:
      return (
        getCodeFromMoustache(FIELD_CONFIG[FieldType.DELAY_FIELD].getter(code)) +
          "ms" || "Add interval"
      );

    case AppsmithFunction.clearInterval:
      return FIELD_CONFIG[FieldType.ID_FIELD].getter(code) || "Add ID";

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
) {
  const Icon = getIconForAction(actionType, code);

  if (!actionType) {
    actionType = AppsmithFunction.none;
  }

  const actionTypeLabel = FIELD_GROUP_CONFIG[actionType].label;

  const action = getActionHeading(`{{${code}}}`, actionType);

  return { Icon, actionTypeLabel, action };
}
