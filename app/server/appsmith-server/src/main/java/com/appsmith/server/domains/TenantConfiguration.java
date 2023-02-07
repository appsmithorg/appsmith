package com.appsmith.server.domains;

import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.server.constants.LicenseOrigin;
import com.appsmith.server.constants.LicenseStatus;
import com.appsmith.server.constants.LicenseType;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.ce.TenantConfigurationCE;
import com.appsmith.server.services.UserServiceImpl;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;

import java.time.Instant;

@Data
public class TenantConfiguration extends TenantConfigurationCE {
    @JsonProperty("APPSMITH_BRAND_ENABLE")
    String whiteLabelEnable;

    @JsonProperty(value = "APPSMITH_BRAND_LOGO", access = JsonProperty.Access.WRITE_ONLY)
    String whiteLabelLogo;

    @JsonProperty(value = "APPSMITH_BRAND_FAVICON", access = JsonProperty.Access.WRITE_ONLY)
    String whiteLabelFavicon;

    BrandColors brandColors;

    public String getBrandLogoUrl() {
        return assetToUrl(whiteLabelLogo, UserServiceImpl.DEFAULT_APPSMITH_LOGO);
    }

    public String getBrandFaviconUrl() {
        return assetToUrl(whiteLabelFavicon, "https://assets.appsmith.com/appsmith-favicon-orange.ico");
    }

    @JsonIgnore
    public boolean isWhitelabelEnabled() {
        return "true".equals(whiteLabelEnable);
    }

    @NotNull
    private static String assetToUrl(String assetSpec, String defaultValue) {
        if (StringUtils.isEmpty(assetSpec)) {
            return defaultValue;
        } else if (assetSpec.startsWith("asset:")) {
            return Url.ASSET_URL + "/" + assetSpec.substring("asset:".length());
        } else {
            return assetSpec;
        }
    }

    public void copyNonSensitiveValues(TenantConfiguration tenantConfiguration) {
        if (tenantConfiguration.isWhitelabelEnabled()) {
            this.whiteLabelLogo = tenantConfiguration.getWhiteLabelLogo();
            this.whiteLabelFavicon = tenantConfiguration.getWhiteLabelFavicon();
            this.brandColors = tenantConfiguration.getBrandColors();
        }

        this.license = tenantConfiguration.getLicense();
        if (null != this.license && null != this.license.key) {
            this.license.key = DataTypeStringUtils.maskString(this.license.key);
        }
    }

    @Data
    public static class BrandColors {
        private String primary;
        private String background;
        private String font;
        private String disabled;
        private String hover;
    }

    License license;
    @Data
    public static class License {
        Boolean active;
        String id;
        String key;
        LicenseType type;
        Instant expiry;
        LicenseStatus status;
        LicenseOrigin origin;
    }

}
