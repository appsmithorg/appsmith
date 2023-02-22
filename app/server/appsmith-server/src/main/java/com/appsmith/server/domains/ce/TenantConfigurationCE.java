package com.appsmith.server.domains.ce;

import com.appsmith.server.domains.TenantConfiguration;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TenantConfigurationCE {

    private String googleMapsKey;

    public void copyNonSensitiveValues(TenantConfiguration source) {
        if (source == null) {
            return;
        }

        googleMapsKey = source.getGoogleMapsKey();
    }

}
