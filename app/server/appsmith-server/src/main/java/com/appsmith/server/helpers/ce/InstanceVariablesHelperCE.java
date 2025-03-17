package com.appsmith.server.helpers.ce;

import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.services.ConfigService;
import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

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
            Object value = instanceVariables.getOrDefault("instanceName", Appsmith.DEFAULT_INSTANCE_NAME);
            return value != null ? value.toString() : Appsmith.DEFAULT_INSTANCE_NAME;
        });
    }

    /**
     * Get the email verification enabled flag from the instance variables
     * @return True if email verification is enabled, false otherwise
     */
    public Mono<Boolean> isEmailVerificationEnabled() {
        return configService.getInstanceVariables().map(instanceVariables -> {
            Object value = instanceVariables.getOrDefault("emailVerificationEnabled", false);
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
            Object value = instanceVariables.getOrDefault("googleMapsKey", "");
            return value != null ? value.toString() : "";
        });
    }
}
