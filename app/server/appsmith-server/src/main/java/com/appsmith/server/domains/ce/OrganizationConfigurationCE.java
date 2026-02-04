package com.appsmith.server.domains.ce;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.AIProvider;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonView;
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

    @JsonView(Views.Internal.class)
    @Encrypted private String claudeApiKey;

    @JsonView(Views.Internal.class)
    @Encrypted private String openaiApiKey;

    @JsonView(Views.Internal.class)
    @Encrypted private String copilotApiKey;

    @JsonView(Views.Public.class)
    @JsonInclude
    private AIProvider aiProvider;

    @JsonView(Views.Public.class)
    @JsonInclude
    private Boolean isAIAssistantEnabled = false;

    @JsonView(Views.Public.class)
    @JsonInclude
    private String localLlmUrl;

    @JsonView(Views.Public.class)
    @JsonInclude
    private Integer localLlmContextSize;

    @JsonView(Views.Public.class)
    @JsonInclude
    private String localLlmModel;

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
        claudeApiKey = ObjectUtils.defaultIfNull(organizationConfiguration.getClaudeApiKey(), claudeApiKey);
        openaiApiKey = ObjectUtils.defaultIfNull(organizationConfiguration.getOpenaiApiKey(), openaiApiKey);
        copilotApiKey = ObjectUtils.defaultIfNull(organizationConfiguration.getCopilotApiKey(), copilotApiKey);
        aiProvider = ObjectUtils.defaultIfNull(organizationConfiguration.getAiProvider(), aiProvider);
        isAIAssistantEnabled =
                ObjectUtils.defaultIfNull(organizationConfiguration.getIsAIAssistantEnabled(), isAIAssistantEnabled);
        localLlmUrl = ObjectUtils.defaultIfNull(organizationConfiguration.getLocalLlmUrl(), localLlmUrl);
        localLlmContextSize =
                ObjectUtils.defaultIfNull(organizationConfiguration.getLocalLlmContextSize(), localLlmContextSize);
        localLlmModel = ObjectUtils.defaultIfNull(organizationConfiguration.getLocalLlmModel(), localLlmModel);
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
