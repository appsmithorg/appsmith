import React from "react";
import { ReactComponent as ClearInterval } from "assets/icons/action/clearInterval.svg";
import { ReactComponent as ClearStore } from "assets/icons/action/clearStore.svg";
import { ReactComponent as CopyToClipboard } from "assets/icons/action/copyToClipboard.svg";
import { ReactComponent as Download } from "assets/icons/action/download.svg";
import { ReactComponent as ExecuteJs } from "assets/icons/action/executeJs.svg";
import { ReactComponent as ExecuteQuery } from "assets/icons/action/executeQuery.svg";
import { ReactComponent as GetGeolocation } from "assets/icons/action/getGeolocation.svg";
import { ReactComponent as Modal } from "assets/icons/action/modal.svg";
import { ReactComponent as NavigateTo } from "assets/icons/action/navigateTo.svg";
import { ReactComponent as RemoveStore } from "assets/icons/action/removeStore.svg";
import { ReactComponent as ResetWidget } from "assets/icons/action/resetWidget.svg";
import { ReactComponent as SetInterval } from "assets/icons/action/setInterval.svg";
import { ReactComponent as ShowAlert } from "assets/icons/action/showAlert.svg";
import { ReactComponent as StopWatchGeolocation } from "assets/icons/action/stopWatchGeolocation.svg";
import { ReactComponent as StoreValue } from "assets/icons/action/storeValue.svg";
import { ReactComponent as WatchGeolocation } from "assets/icons/action/watchGeolocation.svg";
import { AppsmithFunction, FieldType } from "../../constants";
import { ActionTree } from "../../types";
import { FIELD_GROUP_CONFIG } from "../../FieldGroup/FieldGroupConfig";
import { getFunctionName } from "@shared/ast";
import { FIELD_CONFIG } from "../../Field/FieldConfig";
import { JSToString, stringToJS } from "../../utils";

function getIconForAction(
  actionType: ActionTree["actionType"],
): React.FunctionComponent {
  switch (actionType) {
    case AppsmithFunction.none:
      return React.Fragment;

    case AppsmithFunction.navigateTo:
      return NavigateTo;

    case AppsmithFunction.showAlert:
      return ShowAlert;

    case AppsmithFunction.storeValue:
      return StoreValue;

    case AppsmithFunction.copyToClipboard:
      return CopyToClipboard;

    case AppsmithFunction.download:
      return Download;

    case AppsmithFunction.jsFunction:
      return ExecuteJs;

    case AppsmithFunction.integration:
      return ExecuteQuery;

    case AppsmithFunction.closeModal:
    case AppsmithFunction.showModal:
      return Modal;

    case AppsmithFunction.resetWidget:
      return ResetWidget;

    case AppsmithFunction.clearStore:
      return ClearStore;

    case AppsmithFunction.removeValue:
      return RemoveStore;

    case AppsmithFunction.setInterval:
      return SetInterval;

    case AppsmithFunction.clearInterval:
      return ClearInterval;

    case AppsmithFunction.getGeolocation:
      return GetGeolocation;

    case AppsmithFunction.watchGeolocation:
      return WatchGeolocation;

    case AppsmithFunction.stopWatchGeolocation:
      return StopWatchGeolocation;
  }

  return React.Fragment;
}

function getActionHeading(code: string, actionType: ActionTree["actionType"]) {
  switch (actionType) {
    case AppsmithFunction.none:
      return "Select an action";

    case AppsmithFunction.navigateTo:
      return FIELD_CONFIG[FieldType.PAGE_SELECTOR_FIELD]
        .getter(code)
        .slice(1, -1);

    case AppsmithFunction.showAlert:
      return FIELD_CONFIG[FieldType.ALERT_TEXT_FIELD].getter(code);

    case AppsmithFunction.storeValue:
      return FIELD_CONFIG[FieldType.KEY_TEXT_FIELD_STORE_VALUE].getter(code);

    case AppsmithFunction.copyToClipboard:
      return FIELD_CONFIG[FieldType.COPY_TEXT_FIELD].getter(code);

    case AppsmithFunction.download:
      return (
        FIELD_CONFIG[FieldType.DOWNLOAD_FILE_NAME_FIELD].getter(code) +
        "." +
        FIELD_CONFIG[FieldType.DOWNLOAD_FILE_TYPE_FIELD].getter(code)
      );

    case AppsmithFunction.runAPI:
    case AppsmithFunction.jsFunction:
      return getFunctionName(stringToJS(code), self.evaluationVersion) + "()";

    case AppsmithFunction.integration:
      return getFunctionName(stringToJS(code), self.evaluationVersion);

    case AppsmithFunction.showModal:
      return FIELD_CONFIG[FieldType.SHOW_MODAL_FIELD].getter(code);

    case AppsmithFunction.resetWidget:
      return FIELD_CONFIG[FieldType.WIDGET_NAME_FIELD].getter(code);

    case AppsmithFunction.clearStore:
      return "";

    case AppsmithFunction.removeValue:
      return FIELD_CONFIG[FieldType.KEY_TEXT_FIELD_REMOVE_VALUE].getter(code);

    case AppsmithFunction.setInterval:
      return FIELD_CONFIG[FieldType.DELAY_FIELD].getter(code) + "ms";

    case AppsmithFunction.clearInterval:
      return FIELD_CONFIG[FieldType.ID_FIELD].getter(code);

    case AppsmithFunction.getGeolocation:
      return "{{ }}";

    case AppsmithFunction.watchGeolocation:
      return "";

    case AppsmithFunction.stopWatchGeolocation:
      return "";
  }

  return "";
}

export function getActionInfo(
  code: string,
  actionType: ActionTree["actionType"],
) {
  const Icon = getIconForAction(actionType);

  if (!actionType) {
    actionType = AppsmithFunction.none;
  }

  const actionTypeLabel = FIELD_GROUP_CONFIG[actionType].label;

  const action = getActionHeading(JSToString(code), actionType);

  return { Icon, actionTypeLabel, action };
}
