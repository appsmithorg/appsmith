package com.appsmith.server.domains.ce;

import com.appsmith.server.constants.LicensePlan;
import lombok.Data;

import java.io.Serializable;

@Data
public class LicenseCE implements Serializable {
    LicensePlan plan;
}
