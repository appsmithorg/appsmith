import { getAppsmithConfigs } from "@appsmith/configs";
import {
  createMessage,
  UPGRADE_TO_EE_GENERIC,
} from "@appsmith/constants/messages";
import { getTenantConfig } from "@appsmith/selectors/tenantSelectors";
import { useSelector } from "react-redux";
import { selectFeatureFlags } from "selectors/usersSelectors";
import AnalyticsUtil, { EventName } from "utils/AnalyticsUtil";

const { intercomAppID } = getAppsmithConfigs();

type Props = {
  intercomMessage?: string;
  logEventName?: EventName;
  logEventData?: any;
};

const useOnUpgrade = (props: Props) => {
  const { intercomMessage, logEventData, logEventName } = props;
  const features = useSelector(selectFeatureFlags);
  const tenantConfig = useSelector(getTenantConfig);

  const triggerIntercom = (message: string) => {
    if (intercomAppID && window.Intercom) {
      window.Intercom("showNewMessage", message);
    }
  };

  const onUpgrade = () => {
    AnalyticsUtil.logEvent(
      logEventName || "ADMIN_SETTINGS_UPGRADE",
      logEventData,
    );
    if (features.USAGE_AND_BILLING) {
      window.open(
        `https://www.appsmith.com/api/preview?secret=8JPsJRnSkt6Va8FzxUPFhZezxZuHRnSU&slug=pricing-preview?source=CE&instance=${tenantConfig?.instanceId}`,
        "_blank",
      );
    } else {
      triggerIntercom(intercomMessage || createMessage(UPGRADE_TO_EE_GENERIC));
    }
  };

  return { onUpgrade };
};

export default useOnUpgrade;
