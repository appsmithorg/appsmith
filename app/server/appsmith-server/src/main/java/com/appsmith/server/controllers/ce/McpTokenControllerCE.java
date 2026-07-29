package com.appsmith.server.controllers.ce;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenCreateRequestDTO;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.UserMcpTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class McpTokenControllerCE {

    private final UserMcpTokenService userMcpTokenService;

    @PostMapping
    public Mono<ResponseDTO<McpTokenResponseDTO>> create(
            @AuthenticationPrincipal User user, @RequestBody(required = false) McpTokenCreateRequestDTO request) {
        // The body (and the name within it) is optional; a blank name is defaulted server-side.
        String name = request == null ? null : request.name();
        return requireSessionAuthentication()
                .then(userMcpTokenService.create(user, name))
                .map(token -> new ResponseDTO<>(HttpStatus.CREATED, token));
    }

    @PostMapping("/{tokenId}/rotate")
    public Mono<ResponseDTO<McpTokenResponseDTO>> rotate(
            @AuthenticationPrincipal User user, @PathVariable String tokenId) {
        // Rotation returns a replacement bearer secret, so MCP-authenticated calls must not be able to use a leaked
        // token to perpetuate access beyond its intended revocation window.
        return requireSessionAuthentication()
                .then(userMcpTokenService.rotate(user, tokenId))
                .map(token -> new ResponseDTO<>(HttpStatus.OK, token));
    }

    /**
     * Rejects a caller that authenticated with an MCP token, so token management stays session-only.
     *
     * <p>This is the second of two independent layers, not the primary one. {@link
     * com.appsmith.server.filters.McpAllowlistWebFilter} is what normally stops an MCP principal here: its allowlist
     * omits this controller's paths entirely and fails closed, so such a request is refused before routing. That
     * filter is the right place for the rule and already carries the test coverage.
     *
     * <p>The check is repeated here because the two layers fail differently. The filter enforces by omission — a path
     * is protected only for as long as nobody adds it to the allowlist to unblock some future tool — whereas this
     * states the constraint on the endpoints it actually protects, where it cannot be undone by an unrelated edit.
     * Token minting and rotation hand out bearer secrets, so a silent regression there is worth a duplicated guard.
     */
    private Mono<Void> requireSessionAuthentication() {
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> McpTokenAuthentication.isMcpPrincipal(context.getAuthentication()))
                .defaultIfEmpty(false)
                .flatMap(mcpAuthenticated -> mcpAuthenticated
                        ? Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS))
                        : Mono.empty());
    }

    @GetMapping
    public Flux<ResponseDTO<McpTokenResponseDTO>> list(@AuthenticationPrincipal User user) {
        // Token management is session-only: an MCP-authenticated caller must not be able to enumerate a user's tokens.
        return requireSessionAuthentication()
                .thenMany(userMcpTokenService.list(user).map(token -> new ResponseDTO<>(HttpStatus.OK, token)));
    }

    @DeleteMapping("/{tokenId}")
    public Mono<ResponseDTO<Boolean>> revoke(@AuthenticationPrincipal User user, @PathVariable String tokenId) {
        // Revocation changes access state, so — like create/rotate — it must not be reachable with an MCP token.
        return requireSessionAuthentication()
                .then(userMcpTokenService.revoke(user, tokenId))
                .map(revoked -> new ResponseDTO<>(revoked ? HttpStatus.OK : HttpStatus.NOT_FOUND, revoked));
    }
}
