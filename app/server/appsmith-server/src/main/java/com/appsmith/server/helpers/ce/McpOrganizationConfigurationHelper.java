package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.McpConfig;

import static java.lang.Boolean.TRUE;

/**
 * Interprets organization MCP policy updates. The only admin-facing switch is {@code enabled}.
 */
public final class McpOrganizationConfigurationHelper {

    private McpOrganizationConfigurationHelper() {}

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
}
