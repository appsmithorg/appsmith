package com.appsmith.server.domains;

import lombok.Data;
import org.apache.commons.lang3.ObjectUtils;

import java.io.Serializable;

/**
 * Organization-owned MCP policy. The only admin-facing switch is {@code enabled}; the only remaining env var is
 * {@code APPSMITH_MCP_INTERNAL_SECRET} (install-time, never persisted on the organization).
 *
 * <p>{@code enabled} is boxed. {@code null} and {@code false} both mean off — only {@link Boolean#TRUE} enables MCP.
 * Token lifetime is per-key ({@code keySpanDays}), not an org setting.
 */
@Data
public class McpConfig implements Serializable {

    private Boolean enabled;

    public void copyNonSensitiveValues(McpConfig source) {
        if (source == null) {
            return;
        }
        enabled = ObjectUtils.defaultIfNull(source.getEnabled(), enabled);
    }
}
