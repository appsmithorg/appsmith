package com.appsmith.server.controllers.ce;

import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.McpTokenResponseDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.UserMcpTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class McpTokenControllerCE {

    private final UserMcpTokenService userMcpTokenService;

    @PostMapping
    public Mono<ResponseDTO<McpTokenResponseDTO>> create(@AuthenticationPrincipal User user) {
        return requireSessionAuthentication()
                .then(userMcpTokenService.create(user))
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

    private static boolean isMcpAuthenticated(Authentication authentication) {
        return authentication != null
                && authentication.getAuthorities().stream()
                        .anyMatch(authority -> McpTokenAuthentication.MCP_AUTHORITY.equals(authority.getAuthority()));
    }

    private Mono<Void> requireSessionAuthentication() {
        return ReactiveSecurityContextHolder.getContext()
                .map(context -> isMcpAuthenticated(context.getAuthentication()))
                .defaultIfEmpty(false)
                .flatMap(mcpAuthenticated -> mcpAuthenticated
                        ? Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS))
                        : Mono.empty());
    }

    @GetMapping
    public Flux<ResponseDTO<McpTokenResponseDTO>> list(@AuthenticationPrincipal User user) {
        return userMcpTokenService.list(user).map(token -> new ResponseDTO<>(HttpStatus.OK, token));
    }

    @DeleteMapping("/{tokenId}")
    public Mono<ResponseDTO<Boolean>> revoke(@AuthenticationPrincipal User user, @PathVariable String tokenId) {
        return userMcpTokenService
                .revoke(user, tokenId)
                .map(revoked -> new ResponseDTO<>(revoked ? HttpStatus.OK : HttpStatus.NOT_FOUND, revoked));
    }
}
