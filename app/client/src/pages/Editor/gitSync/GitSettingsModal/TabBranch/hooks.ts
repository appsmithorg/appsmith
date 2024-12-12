import { getInstanceId } from "ee/selectors/tenantSelectors";
import { useSelector } from "react-redux";
import { ENTERPRISE_PRICING_PAGE } from "constants/ThirdPartyConstants";
import { useMemo } from "react";
import TrackedUser from "ee/utils/Analytics/trackedUser";

export const useAppsmithEnterpriseLink = (feature: string) => {
  const instanceId = useSelector(getInstanceId);
  const { source } = TrackedUser.getInstance().getUser();

  return useMemo(() => {
    const url = new URL(ENTERPRISE_PRICING_PAGE);

    if (source) url.searchParams.append("source", source);

    if (instanceId) url.searchParams.append("instance", instanceId);

    if (feature) url.searchParams.append("feature", feature);

    return url.href;
  }, [source, instanceId, feature]);
};
