import { useSelector } from "react-redux";
import { getInstanceId } from "@appsmith/selectors/tenantSelectors";
import { PRICING_PAGE_URL } from "constants/ThirdPartyConstants";
import AnalyticsUtil, { EventName } from "utils/AnalyticsUtil";

type Props = {
  intercomMessage?: string;
  logEventName?: EventName;
  logEventData?: any;
};

const useOnUpgrade = (props: Props) => {
  const { logEventData, logEventName } = props;
  const instanceId = useSelector(getInstanceId);

  const onUpgrade = () => {
    AnalyticsUtil.logEvent(
      logEventName || "ADMIN_SETTINGS_UPGRADE",
      logEventData,
    );
    window.open(PRICING_PAGE_URL("CE", instanceId), "_blank");
  };

  return { onUpgrade };
};

export default useOnUpgrade;
