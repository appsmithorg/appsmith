package com.appsmith.server.dtos;

import com.appsmith.server.constants.LicensePlan;
import lombok.Data;

@Data
public class TenantDowngradeRequestDTO {
    private String appsmithInstanceId;
    private String tenantId;
    private LicensePlan fromLicensePlan;
    private LicensePlan toLicensePlan;

    /**
     * This string format is being used as data for HMAC signature generation of request body.
     * We need to ensure that as any change happens in this method, similar changes should happen on consumer in this case
     * CS repo so that signature generation message remains same on both side and security verification doesn't break
     */
    @Override
    public String toString() {
        return "InstanceDowngradeRequestDTO{" + "appsmithInstanceId="
                + this.appsmithInstanceId + ", tenantId="
                + this.tenantId + ", fromLicensePlan="
                + this.fromLicensePlan + ", toLicensePlan="
                + this.toLicensePlan + '}';
    }
}
