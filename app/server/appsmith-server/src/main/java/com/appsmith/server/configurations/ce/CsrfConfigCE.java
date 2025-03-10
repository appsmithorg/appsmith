package com.appsmith.server.configurations.ce;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.csrf.CookieServerCsrfTokenRepository;
import org.springframework.security.web.server.csrf.CsrfServerLogoutHandler;
import org.springframework.security.web.server.csrf.CsrfToken;
import org.springframework.security.web.server.csrf.DefaultCsrfToken;
import org.springframework.security.web.server.csrf.ServerCsrfTokenRepository;
import org.springframework.security.web.server.csrf.ServerCsrfTokenRequestAttributeHandler;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * This component has three purposes:
 * <ol>
 * <li>The CSRFSpec customizer, or in English, responsible for configuring CSRF for our API. Handled by the {@link #customize} method.
 * <li>A request matcher, responsible for deciding CSRF token should be checked. Handled by the {@link #matches} method.
 * <li>A WebFilter, that ensures the CSRF token Mono actually gets subscribed to. Handled by the {@link #filter} method.
 * </ol>
 * References:
 * <ul>
 * <li><a href="https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html">Spring Security on CSRF</a>
 * <li><a href="https://docs.spring.io/spring-security/reference/reactive/exploits/csrf.html">Spring Security on CSRF with WebFlux</a>
 * <li><a href="https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html">
 * OWASP on CSRF</a>
 */
@RequiredArgsConstructor
public class CsrfConfigCE implements Customizer<ServerHttpSecurity.CsrfSpec>, ServerWebExchangeMatcher, WebFilter {

    @SuppressWarnings("UastIncorrectHttpHeaderInspection")
    public static final String X_REQUESTED_BY_NAME = "X-Requested-By";

    public static final String X_REQUESTED_BY_VALUE = "Appsmith";

    @SuppressWarnings("UastIncorrectHttpHeaderInspection")
    public static final String VERSION_HEADER = "X-Appsmith-Version";

    public void applyTo(ServerHttpSecurity http) {
        http.csrf(this).addFilterAfter(this, SecurityWebFiltersOrder.CSRF);
    }

    @Override
    public void customize(@NonNull ServerHttpSecurity.CsrfSpec spec) {
        spec.requireCsrfProtectionMatcher(this)
                .csrfTokenRepository(new Repository())
                // TODO: This shouldn't be necessary. This is apparently weaker than the default and recommended option,
                //  `XorServerCsrfTokenRequestAttributeHandler`. Figure out a way to switch to the default.
                .csrfTokenRequestHandler(new ServerCsrfTokenRequestAttributeHandler());
    }

    @Override
    public Mono<ServerWebExchangeMatcher.MatchResult> matches(@NonNull ServerWebExchange exchange) {
        final ServerHttpRequest request = exchange.getRequest();
        final HttpMethod method = request.getMethod();

        if (HttpMethod.GET.equals(method) || HttpMethod.HEAD.equals(method)) {
            // Semantically, GET requests should be handled as read-only requests, and assuming that is true, they are
            // safe from CSRF. While it looks like it's no-harm doing the CSRF token check for "GET" requests also, it
            // means we can't simply open these endpoints in the browser and see the response. This can seriously
            // inhibit troubleshooting and developer convenience.
            // This is why it's important to ensure GET handlers don't have significant side effects.
            // Ref:
            // https://docs.spring.io/spring-security/reference/features/exploits/csrf.html#csrf-protection-read-only
            return ServerWebExchangeMatcher.MatchResult.notMatch();
        }

        if (HttpMethod.POST.equals(method)
                && isUrlExemptedFromCsrf(request.getPath().value())) {
            // We put this check exactly here, so that only POST requests can ever be exempted. This is intentional.
            return ServerWebExchangeMatcher.MatchResult.notMatch();
        }

        final HttpHeaders headers = request.getHeaders();

        if (headers.containsKey(VERSION_HEADER)) {
            // If `X-Appsmith-Version` header is present, CSRF check isn't needed.
            return ServerWebExchangeMatcher.MatchResult.notMatch();
        }

        if (X_REQUESTED_BY_VALUE.equals(headers.getFirst(X_REQUESTED_BY_NAME))) {
            // If `X-Request-By: Appsmith` header is present, CSRF check isn't needed.
            // Using this header for requests in new code is discouraged. Consider using `X-Appsmith-Version` instead.
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

    /**
     * This little Repository class might just as well be the default {@link CookieServerCsrfTokenRepository} itself.
     * Two of three methods just delegate to an instance of that class. We delegate instead of extending because it's a
     * final class.
     * <p>
     * Problem: On logging out, the {@link CsrfServerLogoutHandler} calls the repository's {@link #saveToken} method,
     * with a {@code null} token. This clears the {@code XSRF-TOKEN} cookie on the browser. Because of this, the client
     * SPA is unable to load set a {@code _csrf} hidden input in the login form that shows up just after logout. The
     * user has to refresh the page to get a new token in the cookie, and for the login form to work again.
     * <p>
     * To solve for this, we override the behaviour of {@link #saveToken} when a {@code null} token is passed, and
     * instead of clearing, we generate a new token to be saved in the cookie. With this, the login form that shows up
     * just after a logout is able to capture the CSRF token, and so the form works fine.
     */
    public static class Repository implements ServerCsrfTokenRepository {
        private final CookieServerCsrfTokenRepository delegate = CookieServerCsrfTokenRepository.withHttpOnlyFalse();

        @Override
        public Mono<CsrfToken> generateToken(ServerWebExchange exchange) {
            return delegate.generateToken(exchange);
        }

        @Override
        public Mono<Void> saveToken(ServerWebExchange exchange, CsrfToken token) {
            if (token == null) {
                // Called by CsrfLogoutHandler, which tries to clear the token. We want to regenerate, not clear.
                token = new DefaultCsrfToken(
                        // Values taken from CookieServerCsrfTokenRepository
                        "X-XSRF-TOKEN", "_csrf", UUID.randomUUID().toString());
            }

            return delegate.saveToken(exchange, token);
        }

        @Override
        public Mono<CsrfToken> loadToken(ServerWebExchange exchange) {
            return delegate.loadToken(exchange);
        }
    }

    /**
     * Override to add exemptions.
     */
    protected boolean isUrlExemptedFromCsrf(@NonNull String urlPath) {
        return false;
    }
}
