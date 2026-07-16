package com.appsmith.server.domains.ce;

import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.experimental.FieldNameConstants;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.data.annotation.Transient;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Data
@FieldNameConstants
public class OrganizationConfigurationCE implements Serializable {

    @Transient
    @Deprecated(forRemoval = true, since = "v1.65")
    private String googleMapsKey;

    private Boolean isFormLoginEnabled;

    private Boolean isSignupDisabled;

    @Transient
    @Deprecated(forRemoval = true, since = "v1.65")
    private String instanceName;

    protected License license;

    // organization admin can toggle this field to enable/disable email verification
    @Transient
    @Deprecated(forRemoval = true, since = "v1.65")
    private Boolean emailVerificationEnabled;

    // We add `JsonInclude` here, so that this field is included in the JSON response, even if it is `null`. Reason is,
    // if this field is not present, then the existing value in client's state doesn't get updated. It's just the way
    // the splat (`...`) operator works in the client. Evidently, we'll want this for all fields in this class.
    // In that sense, this class is special, because organization configuration is cached in `localStorage`, and so it's
    // state
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
    // 2. Because of grandfathering via cron where organization level feature flags are fetched
    Map<String, FeatureMigrationType> featuresWithPendingMigration;

    Boolean isStrongPasswordPolicyEnabled;

    private Boolean isAtomicPushAllowed = false;

    /**
     * Health signal driving the admin warning banner introduced for
     * <a href="https://github.com/appsmithorg/appsmith/security/advisories/GHSA-j9gf-vw2f-9hrw">GHSA-j9gf-vw2f-9hrw</a>.
     * Set at runtime by {@code OrganizationServiceCEImpl#getClientPertinentOrganization} from
     * {@code SecureBaseUrlResolverCE#isBaseUrlConfigurationHealthy()} — this field is NOT
     * persisted to the DB, so it does not appear in {@link #copyNonSensitiveValues}. False on
     * a CE / single-org-EE deployment with {@code APPSMITH_BASE_URL} unset; always true on
     * multi-org-EE because each organization derives its own canonical base URL.
     */
    @Transient
    private Boolean instanceBaseUrlConfigurationHealthy;

    public void addThirdPartyAuth(String auth) {
        if (thirdPartyAuths == null) {
            thirdPartyAuths = new ArrayList<>();
        }
        thirdPartyAuths.add(auth);
    }

    public void copyNonSensitiveValues(OrganizationConfiguration organizationConfiguration) {
        license = new License();
        license.setPlan(LicensePlan.FREE);

        if (organizationConfiguration == null) {
            return;
        }

        googleMapsKey = ObjectUtils.defaultIfNull(organizationConfiguration.getGoogleMapsKey(), googleMapsKey);
        isFormLoginEnabled =
                ObjectUtils.defaultIfNull(organizationConfiguration.getIsFormLoginEnabled(), isFormLoginEnabled);
        isSignupDisabled = ObjectUtils.defaultIfNull(organizationConfiguration.getIsSignupDisabled(), isSignupDisabled);
        instanceName = ObjectUtils.defaultIfNull(organizationConfiguration.getInstanceName(), instanceName);
        emailVerificationEnabled = ObjectUtils.defaultIfNull(
                organizationConfiguration.getEmailVerificationEnabled(), emailVerificationEnabled);

        featuresWithPendingMigration = organizationConfiguration.getFeaturesWithPendingMigration();
        migrationStatus = organizationConfiguration.getMigrationStatus();
        isStrongPasswordPolicyEnabled = organizationConfiguration.getIsStrongPasswordPolicyEnabled();
        isAtomicPushAllowed = organizationConfiguration.getIsAtomicPushAllowed();
    }

    /**
     * Strips fields that should not be visible to unauthenticated (anonymous) users.
     * Only fields required for the login/signup page are preserved (branding, auth method flags,
     * instance name, form login state, third-party auth list).
     * EE subclass overrides this to strip additional EE-specific fields.
     */
    public void stripFieldsForAnonymousUser() {
        this.googleMapsKey = null;
        this.isSignupDisabled = null;
        this.emailVerificationEnabled = null;
        this.isStrongPasswordPolicyEnabled = null;
        this.isAtomicPushAllowed = null;
        this.featuresWithPendingMigration = null;
        this.migrationStatus = MigrationStatus.COMPLETED;

        License minimalLicense = new License();
        minimalLicense.setPlan(LicensePlan.FREE);
        this.license = minimalLicense;
    }

    protected static <T> T getComputedValue(T defaultValue, T updatedValue, T currentValue) {
        if (currentValue == null && updatedValue == null) {
            return defaultValue;
        }
        return ObjectUtils.defaultIfNull(updatedValue, currentValue);
    }

    public static class Fields {
        public Fields() {
            // Public constructor for Fields class
        }
    }
}
