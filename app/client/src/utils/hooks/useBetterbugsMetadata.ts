import { useSelector } from "react-redux";
import type { DefaultRootState } from "react-redux";
import { getInstanceId } from "ee/selectors/organizationSelectors";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import type { BetterbugsMetadata } from "utils/Analytics/betterbugs";

export const useBetterbugsMetadata = (): BetterbugsMetadata => {
  const instanceId = useSelector(getInstanceId);
  const tenantId = useSelector(
    (state: DefaultRootState) => state.organization?.tenantId,
  );
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);

  return {
    instanceId,
    tenantId,
    applicationId,
    pageId,
  };
};
