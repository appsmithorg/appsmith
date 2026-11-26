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
  icon: "info-fill",
  type: SettingCategories.ADMIN_CENTRAL,
  categoryType: CategoryType.INSTANCE,
  controlType: SettingTypes.GROUP,
  title: "Admin central",
  subText: "Important information about this Appsmith instance.",
  canSave: false,
  settings: [
    {
      id: "APPSMITH_CURRENT_VERSION",
      category: SettingCategories.ADMIN_CENTRAL,
      controlType: SettingTypes.TEXT,
      label: "Current version",
      labelKind: "heading-m",
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
      category: SettingCategories.ADMIN_CENTRAL,
      controlType: SettingTypes.CALLOUT,
      label: "Release notes",
    },
  ].filter((setting) =>
    isAirgappedInstance ? setting.id !== "APPSMITH_VERSION_READ_MORE" : true,
  ) as Setting[],
};
