package com.appsmith.server.helpers.ce;

import java.util.Set;

public class BlacklistedEnvVariableHelperCEImpl implements BlacklistedEnvVariableHelperCE {
    @Override
    public Set<String> getBlacklistedEnvVariableForAppsmithCloud(String organizationId) {
        return Set.of();
    }
}
