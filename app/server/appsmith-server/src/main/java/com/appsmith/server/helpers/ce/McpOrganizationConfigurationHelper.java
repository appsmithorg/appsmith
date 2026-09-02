package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.McpConfig;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URISyntaxException;

import static java.lang.Boolean.TRUE;

/**
 * Validates organization MCP policy updates. Instance-only fields ({@code dataEnabled}, {@code serverUrl})
 * are accepted only on single-org deployments.
 */
public final class McpOrganizationConfigurationHelper {

    private McpOrganizationConfigurationHelper() {}

    public static void validate(McpConfig incoming, McpConfig existing, boolean isMultiOrg) {
        if (incoming == null) {
            return;
        }

        if (isMultiOrg) {
            if (incoming.getDataEnabled() != null || incoming.getServerUrl() != null) {
                throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "mcpConfig");
            }
        }

        if (StringUtils.hasText(incoming.getServerUrl())) {
            validateServerUrl(incoming.getServerUrl());
        }

        boolean enabled = isEnabled(incoming, existing);
        if (TRUE.equals(incoming.getDataEnabled()) && !enabled) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "mcpConfig.dataEnabled");
        }
    }

    public static boolean isEnabled(McpConfig incoming, McpConfig existing) {
        if (incoming != null && incoming.getEnabled() != null) {
            return TRUE.equals(incoming.getEnabled());
        }
        return existing != null && TRUE.equals(existing.getEnabled());
    }

    public static boolean isExplicitEnable(McpConfig incoming) {
        return incoming != null && TRUE.equals(incoming.getEnabled());
    }

    public static boolean isExplicitDisable(McpConfig incoming) {
        return incoming != null && incoming.getEnabled() != null && !TRUE.equals(incoming.getEnabled());
    }

    static void validateServerUrl(String serverUrl) {
        final URI uri;
        try {
            uri = new URI(serverUrl);
        } catch (URISyntaxException e) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "mcpConfig.serverUrl");
        }
        if (uri.getScheme() == null
                || uri.getHost() == null
                || (!"http".equalsIgnoreCase(uri.getScheme()) && !"https".equalsIgnoreCase(uri.getScheme()))) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, "mcpConfig.serverUrl");
        }
    }
}
