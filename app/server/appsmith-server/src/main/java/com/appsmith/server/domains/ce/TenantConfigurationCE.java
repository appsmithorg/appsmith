package com.appsmith.server.domains.ce;

import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.TenantConfiguration;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import org.apache.commons.lang3.ObjectUtils;

import java.util.ArrayList;
import java.util.List;

@Data
public class TenantConfigurationCE {

    private String googleMapsKey;

    private Boolean isFormLoginEnabled;

    private String instanceName;

    protected License license;

    // We add `JsonInclude` here, so that this field is included in the JSON response, even if it is `null`. Reason is,
    // if this field is not present, then the existing value in client's state doesn't get updated. It's just the way
    // the splat (`...`) operator works in the client. Evidently, we'll want this for all fields in this class.
    // In that sense, this class is special, because tenant configuration is cached in `localStorage`, and so it's state
    // is preserved across browser refreshes.
    @JsonInclude
    private List<String> thirdPartyAuths;

    public void addThirdPartyAuth(String auth) {
        if (thirdPartyAuths == null) {
            thirdPartyAuths = new ArrayList<>();
        }
        thirdPartyAuths.add(auth);
    }

    public void copyNonSensitiveValues(TenantConfiguration tenantConfiguration) {
        license = new License();
        license.setPlan(LicensePlan.FREE);

        if (tenantConfiguration == null) {
            return;
        }

        googleMapsKey = ObjectUtils.defaultIfNull(tenantConfiguration.getGoogleMapsKey(), googleMapsKey);
        isFormLoginEnabled = ObjectUtils.defaultIfNull(tenantConfiguration.getIsFormLoginEnabled(), isFormLoginEnabled);
        instanceName = ObjectUtils.defaultIfNull(tenantConfiguration.getInstanceName(), instanceName);
    }
}
