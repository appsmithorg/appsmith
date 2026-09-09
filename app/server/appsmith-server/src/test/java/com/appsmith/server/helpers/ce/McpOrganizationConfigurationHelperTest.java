package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.McpConfig;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class McpOrganizationConfigurationHelperTest {

    @Test
    void treatsIncomingEnabledTrueAsExplicitEnable() {
        McpConfig incoming = new McpConfig();
        incoming.setEnabled(true);

        assertThat(McpOrganizationConfigurationHelper.isExplicitEnable(incoming))
                .isTrue();
        assertThat(McpOrganizationConfigurationHelper.isExplicitDisable(incoming))
                .isFalse();
        assertThat(McpOrganizationConfigurationHelper.isExplicitEnable(null)).isFalse();
        assertThat(McpOrganizationConfigurationHelper.isExplicitEnable(new McpConfig()))
                .isFalse();
    }

    @Test
    void treatsIncomingEnabledFalseAsExplicitDisable() {
        McpConfig incoming = new McpConfig();
        incoming.setEnabled(false);

        assertThat(McpOrganizationConfigurationHelper.isExplicitDisable(incoming))
                .isTrue();
        assertThat(McpOrganizationConfigurationHelper.isExplicitEnable(incoming))
                .isFalse();
        assertThat(McpOrganizationConfigurationHelper.isEnabled(incoming, enabledConfig()))
                .isFalse();
    }

    @Test
    void isEnabled_fallsBackToExistingWhenIncomingEnabledIsUnset() {
        McpConfig incoming = new McpConfig();

        assertThat(McpOrganizationConfigurationHelper.isEnabled(incoming, enabledConfig()))
                .isTrue();
        assertThat(McpOrganizationConfigurationHelper.isEnabled(incoming, null)).isFalse();
        assertThat(McpOrganizationConfigurationHelper.isEnabled(null, enabledConfig()))
                .isTrue();
    }

    private static McpConfig enabledConfig() {
        McpConfig existing = new McpConfig();
        existing.setEnabled(true);
        return existing;
    }
}
