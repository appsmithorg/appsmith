import type { Setting } from "../types";
import { SettingCategories, SettingSubtype, SettingTypes } from "../types";
import { selectFeatureFlagCheck } from "@appsmith/selectors/featureFlagsSelectors";
import store from "store";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

const isEnabledForPoolSize = selectFeatureFlagCheck(
  store.getState(),
  FEATURE_FLAG.license_connection_pool_size_enabled,
);

export const poolSizeConfig: Setting[] = isEnabledForPoolSize
  ? [
      {
        id: "connectionMaxPoolSize",
        category: SettingCategories.DEVELOPER_SETTINGS,
        controlType: SettingTypes.TEXTINPUT,
        controlSubType: SettingSubtype.NUMBER,
        isFeatureEnabled: isEnabledForPoolSize,
        isEnterprise: true,
        label: "Connection pool size",
        subText: "You can establish a maximum of 5 to 50 connections.",
        placeholder: "12",
        validate: (value: string) => {
          if (parseInt(value) > 50) {
            return "Please enter valid pool size less than or equal to 50.";
          } else if (parseInt(value) < 5) {
            return "Please enter valid pool size more than or equal to 5.";
          }
        },
      },
    ]
  : [];
