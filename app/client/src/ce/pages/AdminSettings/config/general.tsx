import React from "react";
import type {
  AdminConfigType,
  Setting,
} from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import BrandingBadge from "pages/AppViewer/BrandingBadge";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import store from "store";
import { isMultiOrgFFEnabled } from "ee/utils/planHelpers";
import { isAirgapped } from "ee/utils/airgapHelpers";

const featureFlags = selectFeatureFlags(store.getState());
const isMultiOrgEnabled = isMultiOrgFFEnabled(featureFlags);
const isAirgappedInstance = isAirgapped();

export const APPSMITH_DISABLE_TELEMETRY_SETTING: Setting = {
  id: "APPSMITH_DISABLE_TELEMETRY",
  name: "APPSMITH_DISABLE_TELEMETRY",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.CHECKBOX,
  label: "Anonymous usage data",
  text: "Share anonymous usage data to help improve the product",
  isVisible: () => !isMultiOrgEnabled && !isAirgappedInstance,
};

export const APPSMITH_HIDE_WATERMARK_SETTING: Setting = {
  id: "hideWatermark",
  name: "hideWatermark",
  category: SettingCategories.GENERAL,
  controlType: SettingTypes.CHECKBOX,
  label: "Appsmith watermark",
  text: "Hide Appsmith watermark",
  isFeatureEnabled: false,
  isDisabled: () => true,
  textSuffix: <BrandingBadge />,
};

export const config: AdminConfigType = {
  icon: "settings-v3",
  type: SettingCategories.GENERAL,
  categoryType: CategoryType.ORGANIZATION,
  controlType: SettingTypes.GROUP,
  title: "General",
  subText: "Set your organisational general settings",
  canSave: true,
  settings: [
    APPSMITH_DISABLE_TELEMETRY_SETTING,
    APPSMITH_HIDE_WATERMARK_SETTING,
  ],
} as AdminConfigType;
