export * from "ce/selectors/rampSelectors";
import { showProductRamps as CE_showProductRamps } from "ce/selectors/rampSelectors";
import { createSelector } from "reselect";
import { getAppsmithConfigs } from "@appsmith/configs";

const { cloudHosting } = getAppsmithConfigs();

export const showProductRamps = (
  rampName: string,
  isEnterpriseOnlyFeature = false,
  isFeatureFlagEnabled?: boolean,
) =>
  cloudHosting || isEnterpriseOnlyFeature || !isFeatureFlagEnabled
    ? CE_showProductRamps(rampName)
    : createSelector(
        () => null,
        () => {
          return false;
        },
      );
