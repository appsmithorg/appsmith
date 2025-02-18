package com.appsmith.server.featureflags;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.Set;

/**
 * FeatureFlagIdentityTraits object is used to set the default traits for a user and return the list of flags
 * For older versions of self-hosted code, the `traits` was not present and only list of flags were returned
 * The functionality to set default traits was added later, hence for older instances, traits remains null
 * in the requests to cloud services
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeatureFlagIdentityTraits {
    String instanceId;
    String organizationId;
    Set<String> userIdentifiers;
    Map<String, Object> traits;
    String appsmithVersion;
}
