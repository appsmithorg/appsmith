package com.appsmith.server.controllers.ce;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.constants.ce.McpEnvGate;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenCreateRequestDTO;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.UserMcpTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import reactor.core.publisher.Mono;

import java.util.List;

@RequiredArgsConstructor
public class McpTokenControllerCE {

    private final UserMcpTokenService userMcpTokenService;

    // Same allow-list gate and default (OFF) as SecurityConfig and the deploy scripts. Setter-injected rather than
    // constructor-injected so the existing @RequiredArgsConstructor wiring and its unit tests stay unchanged.
    private String mcpEnabledFlag;

    @Value("${APPSMITH_MCP_ENABLED:false}")
    public void setMcpEnabledFlag(String mcpEnabledFlag) {
        this.mcpEnabledFlag = mcpEnabledFlag;
    }

    // Delegates to the one shared definition of the gate (see McpEnvGate) so this minting guard and the bearer-auth
    // filter in SecurityConfig cannot drift apart about what "enabled" means.
    private boolean isMcpEnabled() {
        return McpEnvGate.isEnabled(mcpEnabledFlag);
    }

    /**
     * Refuses to hand out a bearer secret while MCP is switched off.
     *
     * <p>An issued token cannot authenticate when MCP is disabled (SecurityConfig evaluates the same gate per
     * request), so minting one would only produce a credential that silently fails — and would leave live secrets
     * lying around to become usable the moment an admin ever enables MCP. Creating and rotating are therefore
     * blocked, while {@code list} and {@code revoke} stay available so a user can still see and clean up tokens
     * issued before the instance was switched off.
     */
    private Mono<Void> requireMcpEnabled() {
        return isMcpEnabled() ? Mono.empty() : Mono.error(new AppsmithException(AppsmithError.MCP_NOT_ENABLED));
    }

    @PostMapping
    public Mono<ResponseDTO<McpTokenResponseDTO>> create(
            @AuthenticationPrincipal User user, @RequestBody(required = false) McpTokenCreateRequestDTO request) {
        // The body (and the name within it) is optional; a blank name is defaulted server-side.
        String name = request == null ? null : request.name();
        return requireMcpEnabled()
                .then(requireSessionAuthentication())
                // Deferred so a rejected guard never even invokes the service (an eager argument is
                // evaluated while assembling the chain, which made the guard cosmetic rather than real).
                .then(Mono.defer(() -> userMcpTokenService.create(user, name)))
                .map(token -> new ResponseDTO<>(HttpStatus.CREATED, token));
    }

    @PostMapping("/{tokenId}/rotate")
    public Mono<ResponseDTO<McpTokenResponseDTO>> rotate(
            @AuthenticationPrincipal User user, @PathVariable String tokenId) {
        // Rotation returns a replacement bearer secret, so MCP-authenticated calls must not be able to use a leaked
        // token to perpetuate access beyond its intended revocation window.
        return requireMcpEnabled()
                .then(requireSessionAuthentication())
                .then(Mono.defer(() -> userMcpTokenService.rotate(user, tokenId)))
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

    /**
     * Returns the caller's tokens in the single-envelope shape every other list endpoint uses:
     * {@code Mono<ResponseDTO<List<T>>>}, i.e. one {@code responseMeta} wrapping the whole list.
     *
     * <p>This previously returned {@code Flux<ResponseDTO<McpTokenResponseDTO>>}, which serializes to a bare JSON
     * array of N envelopes and was the only such signature in the server. The client's global response interceptor
     * looks for a top-level {@code responseMeta} and reports "Api responded without response meta" to telemetry
     * when it is missing, so every token-list load raised a spurious error; an empty list also degenerated to
     * {@code []} with no envelope at all, leaving nothing to check for success.
     */
    @GetMapping
    public Mono<ResponseDTO<List<McpTokenResponseDTO>>> list(@AuthenticationPrincipal User user) {
        // Token management is session-only: an MCP-authenticated caller must not be able to enumerate a user's tokens.
        return requireSessionAuthentication()
                .then(Mono.defer(() -> userMcpTokenService.list(user).collectList()))
                .map(tokens -> new ResponseDTO<>(HttpStatus.OK, tokens));
    }

    @DeleteMapping("/{tokenId}")
    public Mono<ResponseDTO<Boolean>> revoke(@AuthenticationPrincipal User user, @PathVariable String tokenId) {
        // Revocation changes access state, so — like create/rotate — it must not be reachable with an MCP token.
        return requireSessionAuthentication()
                .then(Mono.defer(() -> userMcpTokenService.revoke(user, tokenId)))
                .map(revoked -> new ResponseDTO<>(revoked ? HttpStatus.OK : HttpStatus.NOT_FOUND, revoked));
    }
}
