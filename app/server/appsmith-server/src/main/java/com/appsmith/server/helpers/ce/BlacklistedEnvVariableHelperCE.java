package com.appsmith.server.helpers.ce;

import java.util.Set;

public interface BlacklistedEnvVariableHelperCE {
    Set<String> getBlacklistedEnvVariableForAppsmithCloud(String organizationId);
}
