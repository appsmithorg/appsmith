import type { Dispatch } from "react";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  AdminConfigType,
  Setting,
} from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import { isAirgapped } from "ee/utils/airgapHelpers";

const isAirgappedInstance = isAirgapped();

export const config: AdminConfigType = {
  icon: "timer-2-line",
  type: SettingCategories.VERSION,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.GROUP,
  title: "Version",
  canSave: false,
  settings: [
    {
      id: "APPSMITH_CURRENT_VERSION",
      category: SettingCategories.VERSION,
      controlType: SettingTypes.TEXT,
      label: "Current version",
    },
    {
      id: "APPSMITH_VERSION_READ_MORE",
      action: (dispatch?: Dispatch<ReduxAction<boolean>>) => {
        dispatch &&
          dispatch({
            type: ReduxActionTypes.TOGGLE_RELEASE_NOTES,
            payload: true,
          });
      },
      category: SettingCategories.VERSION,
      controlType: SettingTypes.CALLOUT,
      label: "Release notes",
    },
  ].filter((setting) =>
    isAirgappedInstance ? setting.id !== "APPSMITH_VERSION_READ_MORE" : true,
  ) as Setting[],
};
