package com.appsmith.server.filters;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.ratelimiting.RateLimitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
public class PreAuth implements WebFilter {

    private final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();
    private final RateLimitService rateLimitService;

    public PreAuth(RateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        return getUsername(exchange).flatMap(username -> {
            if (!username.isEmpty()) {
                return rateLimitService
                        .tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_LOGIN_API, username)
                        .flatMap(counterIncreaseAttemptSuccessful -> {
                            if (!counterIncreaseAttemptSuccessful) {
                                log.error("Rate limit exceeded. Redirecting to login page.");
                                return handleRateLimitExceeded(exchange);
                            }

                            return chain.filter(exchange);
                        });
            } else {
                // If username is empty, simply continue with the filter chain
                return chain.filter(exchange);
            }
        });
    }

    private Mono<String> getUsername(ServerWebExchange exchange) {
        return exchange.getFormData().flatMap(formData -> {
            String username = formData.getFirst(FieldName.USERNAME.toString());
            if (username != null && !username.isEmpty()) {
                return Mono.just(URLDecoder.decode(username, StandardCharsets.UTF_8));
            }

            return Mono.just("");
        });
    }

    private Mono<Void> handleRateLimitExceeded(ServerWebExchange exchange) {
        // Set the error in the URL query parameter for rate limiting
        String url = "/user/login?error=true&message="
                + URLEncoder.encode(RateLimitConstants.RATE_LIMIT_REACHED_ACCOUNT_SUSPENDED, StandardCharsets.UTF_8);
        return redirectWithUrl(exchange, url);
    }

    private Mono<Void> redirectWithUrl(ServerWebExchange exchange, String url) {
        URI defaultRedirectLocation = URI.create(url);
        return this.redirectStrategy.sendRedirect(exchange, defaultRedirectLocation);
    }
}
