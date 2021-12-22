import { Dispatch } from "react";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";

export const config: AdminConfigType = {
  type: SettingCategories.VERSION,
  controlType: SettingTypes.GROUP,
  title: "Version",
  canSave: false,
  settings: [
    {
      id: "APPSMITH_CURRENT_VERSION",
      category: "version",
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
      category: "version",
      controlType: SettingTypes.LINK,
      label: "Release Notes",
    },
  ],
};
