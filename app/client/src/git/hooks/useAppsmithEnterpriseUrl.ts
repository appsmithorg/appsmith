import { getInstanceId } from "ee/selectors/tenantSelectors";
import { useSelector } from "react-redux";
import { ENTERPRISE_PRICING_PAGE } from "constants/ThirdPartyConstants";
import { useMemo } from "react";
import TrackedUser from "ee/utils/Analytics/trackedUser";
import log from "loglevel";

export const useAppsmithEnterpriseUrl = (feature: string) => {
  const instanceId = useSelector(getInstanceId);
  let source = "unknown";

  try {
    const user = TrackedUser.getInstance().getUser();

    source = user.source;
  } catch (e) {
    log.error("Failed to get user source:", e);
  }
  const constructedUrl = useMemo(() => {
    const url = new URL(ENTERPRISE_PRICING_PAGE);

    if (source) url.searchParams.append("source", source);

    if (instanceId) url.searchParams.append("instance", instanceId);

    if (feature) url.searchParams.append("feature", feature);

    return url.href;
  }, [source, instanceId, feature]);

  return constructedUrl;
};
