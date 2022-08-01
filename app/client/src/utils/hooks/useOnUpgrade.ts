import { useEffect } from "react";
import { useSelector } from "react-redux";

import bootIntercom from "utils/bootIntercom";
import { getAppsmithConfigs } from "@appsmith/configs";
import { getCurrentUser } from "selectors/usersSelectors";
import { createMessage, UPGRADE_TO_EE_GENERIC } from "ce/constants/messages";
import AnalyticsUtil, { EventName } from "utils/AnalyticsUtil";

const { intercomAppID } = getAppsmithConfigs();

type Props = {
  intercomMessage?: string;
  logEventName?: EventName;
  logEventData?: any;
};

const useOnUpgrade = (props: Props) => {
  const user = useSelector(getCurrentUser);

  useEffect(() => {
    bootIntercom(user);
  }, [user?.email]);

  const { intercomMessage, logEventData, logEventName } = props;

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
    triggerIntercom(intercomMessage || createMessage(UPGRADE_TO_EE_GENERIC));
  };

  return { onUpgrade };
};

export default useOnUpgrade;
