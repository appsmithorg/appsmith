package com.appsmith.server.domains;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class McpConfigTest {

    @Test
    void copyNonSensitiveValues_mergesNonNullFieldsAndLeavesUnsetSiblings() {
        McpConfig existing = new McpConfig();
        existing.setEnabled(true);

        McpConfig patch = new McpConfig();
        patch.setEnabled(false);
        existing.copyNonSensitiveValues(patch);
        assertThat(existing.getEnabled()).isFalse();
    }

    @Test
    void copyNonSensitiveValues_nullSourceIsNoOp() {
        McpConfig existing = new McpConfig();
        existing.setEnabled(true);

        existing.copyNonSensitiveValues(null);

        assertThat(existing.getEnabled()).isTrue();
    }
}
