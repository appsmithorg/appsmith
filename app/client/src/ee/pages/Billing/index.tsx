import React from "react";

import { useSelector } from "react-redux";
import { isFreePlan } from "@appsmith/selectors/tenantSelectors";
import { BillingPagePaid } from "./Components/BillingPagePaid";
import { BillingPageFree } from "./Components/BillingPageFree";

export function Billing() {
  const isLicenseFreePlan = useSelector(isFreePlan);
  {
    if (isLicenseFreePlan) return <BillingPageFree />;
    else return <BillingPagePaid />;
  }
}
