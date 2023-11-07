import { useSelector } from "react-redux";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { CUSTOMER_PORTAL_URL_WITH_PARAMS } from "constants/ThirdPartyConstants";
import type { EventName } from "@appsmith/utils/analyticsUtilTypes";
import AnalyticsUtil from "utils/AnalyticsUtil";
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
}

const useOnUpgrade = (props: Props) => {
  const { featureName, logEventData, logEventName, sectionName } = props;
  const instanceId = useSelector(getInstanceId);
  const appsmithConfigs = getAppsmithConfigs();

  const onUpgrade = () => {
    AnalyticsUtil.logEvent(
      logEventName || "ADMIN_SETTINGS_UPGRADE",
      logEventData,
    );
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
  };

  return { onUpgrade };
};

export default useOnUpgrade;
