package com.appsmith.server.constants.ce;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Pins the truthy/falsy contract of the MCP env gate at its definition rather than only at its call sites.
 *
 * <p>Before this existed, the gate's callers only ever asserted the FALSY matrix, so narrowing the accepted set to
 * just {@code "true"} would have left every test green while diverging from {@code run-mcp.sh},
 * {@code healthcheck.sh}, and {@code caddy-reconfigure.mjs}, which all accept {@code true|1|yes|on}. An operator
 * setting {@code APPSMITH_MCP_ENABLED=1} would then get a running MCP process and a live Caddy route but an inert
 * Java auth filter — every token rejected with 401, and nothing red to show for it.
 */
class McpEnvGateTest {

    @ParameterizedTest
    @ValueSource(strings = {"true", "TRUE", "True", "1", "yes", "YES", "on", "ON", "  true  ", "\ttrue\n"})
    void isEnabled_acceptsEveryRecognizedTruthySpelling(String flag) {
        assertThat(McpEnvGate.isEnabled(flag)).isTrue();
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(
            strings = {
                "",
                "   ",
                "false",
                "FALSE",
                "0",
                "no",
                "off",
                "OFF",
                // Allow-list semantics: an unrecognized value is disabled, so a typo in docker.env fails safe
                // rather than quietly enabling an agent-facing endpoint.
                "banana",
                "yes-please",
                "truthy",
                "true false",
                "enabled"
            })
    void isEnabled_rejectsAbsentBlankFalsyAndUnrecognizedValues(String flag) {
        assertThat(McpEnvGate.isEnabled(flag)).isFalse();
    }

    @Test
    void isEnabled_anchorsTheWholeValueSoAffixesDoNotSlipThrough() {
        // String.matches() anchors the whole region; guard against a future switch to find()/lookingAt().
        assertThat(McpEnvGate.isEnabled("nottrue")).isFalse();
        assertThat(McpEnvGate.isEnabled("true-ish")).isFalse();
        assertThat(McpEnvGate.isEnabled("1000")).isFalse();
        assertThat(McpEnvGate.isEnabled("on/off")).isFalse();
    }
}
