package com.appsmith.server.domains.ce;

import com.appsmith.server.domains.TenantConfiguration;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TenantConfigurationCE {

    @JsonProperty("APPSMITH_GOOGLE_MAPS_API_KEY")
    private String googleMapsKey;

    public void copyNonSensitiveValues(TenantConfiguration source) {
        googleMapsKey = source.getGoogleMapsKey();
    }

}
