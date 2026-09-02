package com.appsmith.server.domains;

import lombok.Data;
import org.apache.commons.lang3.ObjectUtils;

import java.io.Serializable;

/**
 * Organization-owned MCP policy. All admin-facing MCP switches live here; the only remaining env var is
 * {@code APPSMITH_MCP_INTERNAL_SECRET} (install-time, never persisted on the organization).
 *
 * <p>Every flag is boxed. {@code null} and {@code false} both mean off — only {@link Boolean#TRUE} enables a
 * capability. Token lifetime is per-key ({@code keySpanDays}), not an org setting.
 */
@Data
public class McpConfig implements Serializable {

    private Boolean enabled;

    private Boolean dataEnabled;

    private String serverUrl;

    public void copyNonSensitiveValues(McpConfig source) {
        if (source == null) {
            return;
        }
        enabled = ObjectUtils.defaultIfNull(source.getEnabled(), enabled);
        dataEnabled = ObjectUtils.defaultIfNull(source.getDataEnabled(), dataEnabled);
        serverUrl = ObjectUtils.defaultIfNull(source.getServerUrl(), serverUrl);
    }
}
