package com.appsmith.server.domains.ce;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.TenantConfiguration;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import org.apache.commons.lang3.ObjectUtils;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Deprecated
@Data
public class TenantConfigurationCE implements Serializable {

    private String googleMapsKey;

    private Boolean isFormLoginEnabled;

    private String instanceName;

    protected License license;

    // tenant admin can toggle this field to enable/disable email verification
    private Boolean emailVerificationEnabled;

    // We add `JsonInclude` here, so that this field is included in the JSON response, even if it is `null`. Reason is,
    // if this field is not present, then the existing value in client's state doesn't get updated. It's just the way
    // the splat (`...`) operator works in the client. Evidently, we'll want this for all fields in this class.
    // In that sense, this class is special, because tenant configuration is cached in `localStorage`, and so it's state
    // is preserved across browser refreshes.
    @JsonInclude
    private List<String> thirdPartyAuths;

    // Field to be used to track the status of migrations during upgrade and downgrade workflows. Downgrade migrations
    // are gated by user consent whereas upgrade can be triggered immediately and depending upon the status client
    // blocks the user access to the instance
    MigrationStatus migrationStatus = MigrationStatus.COMPLETED;

    // Field to store the list of features for which the migrations are pending. This will be used to store the diffs of
    // the feature flags. This can happen for 2 reasons:
    // 1. The license plan changes
    // 2. Because of grandfathering via cron where tenant level feature flags are fetched
    Map<FeatureFlagEnum, FeatureMigrationType> featuresWithPendingMigration;

    // This variable is used to indicate if the server needs to be restarted after the migration based on feature flags
    // is complete.
    Boolean isRestartRequired;

    Boolean isStrongPasswordPolicyEnabled;

    private Boolean isAtomicPushAllowed = false;

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
        emailVerificationEnabled =
                ObjectUtils.defaultIfNull(tenantConfiguration.isEmailVerificationEnabled(), emailVerificationEnabled);

        featuresWithPendingMigration = tenantConfiguration.getFeaturesWithPendingMigration();
        migrationStatus = tenantConfiguration.getMigrationStatus();
        isStrongPasswordPolicyEnabled = tenantConfiguration.getIsStrongPasswordPolicyEnabled();
        isAtomicPushAllowed = tenantConfiguration.getIsAtomicPushAllowed();
    }

    public Boolean isEmailVerificationEnabled() {
        return Boolean.TRUE.equals(this.emailVerificationEnabled);
    }
}
