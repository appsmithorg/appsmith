package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.TenantConfigurationCE;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TenantConfiguration extends TenantConfigurationCE {
    @JsonProperty("APPSMITH_BRAND_ENABLE")
    String whiteLabelEnable;

    @JsonProperty("APPSMITH_BRAND_LOGO")
    String whiteLabelLogo;

    @JsonProperty("APPSMITH_BRAND_FAVICON")
    String whiteLabelFavicon;

    @JsonProperty("APPSMITH_BRAND_PRIMARY_COLOR")
    String whiteLabelPrimaryColor;

    @JsonProperty("APPSMITH_BRAND_SECONDARY_COLOR")
    String whiteLabelSecondaryColor;

    public void copyNonSensitiveValues(TenantConfiguration tenantConfiguration) {
        if (Boolean.parseBoolean(tenantConfiguration.whiteLabelEnable)) {
            this.whiteLabelLogo = tenantConfiguration.getWhiteLabelLogo();
            this.whiteLabelFavicon = tenantConfiguration.getWhiteLabelFavicon();
            this.whiteLabelPrimaryColor = tenantConfiguration.getWhiteLabelPrimaryColor();
            this.whiteLabelSecondaryColor = tenantConfiguration.getWhiteLabelSecondaryColor();
        }
    }
}
