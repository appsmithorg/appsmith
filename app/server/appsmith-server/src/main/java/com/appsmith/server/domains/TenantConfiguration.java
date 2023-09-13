package com.appsmith.server.domains;

import com.appsmith.external.helpers.DataTypeStringUtils;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.ce.TenantConfigurationCE;
import com.appsmith.server.migrations.db.Migration009EE01CreateDefaultLogoAsset;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;

@Data
public class TenantConfiguration extends TenantConfigurationCE {

    // To remove public internet dependency for airgap we have saved the default Appsmith logo to Asset collection. Also
    // to keep the consistency, this behaviour is same for EE and airgap image going forward.
    // use this constant as identifier (name field) in Asset document to save default whiteLabelLogo while creating new
    // tenant
    public static final String APPSMITH_DEFAULT_LOGO = "appsmith_default_logo";

    public static final String DEFAULT_APPSMITH_LOGO = "https://assets.appsmith.com/appsmith-logo-no-margin.png";
    public static final String DEFAULT_APPSMITH_FEVICON = "https://assets.appsmith.com/appsmith-favicon-orange.ico";
    public static final String DEFAULT_PRIMARY_COLOR = "#F86A2B";
    public static final String DEFAULT_BACKGROUND_COLOR = "#FFFFFF";
    public static final String DEFAULT_FONT_COLOR = "#FFFFFF";

    @JsonProperty("APPSMITH_BRAND_ENABLE")
    String whiteLabelEnable;

    /**
     * As we are using the logo in email templates, if we are updating the logo anytime in future to make it compatible
     * with airgapped instance please write a migration to have local reference.
     * Sample migration {@link Migration009EE01CreateDefaultLogoAsset}
     */
    @JsonProperty(value = "APPSMITH_BRAND_LOGO", access = JsonProperty.Access.WRITE_ONLY)
    String whiteLabelLogo;

    @JsonProperty(value = "APPSMITH_BRAND_FAVICON", access = JsonProperty.Access.WRITE_ONLY)
    String whiteLabelFavicon;

    Boolean showRolesAndGroups;

    BrandColors brandColors;

    Boolean singleSessionPerUserEnabled;

    public static final String ASSET_PREFIX = "asset:";

    // The user journey begins with the choice between the community and business versions, as we now offer both options
    // for single image shipping to CE and BE customers. Upon selecting one of these versions, the client grants access
    // to the respective tenant. This variable acts as an indication for client to block the access if the selection is
    // pending.
    Boolean isActivated = Boolean.FALSE;

    public String getBrandLogoUrl() {
        return assetToUrl(whiteLabelLogo, DEFAULT_APPSMITH_LOGO);
    }

    public String getBrandFaviconUrl() {
        return assetToUrl(whiteLabelFavicon, DEFAULT_APPSMITH_FEVICON);
    }

    @JsonIgnore
    public boolean isWhitelabelEnabled() {
        return "true".equals(whiteLabelEnable);
    }

    @NotNull private static String assetToUrl(String assetSpec, String defaultValue) {
        if (StringUtils.isEmpty(assetSpec)) {
            return defaultValue;
        } else if (assetSpec.startsWith(ASSET_PREFIX)) {
            return Url.ASSET_URL + "/" + assetSpec.substring(ASSET_PREFIX.length());
        } else {
            return assetSpec;
        }
    }

    @Override
    public void copyNonSensitiveValues(TenantConfiguration tenantConfiguration) {
        super.copyNonSensitiveValues(tenantConfiguration);
        if (tenantConfiguration == null) {
            return;
        }

        this.whiteLabelLogo = tenantConfiguration.getWhiteLabelLogo();
        this.whiteLabelFavicon = tenantConfiguration.getWhiteLabelFavicon();
        this.brandColors = tenantConfiguration.getBrandColors();
        this.showRolesAndGroups = tenantConfiguration.getShowRolesAndGroups();
        this.singleSessionPerUserEnabled = tenantConfiguration.getSingleSessionPerUserEnabled();
        this.isActivated = tenantConfiguration.getIsActivated();

        boolean isLicenseExist = null != tenantConfiguration.getLicense()
                && !StringUtils.isEmpty(tenantConfiguration.getLicense().getKey());
        License freeLicense = new License();
        freeLicense.setPlan(LicensePlan.FREE);
        this.license = isLicenseExist ? tenantConfiguration.getLicense() : freeLicense;
        if (null != this.license && !StringUtils.isEmpty(this.license.key)) {
            this.license.setSubscriptionDetails(null);
            this.license.key = DataTypeStringUtils.maskString(this.license.key, 8, 32, 'x');
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
}
