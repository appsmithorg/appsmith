package com.appsmith.server.configurations;

import com.appsmith.server.authentication.handlers.AccessDeniedHandler;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpHeaders;
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
@RequiredArgsConstructor
public class CsrfConfig implements Customizer<ServerHttpSecurity.CsrfSpec>, WebFilter {

    private final AccessDeniedHandler accessDeniedHandler;

    // This custom header is likely not needed anymore, now that we have token-style CSRF protection.
    private static final String X_REQUESTED_BY_NAME = "X-Requested-By";
    private static final String X_REQUESTED_BY_VALUE = "Appsmith";

    void applyTo(ServerHttpSecurity http) {
        http.csrf(this).addFilterAfter(this, SecurityWebFiltersOrder.CSRF);
    }

    @Override
    public void customize(ServerHttpSecurity.CsrfSpec spec) {
        spec.requireCsrfProtectionMatcher(this::match)
                .csrfTokenRepository(CookieServerCsrfTokenRepository.withHttpOnlyFalse())
                // TODO: This shouldn't be necessary. This is weaker than the default and recommended option,
                //  `XorServerCsrfTokenRequestAttributeHandler`. Find out why the default request handler isn't working.
                .csrfTokenRequestHandler(new ServerCsrfTokenRequestAttributeHandler())
                .accessDeniedHandler(accessDeniedHandler);
    }

    private Mono<ServerWebExchangeMatcher.MatchResult> match(ServerWebExchange exchange) {
        final ServerHttpRequest request = exchange.getRequest();
        final HttpHeaders headers = request.getHeaders();

        if (X_REQUESTED_BY_VALUE.equals(headers.getFirst(X_REQUESTED_BY_NAME))) {
            // If `X-Request-By: Appsmith` header is present, CSRF check isn't needed.
            return ServerWebExchangeMatcher.MatchResult.notMatch();
        }

        if (APPLICATION_JSON.equals(headers.getContentType())) {
            // If `Content-Type: application/json` header is present, CSRF check isn't needed.
            return ServerWebExchangeMatcher.MatchResult.notMatch();
        }

        if (StringUtils.isNotEmpty(headers.getFirst(HttpHeaders.AUTHORIZATION))) {
            // If the request has a non-empty `Authorization` header, CSRF check isn't needed.
            return ServerWebExchangeMatcher.MatchResult.notMatch();
        }

        // Require a CSRF token check for any request that falls through here.
        return ServerWebExchangeMatcher.MatchResult.match();
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
