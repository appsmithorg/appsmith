import AnalyticsUtil, { EventName } from "utils/AnalyticsUtil";

type Props = {
  logEventName?: EventName;
  logEventData?: any;
};

const useOnUpgrade = (props: Props) => {
  const { logEventData, logEventName } = props;

  const onUpgrade = () => {
    AnalyticsUtil.logEvent(
      logEventName || "ADMIN_SETTINGS_UPGRADE",
      logEventData,
    );
    window.open(
      "https://www.appsmith.com/pricing?source=CE&instance=",
      "_blank",
    );
  };

  return { onUpgrade };
};

export default useOnUpgrade;
