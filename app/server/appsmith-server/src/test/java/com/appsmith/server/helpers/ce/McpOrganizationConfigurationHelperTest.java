package com.appsmith.server.helpers.ce;

import com.appsmith.server.domains.McpConfig;
import com.appsmith.server.exceptions.AppsmithException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class McpOrganizationConfigurationHelperTest {

    @Test
    void acceptsSingleOrgFieldsWhenMcpIsEnabled() {
        McpConfig incoming = new McpConfig();
        incoming.setEnabled(true);
        incoming.setDataEnabled(true);
        incoming.setServerUrl("https://appsmith.example/mcp");

        McpOrganizationConfigurationHelper.validate(incoming, null, false);
        assertThat(McpOrganizationConfigurationHelper.isEnabled(incoming, null)).isTrue();
    }

    @Test
    void rejectsInvalidServerUrl() {
        McpConfig incoming = new McpConfig();
        incoming.setEnabled(true);
        incoming.setServerUrl("not-a-url");

        assertThatThrownBy(() -> McpOrganizationConfigurationHelper.validate(incoming, null, false))
                .isInstanceOf(AppsmithException.class)
                .hasMessageContaining("mcpConfig.serverUrl");
    }

    @Test
    void rejectsNonHttpServerUrl() {
        McpConfig incoming = new McpConfig();
        incoming.setEnabled(true);
        incoming.setServerUrl("ftp://appsmith.example/mcp");

        assertThatThrownBy(() -> McpOrganizationConfigurationHelper.validate(incoming, null, false))
                .isInstanceOf(AppsmithException.class)
                .hasMessageContaining("mcpConfig.serverUrl");
    }

    @Test
    void rejectsDataEnabledWhenMcpIsOff() {
        McpConfig incoming = new McpConfig();
        incoming.setDataEnabled(true);

        assertThatThrownBy(() -> McpOrganizationConfigurationHelper.validate(incoming, null, false))
                .isInstanceOf(AppsmithException.class)
                .hasMessageContaining("mcpConfig.dataEnabled");
    }

    @Test
    void rejectsInstanceFieldsOnMultiOrg() {
        McpConfig incoming = new McpConfig();
        incoming.setEnabled(true);
        incoming.setServerUrl("https://appsmith.example/mcp");

        assertThatThrownBy(() -> McpOrganizationConfigurationHelper.validate(incoming, null, true))
                .isInstanceOf(AppsmithException.class)
                .hasMessageContaining("mcpConfig");
    }

    @Test
    void allowsEnableOnlyOnMultiOrg() {
        McpConfig incoming = new McpConfig();
        incoming.setEnabled(true);

        McpOrganizationConfigurationHelper.validate(incoming, null, true);
        assertThat(McpOrganizationConfigurationHelper.isExplicitEnable(incoming))
                .isTrue();
        assertThat(McpOrganizationConfigurationHelper.isExplicitDisable(incoming))
                .isFalse();
    }

    @Test
    void treatsIncomingEnabledTrueAsExplicitEnable() {
        McpConfig incoming = new McpConfig();
        incoming.setEnabled(true);

        assertThat(McpOrganizationConfigurationHelper.isExplicitEnable(incoming))
                .isTrue();
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

    private static McpConfig enabledConfig() {
        McpConfig existing = new McpConfig();
        existing.setEnabled(true);
        return existing;
    }
}
