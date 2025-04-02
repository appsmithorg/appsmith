package com.appsmith.server.instanceconfigs.helpers;

import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.domains.OrganizationConfiguration;
import com.appsmith.server.services.ConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.instanceconfigs.constants.AllowedInstanceVariables.EMAIL_VERIFICATION_ENABLED;
import static com.appsmith.server.instanceconfigs.constants.AllowedInstanceVariables.GOOGLE_MAPS_KEY;
import static com.appsmith.server.instanceconfigs.constants.AllowedInstanceVariables.INSTANCE_NAME;

/**
 * Helper class for accessing instance variables from the instance config
 */
@RequiredArgsConstructor
public class InstanceVariablesHelperCE {
    private final ConfigService configService;

    /**
     * Get the instance name from the instance variables
     * @return The instance name, or the default instance name if not set
     */
    public Mono<String> getInstanceName() {
        return configService.getInstanceVariables().map(instanceVariables -> {
            Object value = instanceVariables.getOrDefault(INSTANCE_NAME, Appsmith.DEFAULT_INSTANCE_NAME);
            return value != null ? value.toString() : Appsmith.DEFAULT_INSTANCE_NAME;
        });
    }

    /**
     * Get the email verification enabled flag from the instance variables
     * @return True if email verification is enabled, false otherwise
     */
    public Mono<Boolean> isEmailVerificationEnabled() {
        return configService.getInstanceVariables().map(instanceVariables -> {
            Object value = instanceVariables.getOrDefault(EMAIL_VERIFICATION_ENABLED, false);
            if (value instanceof Boolean) {
                return (Boolean) value;
            }
            return Boolean.FALSE;
        });
    }

    /**
     * Get the Google Maps API key from the instance variables
     * @return The Google Maps API key, or an empty string if not set
     */
    public Mono<String> getGoogleMapsKey() {
        return configService.getInstanceVariables().map(instanceVariables -> {
            Object value = instanceVariables.getOrDefault(GOOGLE_MAPS_KEY, "");
            return value != null ? value.toString() : "";
        });
    }

    public OrganizationConfiguration populateOrgConfigWithInstanceVariables(
            Map<String, Object> instanceVariables, OrganizationConfiguration organizationConfiguration) {
        Object value = instanceVariables.getOrDefault(INSTANCE_NAME, Appsmith.DEFAULT_INSTANCE_NAME);
        organizationConfiguration.setInstanceName(value != null ? value.toString() : Appsmith.DEFAULT_INSTANCE_NAME);

        value = instanceVariables.getOrDefault(EMAIL_VERIFICATION_ENABLED, false);
        if (value instanceof Boolean) {
            organizationConfiguration.setEmailVerificationEnabled((Boolean) value);
        } else {
            organizationConfiguration.setEmailVerificationEnabled(Boolean.FALSE);
        }

        value = instanceVariables.getOrDefault(GOOGLE_MAPS_KEY, "");
        organizationConfiguration.setGoogleMapsKey(value != null ? value.toString() : "");

        return organizationConfiguration;
    }

    // TODO @CloudBilling: Temporary method to update instance variables via organization configuration. This method
    //  will be removed once the instance variables will be removed from organization configuration
    public Mono<OrganizationConfiguration> updateInstanceVariables(OrganizationConfiguration orgConfig) {

        Map<String, Object> updatedInstanceVariables = updateAllowedInstanceVariables(orgConfig);
        return configService.getInstanceVariables().flatMap(instanceVariable -> {
            instanceVariable.putAll(updatedInstanceVariables);
            return configService.updateInstanceVariables(instanceVariable).thenReturn(orgConfig);
        });
    }

    protected Map<String, Object> updateAllowedInstanceVariables(OrganizationConfiguration orgConfig) {
        Map<String, Object> instanceVariables = new HashMap<>();
        if (StringUtils.hasLength(orgConfig.getInstanceName())) {
            instanceVariables.put(INSTANCE_NAME, orgConfig.getInstanceName());
        }
        if (orgConfig.getEmailVerificationEnabled() != null) {
            instanceVariables.put(EMAIL_VERIFICATION_ENABLED, orgConfig.getEmailVerificationEnabled());
        }
        if (StringUtils.hasLength(orgConfig.getGoogleMapsKey())) {
            instanceVariables.put(GOOGLE_MAPS_KEY, orgConfig.getGoogleMapsKey());
        }
        return instanceVariables;
    }
}
