import { useSelector } from "react-redux";
import { getIsCloudBillingFeatureFlagEnabled } from "selectors/cloudBillingSelectors";

const useIsCloudBillingEnabled = () => {
  const isCloudBillingFeatureFlagEnabled = useSelector(
    getIsCloudBillingFeatureFlagEnabled,
  );

  return isCloudBillingFeatureFlagEnabled;
};

// add cloudHosting check later: Ankita
export { useIsCloudBillingEnabled };
