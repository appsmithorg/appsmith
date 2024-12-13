import { getInstanceId } from "ee/selectors/tenantSelectors";
import { useSelector } from "react-redux";
import { ENTERPRISE_PRICING_PAGE } from "constants/ThirdPartyConstants";
import { useMemo } from "react";
import { getUserSource } from "ee/utils/AnalyticsUtil";

export const useAppsmithEnterpriseUrl = (feature: string) => {
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
