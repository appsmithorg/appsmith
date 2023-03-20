import type { Dispatch } from "react";
import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";

export const config: AdminConfigType = {
  icon: "timer-2-line",
  type: SettingCategories.VERSION,
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
      controlType: SettingTypes.LINK,
      label: "Release Notes",
    },
  ],
};
