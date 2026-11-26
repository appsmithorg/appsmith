package com.appsmith.server.git.utils;

import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.server.authentication.tokens.McpTokenAuthentication;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Mono;

import static java.lang.Boolean.FALSE;
import static org.springframework.util.StringUtils.hasText;

/**
 * Refuses a remote-branch or tag checkout for an MCP-token principal.
 *
 * <p>{@code McpAllowlistWebFilter} permits routes by method and path only, so checkout-ref enforces its own rule for an
 * MCP-token principal: an {@code origin/}-prefixed ref name (a remote fetch that creates a new branched artifact) and a
 * tag ref are refused with 403. It applies only when the subscriber's security context holds an MCP-token principal; a
 * session user, or a chain with no security context, passes.
 *
 * <p>Two callers run it. {@code GitRouteAspectCE} runs it before the in-memory Git flow takes the lock or downloads or
 * clones the repository. {@code CentralGitServiceCEImpl.checkoutReference} runs it before the artifact lookup, which
 * covers file-system Git and any caller that does not pass through the aspect.
 *
 * <p>The two shapes are exactly the ones {@code CentralGitServiceCEImpl} dispatches away from the local-branch path
 * ({@code RefType.tag} to {@code checkoutTag}, an {@code origin/} prefix to {@code checkoutRemoteReference}). A new
 * remote dispatch there needs a matching clause here.
 */
@Slf4j
public final class McpCheckoutRefGuard {

    private static final String ORIGIN_PREFIX = "origin/";

    private McpCheckoutRefGuard() {}

    /**
     * Completes empty when the checkout may go ahead, or errors with {@link AppsmithError#UNAUTHORIZED_ACCESS} when an
     * MCP-token principal asks for a remote branch or a tag. A missing DTO, or a branch ref with no name, passes, so
     * the service's own parameter validation reports it.
     */
    public static Mono<Void> rejectRemoteOrTagCheckout(GitRefDTO gitRefDTO) {
        if (gitRefDTO == null) {
            return Mono.empty();
        }

        String refusedShape;
        if (RefType.tag.equals(gitRefDTO.getRefType())) {
            refusedShape = "tag";
        } else if (hasText(gitRefDTO.getRefName()) && gitRefDTO.getRefName().startsWith(ORIGIN_PREFIX)) {
            refusedShape = "remote branch";
        } else {
            return Mono.empty();
        }

        return ReactiveSecurityContextHolder.getContext()
                .map(securityContext -> McpTokenAuthentication.isMcpPrincipal(securityContext.getAuthentication()))
                .defaultIfEmpty(FALSE)
                .flatMap(isMcpPrincipal -> {
                    if (isMcpPrincipal) {
                        log.warn("MCP principal denied checkout: {} refs are not allowed", refusedShape);
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    }
                    return Mono.empty();
                });
    }
}
