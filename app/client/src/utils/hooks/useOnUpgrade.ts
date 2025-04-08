import { useSelector } from "react-redux";
import { getInstanceId } from "ee/selectors/organizationSelectors";
import {
  CUSTOMER_PORTAL_URL_WITH_PARAMS,
  PRICING_PAGE_URL,
} from "constants/ThirdPartyConstants";
import type { EventName } from "ee/utils/analyticsUtilTypes";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { getAppsmithConfigs } from "ee/configs";
import { pricingPageUrlSource } from "ee/utils/licenseHelpers";
import type {
  RampFeature,
  RampSection,
} from "utils/ProductRamps/RampsControlList";
import { useIsCloudBillingEnabled } from "hooks";
import { WORKSPACE_SETTINGS_LICENSE_PAGE_URL } from "constants/routes";

interface Props {
  logEventName?: EventName;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logEventData?: any;
  featureName?: RampFeature;
  sectionName?: RampSection;
  isEnterprise?: boolean;
}

const useOnUpgrade = (props: Props) => {
  const { featureName, isEnterprise, logEventData, logEventName, sectionName } =
    props;
  const instanceId = useSelector(getInstanceId);
  const appsmithConfigs = getAppsmithConfigs();
  const isCloudBillingEnabled = useIsCloudBillingEnabled();

  const onUpgrade = () => {
    AnalyticsUtil.logEvent(
      logEventName || "ADMIN_SETTINGS_UPGRADE",
      logEventData,
    );

    if (isEnterprise) {
      window.open(
        PRICING_PAGE_URL(
          appsmithConfigs.pricingUrl,
          pricingPageUrlSource,
          instanceId,
          featureName,
          sectionName,
        ),
      );
    } else if (isCloudBillingEnabled) {
      window.open(WORKSPACE_SETTINGS_LICENSE_PAGE_URL, "_blank");
    } else {
      window.open(
        CUSTOMER_PORTAL_URL_WITH_PARAMS(
          appsmithConfigs.customerPortalUrl,
          pricingPageUrlSource,
          instanceId,
          featureName,
          sectionName,
        ),
        "_blank",
      );
    }
  };

  return { onUpgrade };
};

export default useOnUpgrade;
