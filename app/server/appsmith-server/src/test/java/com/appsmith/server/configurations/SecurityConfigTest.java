package com.appsmith.server.configurations;

import com.appsmith.server.authentication.converters.McpTokenAuthenticationConverter;
import com.appsmith.server.filters.McpAllowlistWebFilter;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.McpTokenService;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.web.server.authentication.ServerAuthenticationFailureHandler;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ServerWebExchange;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class SecurityConfigTest {

    private static ServerWebExchange exchangeWithBearer(String authorization) {
        MockServerHttpRequest.BaseBuilder<?> builder = MockServerHttpRequest.get("/api/v1/actions");
        if (authorization != null) {
            builder.header(HttpHeaders.AUTHORIZATION, authorization);
        }
        return MockServerWebExchange.from(builder.build());
    }

    @Test
    void filterIsInertForNonMcpRequests() {
        SecurityConfig config = new SecurityConfig();

        // A session/form request (no bearer) and a non-mcp bearer must not engage the MCP filter — this is what keeps
        // the form-login flow untouched.
        assertThat(config.isMcpAuthenticationRequest(exchangeWithBearer(null))).isFalse();
        assertThat(config.isMcpAuthenticationRequest(exchangeWithBearer("Bearer other_token")))
                .isFalse();
        assertThat(config.isMcpAuthenticationRequest(exchangeWithBearer("Bearer mcp_abc.def")))
                .isTrue();
    }

    /**
     * The MCP bearer filter and the MCP allowlist filter are ONE control in two halves, and they must never be
     * registered apart. The authenticator turns an {@code mcp_} bearer into a full user principal; the allowlist is
     * the only thing capping which endpoints that principal may reach. Ship the authenticator alone and every issued
     * MCP token silently becomes an unrestricted, long-lived API credential for its owner.
     * <p>
     * Neither filter is a {@code @Component} — both are constructed inside {@code securityWebFilterChain}, so nothing
     * but this assertion stops a hand-merge from keeping one and dropping the other. That matters most on the CE→EE
     * sync, where {@code SecurityConfig} is a fully diverged file: this test travels with the sync, so it fails in EE
     * too if the port lands only half the control.
     */
    @Test
    void mcpAuthenticationFilterIsNeverBuiltWithoutItsAllowlistFilter() {
        SecurityConfig config = new SecurityConfig();
        ReflectionTestUtils.setField(config, "rateLimitService", mock(RateLimitService.class));

        SecurityConfig.McpSecurityFilters filters = config.buildMcpSecurityFilters(
                mock(McpTokenService.class),
                mock(McpTokenAuthenticationConverter.class),
                mock(ServerAuthenticationFailureHandler.class));

        assertThat(filters.authentication())
                .as("the MCP bearer AuthenticationWebFilter must be produced")
                .isNotNull();
        assertThat(filters.allowlist())
                .as("McpAllowlistWebFilter MUST accompany the MCP authenticator — without it an mcp_ token is an "
                        + "uncapped API credential across all of /api/v1")
                .isNotNull();
    }

    @Test
    void mcpFilterFactoryExposesNoWayToObtainOneFilterWithoutTheOther() {
        // The structural half of the guarantee above: McpSecurityFilters carries BOTH filters and there is no
        // constructor, factory, or accessor that yields the authenticator alone. If someone later adds one — or
        // splits the record — this fails and forces the security question to be asked again, including on the
        // CE→EE sync where SecurityConfig is hand-merged.
        assertThat(SecurityConfig.McpSecurityFilters.class.getRecordComponents())
                .extracting(java.lang.reflect.RecordComponent::getType)
                .containsExactlyInAnyOrder(AuthenticationWebFilter.class, McpAllowlistWebFilter.class);

        assertThat(SecurityConfig.class.getDeclaredMethods())
                .filteredOn(method -> method.getReturnType() == AuthenticationWebFilter.class)
                .as("no method may hand back a bare MCP AuthenticationWebFilter without its allowlist")
                .isEmpty();
    }
}
