package com.appsmith.server.configurations;

import lombok.NonNull;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.csrf.CookieServerCsrfTokenRepository;
import org.springframework.security.web.server.csrf.CsrfToken;
import org.springframework.security.web.server.csrf.ServerCsrfTokenRequestAttributeHandler;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Set;

import static org.springframework.http.MediaType.APPLICATION_JSON;

/**
 * This component has two purposes:
 * <ol>
 * <li>The CSRFSpec customizer, or in English, responsible for configuring CSRF for our API. Handled by the {@code customize} method.
 * <li>A WebFilter, that ensures the CSRF token Mono actually gets subscribed to. Handled by the {@code filter} method.
 * </ol>
 * References:
 * <ul>
 * <li><a href="https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html">Spring Security on CSRF</a>
 * <li><a href="https://docs.spring.io/spring-security/reference/reactive/exploits/csrf.html">Spring Security on CSRF with WebFlux</a>
 * <li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html">
 * OWASP on CSRF</a>
 */
@Component
public class CSRFConfig implements Customizer<ServerHttpSecurity.CsrfSpec>, WebFilter {

    // This custom header is likely not needed anymore, now that we have token-style CSRF protection.
    private static final String X_REQUESTED_BY_NAME = "X-Requested-By";
    private static final String X_REQUESTED_BY_VALUE = "Appsmith";

    /**
     * These methods should be handled as read-only requests, and assuming that is true, they are safe in the context of
     * CSRF, and shouldn't have a CSRF token check.
     * <a href="https://docs.spring.io/spring-security/reference/features/exploits/csrf.html#csrf-protection-read-only">Reference on Spring docs</a>.
     */
    private static final Set<HttpMethod> SAFE_READ_ONLY_METHODS =
            Set.of(HttpMethod.GET, HttpMethod.HEAD, HttpMethod.OPTIONS, HttpMethod.TRACE);

    void applyTo(ServerHttpSecurity http) {
        http.csrf(this).addFilterAfter(this, SecurityWebFiltersOrder.CSRF);
    }

    @Override
    public void customize(ServerHttpSecurity.CsrfSpec spec) {
        spec.requireCsrfProtectionMatcher(this::match)
                .csrfTokenRepository(CookieServerCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new SpaHandler());
    }

    private Mono<ServerWebExchangeMatcher.MatchResult> match(ServerWebExchange exchange) {
        final ServerHttpRequest request = exchange.getRequest();
        final HttpMethod method = request.getMethod();

        if (SAFE_READ_ONLY_METHODS.contains(method)) {
            // If the method isn't anything supported by the HTML `form` element, CSRF check isn't needed.
            return ServerWebExchangeMatcher.MatchResult.notMatch();
        }

        final HttpHeaders headers = request.getHeaders();

        if (X_REQUESTED_BY_VALUE.equals(headers.getFirst(X_REQUESTED_BY_NAME))) {
            // If `X-Request-By: Appsmith` header is present, CSRF check isn't needed.
            return ServerWebExchangeMatcher.MatchResult.notMatch();
        }

        if (APPLICATION_JSON.equals(headers.getContentType())) {
            // If `Content-Type: application/json` header is present, CSRF check isn't needed.
            return ServerWebExchangeMatcher.MatchResult.notMatch();
        }

        // Require a CSRF token check for any request that falls through here.
        return ServerWebExchangeMatcher.MatchResult.match();
    }

    public static class SpaHandler extends ServerCsrfTokenRequestAttributeHandler {
        @Override
        public Mono<String> resolveCsrfTokenValue(ServerWebExchange exchange, CsrfToken csrfToken) {
            final String tokenValue = exchange.getRequest().getHeaders().getFirst(csrfToken.getHeaderName());
            return StringUtils.isNotEmpty(tokenValue)
                    ? Mono.just(tokenValue)
                    : super.resolveCsrfTokenValue(exchange, csrfToken);
        }
    }

    @Override
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        // It _looks_ like we aren't doing anything here, but we very much are.
        // The CSRF Token Mono needs to be subscribed to, for the CSRF token to be added to a `Set-Cookie` header. If
        // this Mono is not subscribed to, the token won't be available to the client.
        final Mono<CsrfToken> csrfTokenMono =
                ObjectUtils.defaultIfNull(exchange.getAttribute(CsrfToken.class.getName()), Mono.empty());
        return csrfTokenMono.then(chain.filter(exchange));
    }
}
