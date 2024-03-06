import React, { useEffect } from "react";

import { requiresAuth } from "pages/UserAuth/requiresAuthHOC";
import { useSelector } from "react-redux";
import {
  isAdminUser,
  isLicenseExpired,
  isTrialLicense,
} from "@appsmith/selectors/tenantSelectors";

import LicenseCheckPageNonAdmin from "./Components/LicenseCheckPageNonAdmin";
import LicenseCheckPageFreshInstance from "./Components/LicenseCheckPageFreshInstance";
import { getAppsmithConfigs } from "@appsmith/configs";
import LicenseCheckPageExpiredTrial from "./Components/LicenseCheckPageExpiredTrial";
import LicenseCheckPageExpiredPaid from "./Components/LicenseCheckPageExpiredPaid";

const { intercomAppID } = getAppsmithConfigs();

function LicenseCheckPage() {
  const isAdmin = useSelector(isAdminUser);
  const isExpired = useSelector(isLicenseExpired);
  const isTrial = useSelector(isTrialLicense);

  function hideIntercomLauncher(val: boolean) {
    if (intercomAppID && window.Intercom) {
      window.Intercom("boot", {
        app_id: intercomAppID,
        hide_default_launcher: val,
      });
    }
  }

  useEffect(() => {
    hideIntercomLauncher(false);
    return () => hideIntercomLauncher(true);
  }, []);

  if (!isAdmin) {
    return <LicenseCheckPageNonAdmin />;
  } else {
    if (isExpired) {
      if (isTrial) return <LicenseCheckPageExpiredTrial />;
      else return <LicenseCheckPageExpiredPaid />;
    }
    return <LicenseCheckPageFreshInstance />;
  }
}

export default requiresAuth(LicenseCheckPage);
