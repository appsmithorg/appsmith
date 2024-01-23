import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { getAppsmithConfigs } from "@appsmith/configs";
import { useSelector } from "react-redux";
import { ENTERPRISE_PRICING_PAGE } from "constants/ThirdPartyConstants";
import { useMemo } from "react";

export const useAppsmithEnterpriseLink = (feature: string) => {
  const instanceId = useSelector(getInstanceId);
  const { cloudHosting } = getAppsmithConfigs();
  const source = cloudHosting ? "cloud" : "ce";
  const constructedUrl = useMemo(() => {
    const url = new URL(ENTERPRISE_PRICING_PAGE);
    if (source) url.searchParams.append("source", source);
    if (instanceId) url.searchParams.append("instance", instanceId);
    if (feature) url.searchParams.append("feature", feature);
    return url.href;
  }, [source, instanceId, feature]);

  return constructedUrl;
};
