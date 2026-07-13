package com.appsmith.server.controllers.ce;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.domains.User;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
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
                id, "mcp_" + id + ".secret", Instant.now(), Instant.now().plusSeconds(60));
    }

    @Test
    void create_underSessionAuth_delegatesAndReturnsCreated() {
        when(userMcpTokenService.create(user)).thenReturn(Mono.just(token("t1")));

        StepVerifier.create(controller
                        .create(user)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(sessionAuthentication())))
                .assertNext(response -> {
                    assertThat(response.getResponseMeta().getStatus()).isEqualTo(HttpStatus.CREATED.value());
                    assertThat(response.getData().id()).isEqualTo("t1");
                })
                .verifyComplete();
    }

    @Test
    void create_underMcpAuth_isRejectedAndNeverMints() {
        StepVerifier.create(controller
                        .create(user)
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpAuthentication())))
                .verifyError(AppsmithException.class);

        verify(userMcpTokenService, never()).create(user);
    }

    @Test
    void rotate_underMcpAuth_isRejectedAndNeverRotates() {
        StepVerifier.create(controller
                        .rotate(user, "t1")
                        .contextWrite(ReactiveSecurityContextHolder.withAuthentication(mcpAuthentication())))
                .verifyError(AppsmithException.class);

        verify(userMcpTokenService, never()).rotate(eq(user), eq("t1"));
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
    void list_delegatesToService() {
        when(userMcpTokenService.list(user)).thenReturn(Flux.just(token("t1"), token("t2")));

        StepVerifier.create(controller.list(user)).expectNextCount(2).verifyComplete();
    }

    @Test
    void revoke_returnsOkWhenRevokedAndNotFoundOtherwise() {
        when(userMcpTokenService.revoke(user, "t1")).thenReturn(Mono.just(true));
        when(userMcpTokenService.revoke(user, "missing")).thenReturn(Mono.just(false));

        StepVerifier.create(controller.revoke(user, "t1"))
                .assertNext(response -> {
                    assertThat(response.getResponseMeta().getStatus()).isEqualTo(HttpStatus.OK.value());
                    assertThat(response.getData()).isTrue();
                })
                .verifyComplete();

        StepVerifier.create(controller.revoke(user, "missing"))
                .assertNext(response ->
                        assertThat(response.getResponseMeta().getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value()))
                .verifyComplete();
    }
}
