package com.appsmith.server.domains.ce;

import com.appsmith.server.constants.LicensePlan;
import lombok.Data;

@Data
public class LicenseCE {
    LicensePlan plan;

    // Field to detect previous license plan which will be used to provide the appropriate messaging on UI
    LicensePlan previousPlan = LicensePlan.FREE;
}
