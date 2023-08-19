package com.appsmith.server.filters;

import com.appsmith.server.constants.ApiConstants;
import com.appsmith.server.ratelimiting.RateLimitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
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
        log.debug("Inside PreAuth filter");
        // get username and rate limit using rateLimitService
        // if rate limit exceeded, return 429
        // else continue with chain.filter(exchange)
        return getUsername(exchange)
                .flatMap(username -> {
                    log.debug("Username: {}", username);
                    return rateLimitService.tryIncreaseCounter("authentication", username);
                })
                .flatMap(isRateLimited -> {
                    if (isRateLimited) {
                        log.error("Rate limit exceeded. Redirecting to login page.");
                        return handleRateLimitExceeded(exchange);
                    } else {
                        log.error("Rate limit not exceeded. Continuing with filter chain.");
                        return chain.filter(exchange);
                    }
                });
    }

    private Mono<String> getUsername(ServerWebExchange exchange) {
        ServerHttpRequest originalRequest = exchange.getRequest();

        return DataBufferUtils.join(originalRequest.getBody()).flatMap(dataBuffer -> {
            byte[] bytes = new byte[dataBuffer.readableByteCount()];
            dataBuffer.read(bytes);
            DataBufferUtils.release(dataBuffer);

            String body = new String(bytes, StandardCharsets.UTF_8);

            // Parse form data
            MultiValueMap<String, String> formData = parseFormData(body);

            // URL decode the username value
            String username = formData.getFirst("username");
            if (username != null) {
                username = URLDecoder.decode(username, StandardCharsets.UTF_8);
            }

            return Mono.just(username);
        });
    }

    private MultiValueMap<String, String> parseFormData(String body) {
        MultiValueMap<String, String> formData = new LinkedMultiValueMap<>();

        if (body != null) {
            String[] pairs = body.split("&");
            for (String pair : pairs) {
                String[] keyValue = pair.split("=");
                if (keyValue.length == 2) {
                    formData.add(keyValue[0], keyValue[1]);
                }
            }
        }

        return formData;
    }

    private Mono<Void> handleRateLimitExceeded(ServerWebExchange exchange) {
        // Set the error in the URL query parameter for rate limiting
        String url = "/user/login?error=true&message="
                + URLEncoder.encode(ApiConstants.RATE_LIMIT_EXCEEDED_ERROR, StandardCharsets.UTF_8);
        return redirectWithUrl(exchange, url);
    }

    private Mono<Void> redirectWithUrl(ServerWebExchange exchange, String url) {
        URI defaultRedirectLocation = URI.create(url);
        return this.redirectStrategy.sendRedirect(exchange, defaultRedirectLocation);
    }
}
