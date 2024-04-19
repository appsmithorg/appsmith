import { useSelector } from "react-redux";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import {
  CUSTOMER_PORTAL_URL_WITH_PARAMS,
  PRICING_PAGE_URL,
} from "constants/ThirdPartyConstants";
import type { EventName } from "@appsmith/utils/analyticsUtilTypes";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { getAppsmithConfigs } from "@appsmith/configs";
import { pricingPageUrlSource } from "@appsmith/utils/licenseHelpers";
import type {
  RampFeature,
  RampSection,
} from "utils/ProductRamps/RampsControlList";

interface Props {
  logEventName?: EventName;
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
