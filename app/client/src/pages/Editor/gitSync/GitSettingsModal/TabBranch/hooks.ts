import { useMemo } from "react";

import { ENTERPRISE_PRICING_PAGE } from "constants/ThirdPartyConstants";
import { getInstanceId } from "ee/selectors/tenantSelectors";
import { getUserSource } from "ee/utils/AnalyticsUtil";
import { useSelector } from "react-redux";

export const useAppsmithEnterpriseLink = (feature: string) => {
  const instanceId = useSelector(getInstanceId);
  const source = getUserSource();
  const constructedUrl = useMemo(() => {
    const url = new URL(ENTERPRISE_PRICING_PAGE);
    if (source) url.searchParams.append("source", source);
    if (instanceId) url.searchParams.append("instance", instanceId);
    if (feature) url.searchParams.append("feature", feature);
    return url.href;
  }, [source, instanceId, feature]);

  return constructedUrl;
};
