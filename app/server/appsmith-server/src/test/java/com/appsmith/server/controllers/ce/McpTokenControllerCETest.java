package com.appsmith.server.controllers.ce;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenCreateRequestDTO;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.UserMcpTokenService;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
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
    private UserMcpTokenService userMcpTokenService;

    private McpTokenControllerCE controller;
    private User user;

    @BeforeEach
    void setUp() {
        controller = new McpTokenControllerCE(userMcpTokenService);
        // These tests exercise the session-vs-MCP principal guard, so MCP is enabled here; the separate
        // instance-disabled behaviour is covered by its own tests below.
        controller.setMcpEnabledFlag("true");
        user = new User();
        user.setId("user-id");
    }

    /** A controller with MCP switched off at the instance level (the shipped default). */
    private McpTokenControllerCE disabledController(String flagValue) {
        McpTokenControllerCE disabled = new McpTokenControllerCE(userMcpTokenService);
        disabled.setMcpEnabledFlag(flagValue);
        return disabled;
    }

    @Test
    void create_isRefusedWhenMcpIsDisabledOnTheInstance() {
        // A token minted while MCP is off could not authenticate (SecurityConfig evaluates the same gate per
        // request), so issuing one would only leave a live secret lying around to become usable if MCP is ever
        // enabled. The service must never be reached.
        AtomicBoolean minted = new AtomicBoolean(false);

        StepVerifier.create(disabledController("false")
                        .create(user, new McpTokenCreateRequestDTO("Claude"))
                        .doOnNext(ignored -> minted.set(true))
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .expectErrorSatisfies(error -> assertThat(error)
                        .isInstanceOf(AppsmithException.class)
                        .hasMessageContaining("MCP server is not enabled"))
                .verify();

        assertThat(minted).isFalse();
        verify(userMcpTokenService, never()).create(any(), any());
    }

    @Test
    void rotate_isRefusedWhenMcpIsDisabledOnTheInstance() {
        StepVerifier.create(disabledController("false")
                        .rotate(user, "token-id")
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .expectErrorSatisfies(error -> assertThat(error).isInstanceOf(AppsmithException.class))
                .verify();

        verify(userMcpTokenService, never()).rotate(any(), any());
    }

    @Test
    void create_isRefusedWhenTheGateIsAbsentOrUnrecognized() {
        // Allow-list semantics: absent, blank, and unrecognized values all mean disabled, so a typo in docker.env
        // fails safe rather than quietly enabling token minting.
        for (String flag : new String[] {null, "", "   ", "banana", "yes-please", "0", "off"}) {
            StepVerifier.create(disabledController(flag)
                            .create(user, null)
                            .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                    .expectError(AppsmithException.class)
                    .verify();
        }

        verify(userMcpTokenService, never()).create(any(), any());
    }

    @Test
    void listAndRevoke_remainAvailableWhenMcpIsDisabled() {
        // Deliberately NOT gated: a user must still be able to see and clean up tokens that were issued before an
        // admin switched MCP off. Neither hands out a secret.
        McpTokenControllerCE disabled = disabledController("false");

        when(userMcpTokenService.list(user)).thenReturn(Flux.empty());
        when(userMcpTokenService.revoke(user, "token-id")).thenReturn(Mono.just(true));

        StepVerifier.create(disabled.list(user)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .verifyComplete();

        StepVerifier.create(disabled.revoke(user, "token-id")
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .assertNext(response -> assertThat(response.getData()).isTrue())
                .verifyComplete();
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
                Instant.now().plusSeconds(60));
    }

    @Test
    void create_underSessionAuth_delegatesAndReturnsCreated() {
        when(userMcpTokenService.create(eq(user), any())).thenReturn(Mono.just(token("t1")));

        StepVerifier.create(controller
                        .create(user, null)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .assertNext(response -> {
                    assertThat(response.getResponseMeta().getStatus()).isEqualTo(HttpStatus.CREATED.value());
                    assertThat(response.getData().id()).isEqualTo("t1");
                })
                .verifyComplete();
    }

    @Test
    void create_forwardsRequestNameToService() {
        when(userMcpTokenService.create(eq(user), eq("Claude Desktop"))).thenReturn(Mono.just(token("t1")));

        StepVerifier.create(controller
                        .create(user, new McpTokenCreateRequestDTO("Claude Desktop"))
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .expectNextCount(1)
                .verifyComplete();

        verify(userMcpTokenService).create(eq(user), eq("Claude Desktop"));
    }

    @Test
    void create_withNoBody_forwardsNullName() {
        when(userMcpTokenService.create(eq(user), eq(null))).thenReturn(Mono.just(token("t1")));

        StepVerifier.create(controller
                        .create(user, null)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .expectNextCount(1)
                .verifyComplete();

        verify(userMcpTokenService).create(eq(user), eq(null));
    }

    @Test
    void create_underMcpAuth_isRejectedAndNeverMints() {
        // The session guard rejects before the mint Mono is subscribed; the flag proves no minting happened.
        AtomicBoolean minted = new AtomicBoolean(false);
        lenient().when(userMcpTokenService.create(eq(user), any())).thenReturn(Mono.fromCallable(() -> {
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
        lenient().when(userMcpTokenService.rotate(user, "t1")).thenReturn(Mono.fromCallable(() -> {
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
        when(userMcpTokenService.rotate(user, "t1")).thenReturn(Mono.just(token("t1")));

        StepVerifier.create(controller
                        .rotate(user, "t1")
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .assertNext(response ->
                        assertThat(response.getResponseMeta().getStatus()).isEqualTo(HttpStatus.OK.value()))
                .verifyComplete();
    }

    @Test
    void list_underSessionAuth_delegatesToService() {
        when(userMcpTokenService.list(user)).thenReturn(Flux.just(token("t1"), token("t2")));

        StepVerifier.create(controller
                        .list(user)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .expectNextCount(2)
                .verifyComplete();
    }

    @Test
    void list_underMcpAuth_isRejectedAndNeverEnumerates() {
        // The session guard rejects before the list Flux is subscribed; the flag proves no enumeration happened.
        AtomicBoolean listed = new AtomicBoolean(false);
        lenient().when(userMcpTokenService.list(user)).thenReturn(Flux.defer(() -> {
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
        when(userMcpTokenService.revoke(user, "t1")).thenReturn(Mono.just(true));
        when(userMcpTokenService.revoke(user, "missing")).thenReturn(Mono.just(false));

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
        lenient().when(userMcpTokenService.revoke(user, "t1")).thenReturn(Mono.fromCallable(() -> {
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
