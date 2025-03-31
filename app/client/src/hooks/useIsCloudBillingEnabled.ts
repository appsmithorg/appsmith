import { useSelector } from "react-redux";

import { getAppsmithConfigs } from "ee/configs";
import { getIsCloudBillingFeatureFlagEnabled } from "selectors/cloudBillingSelectors";

const useIsCloudBillingEnabled = () => {
  const { cloudHosting } = getAppsmithConfigs();
  const isCloudBillingFeatureFlagEnabled = useSelector(
    getIsCloudBillingFeatureFlagEnabled,
  );

  return isCloudBillingFeatureFlagEnabled && cloudHosting;
};

export { useIsCloudBillingEnabled };
