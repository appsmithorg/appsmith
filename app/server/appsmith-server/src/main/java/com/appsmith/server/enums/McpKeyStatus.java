package com.appsmith.server.enums;

/**
 * User-facing lifecycle of an MCP key, distinct from {@link McpTokenStatus} (which tracks the current secret:
 * ACTIVE / ROTATED / REVOKED). Jackson serializes these as {@code ACTIVE}, {@code REVOKED}, {@code EXPIRED}.
 */
public enum McpKeyStatus {
    ACTIVE,
    REVOKED,
    EXPIRED
}
