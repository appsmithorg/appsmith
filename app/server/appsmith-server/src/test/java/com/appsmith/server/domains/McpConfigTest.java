package com.appsmith.server.domains;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class McpConfigTest {

    @Test
    void copyNonSensitiveValues_mergesNonNullFieldsAndLeavesUnsetSiblings() {
        McpConfig existing = new McpConfig();
        existing.setEnabled(true);
        existing.setDataEnabled(true);
        existing.setServerUrl("https://appsmith.example/mcp");

        McpConfig patch = new McpConfig();
        patch.setDataEnabled(false);

        existing.copyNonSensitiveValues(patch);

        assertThat(existing.getEnabled()).isTrue();
        assertThat(existing.getDataEnabled()).isFalse();
        assertThat(existing.getServerUrl()).isEqualTo("https://appsmith.example/mcp");
    }

    @Test
    void copyNonSensitiveValues_nullSourceIsNoOp() {
        McpConfig existing = new McpConfig();
        existing.setEnabled(true);

        existing.copyNonSensitiveValues(null);

        assertThat(existing.getEnabled()).isTrue();
    }
}
