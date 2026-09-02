package com.appsmith.server.controllers.ce;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenCreateRequestDTO;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.enums.McpKeyStatus;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.McpTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Controller-level tests for the MCP token endpoints. Focus: the session-authentication guard that prevents an
 * MCP-authenticated principal (a bearer token) from minting or rotating tokens — the credential-persistence control
 * that keeps a leaked token from outliving its own revocation.
 */
@ExtendWith(MockitoExtension.class)
class McpTokenControllerCETest {

    @Mock
    private McpTokenService mcpTokenService;

    private McpTokenControllerCE controller;
    private User user;

    @BeforeEach
    void setUp() {
        controller = new McpTokenControllerCE(mcpTokenService);
        user = new User();
        user.setId("user-id");
    }

    private static Authentication sessionAuthentication() {
        return new UsernamePasswordAuthenticationToken("user", null, List.of());
    }

    private static Authentication mcpAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                "user", null, List.of(new SimpleGrantedAuthority(McpTokenAuthentication.MCP_AUTHORITY)));
    }

    private static McpTokenResponseDTO token(String id) {
        return new McpTokenResponseDTO(
                id,
                "mcp_" + id + ".secret",
                "My token",
                Instant.now(),
                Instant.now().plusSeconds(60),
                McpKeyStatus.ACTIVE);
    }

    @Test
    void create_delegatesNameAndKeySpanDays() {
        when(mcpTokenService.create(eq(user), eq("Claude Desktop"), eq(90))).thenReturn(Mono.just(token("t1")));

        StepVerifier.create(controller
                        .create(user, new McpTokenCreateRequestDTO("Claude Desktop", 90))
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .assertNext(response -> {
                    assertThat(response.getResponseMeta().getStatus()).isEqualTo(HttpStatus.CREATED.value());
                    assertThat(response.getData().id()).isEqualTo("t1");
                })
                .verifyComplete();
    }

    @Test
    void create_withNoBody_forwardsNulls() {
        when(mcpTokenService.create(eq(user), isNull(), isNull())).thenReturn(Mono.just(token("t1")));

        StepVerifier.create(controller
                        .create(user, null)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .expectNextCount(1)
                .verifyComplete();

        verify(mcpTokenService).create(eq(user), isNull(), isNull());
    }

    @Test
    void create_underMcpAuth_isRejectedAndNeverMints() {
        AtomicBoolean minted = new AtomicBoolean(false);
        lenient().when(mcpTokenService.create(eq(user), isNull(), isNull())).thenReturn(Mono.fromCallable(() -> {
            minted.set(true);
            return token("t1");
        }));

        StepVerifier.create(controller
                        .create(user, null)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpAuthentication())))
                .verifyError(AppsmithException.class);

        assertThat(minted).isFalse();
    }

    @Test
    void rotate_underMcpAuth_isRejectedAndNeverRotates() {
        AtomicBoolean rotated = new AtomicBoolean(false);
        lenient().when(mcpTokenService.rotate(user, "t1")).thenReturn(Mono.fromCallable(() -> {
            rotated.set(true);
            return token("t1");
        }));

        StepVerifier.create(controller
                        .rotate(user, "t1")
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpAuthentication())))
                .verifyError(AppsmithException.class);

        assertThat(rotated).isFalse();
    }

    @Test
    void rotate_underSessionAuth_delegatesAndReturnsOk() {
        when(mcpTokenService.rotate(user, "t1")).thenReturn(Mono.just(token("t1")));

        StepVerifier.create(controller
                        .rotate(user, "t1")
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .assertNext(response ->
                        assertThat(response.getResponseMeta().getStatus()).isEqualTo(HttpStatus.OK.value()))
                .verifyComplete();
    }

    @Test
    void list_underSessionAuth_delegatesToService() {
        when(mcpTokenService.list(user)).thenReturn(Flux.just(token("t1"), token("t2")));

        StepVerifier.create(controller
                        .list(user)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .assertNext(response -> {
                    assertThat(response.getResponseMeta().getStatus()).isEqualTo(HttpStatus.OK.value());
                    assertThat(response.getData()).hasSize(2);
                })
                .verifyComplete();
    }

    @Test
    void list_underMcpAuth_isRejectedAndNeverEnumerates() {
        AtomicBoolean listed = new AtomicBoolean(false);
        lenient().when(mcpTokenService.list(user)).thenReturn(Flux.defer(() -> {
            listed.set(true);
            return Flux.just(token("t1"));
        }));

        StepVerifier.create(controller
                        .list(user)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpAuthentication())))
                .verifyError(AppsmithException.class);

        assertThat(listed).isFalse();
    }

    @Test
    void revoke_underSessionAuth_returnsOkWhenRevokedAndNotFoundOtherwise() {
        when(mcpTokenService.revoke(user, "t1")).thenReturn(Mono.just(true));
        when(mcpTokenService.revoke(user, "missing")).thenReturn(Mono.just(false));

        StepVerifier.create(controller
                        .revoke(user, "t1")
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .assertNext(response -> {
                    assertThat(response.getResponseMeta().getStatus()).isEqualTo(HttpStatus.OK.value());
                    assertThat(response.getData()).isTrue();
                })
                .verifyComplete();

        StepVerifier.create(controller
                        .revoke(user, "missing")
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .assertNext(response ->
                        assertThat(response.getResponseMeta().getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value()))
                .verifyComplete();
    }

    @Test
    void revoke_underMcpAuth_isRejectedAndNeverRevokes() {
        AtomicBoolean revoked = new AtomicBoolean(false);
        lenient().when(mcpTokenService.revoke(user, "t1")).thenReturn(Mono.fromCallable(() -> {
            revoked.set(true);
            return true;
        }));

        StepVerifier.create(controller
                        .revoke(user, "t1")
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpAuthentication())))
                .verifyError(AppsmithException.class);

        assertThat(revoked).isFalse();
    }
}
