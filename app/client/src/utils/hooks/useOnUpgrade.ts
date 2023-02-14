import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { useSelector } from "react-redux";
import AnalyticsUtil, { EventName } from "utils/AnalyticsUtil";

type Props = {
  intercomMessage?: string;
  logEventName?: EventName;
  logEventData?: any;
};

const PRICING_PAGE_URL =
  "https://www.appsmith.com/api/preview?secret=8JPsJRnSkt6Va8FzxUPFhZezxZuHRnSU&slug=pricing-preview";

const useOnUpgrade = (props: Props) => {
  const { logEventData, logEventName } = props;
  const tenantConfig = useSelector(getTenantConfig);

  const onUpgrade = () => {
    AnalyticsUtil.logEvent(
      logEventName || "ADMIN_SETTINGS_UPGRADE",
      logEventData,
    );
    window.open(
      `${PRICING_PAGE_URL}?source=CE&instance=${tenantConfig?.instanceId}`,
      "_blank",
    );
  };

  return { onUpgrade };
};

export default useOnUpgrade;
