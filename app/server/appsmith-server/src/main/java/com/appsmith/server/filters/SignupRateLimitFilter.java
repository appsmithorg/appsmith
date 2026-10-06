package com.appsmith.server.filters;

import com.appsmith.external.constants.spans.UserSpan;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.constants.Url;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.google.common.net.InetAddresses;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static java.lang.Boolean.FALSE;

/**
 * Throttles the self-serve signup endpoint ({@code POST /api/v1/users}, form data) per client IP. The caller is
 * anonymous at signup, so unlike {@link LoginRateLimitFilter} the bucket cannot be keyed by the submitted email.
 */
@Slf4j
public class SignupRateLimitFilter implements WebFilter {

    private static final String X_FORWARDED_FOR = "X-Forwarded-For";
    private static final String UNKNOWN_CLIENT = "unknown";
    private static final String SIGNUP_PAGE_URL = "/user/signup";

    private final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();
    private final RateLimitService rateLimitService;
    private final MeterRegistry meterRegistry;

    public SignupRateLimitFilter(RateLimitService rateLimitService, MeterRegistry meterRegistry) {
        this.rateLimitService = rateLimitService;
        this.meterRegistry = meterRegistry;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (!isSelfServeSignupRequest(exchange.getRequest())) {
            return chain.filter(exchange);
        }

        String clientIp = getClientIp(exchange.getRequest());

        return rateLimitService
                .tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_SIGNUP_API, clientIp)
                .flatMap(counterIncreaseAttemptSuccessful -> {
                    if (FALSE.equals(counterIncreaseAttemptSuccessful)) {
                        return handleRateLimitExceeded(exchange);
                    }

                    return chain.filter(exchange);
                });
    }

    /**
     * The signup path is shared with other verbs (for example {@code PUT /api/v1/users} updates the profile), and
     * {@code ConditionalFilter} matches on path alone, so the verb and content type are checked here to mirror the
     * controller's {@code @PostMapping(consumes = APPLICATION_FORM_URLENCODED_VALUE)}.
     */
    private boolean isSelfServeSignupRequest(ServerHttpRequest request) {
        return HttpMethod.POST.equals(request.getMethod())
                && Url.USER_URL.equals(request.getPath().toString())
                && MediaType.APPLICATION_FORM_URLENCODED.equalsTypeAndSubtype(
                        request.getHeaders().getContentType());
    }

    /**
     * Cloud sits behind CloudFront/ALB, so the first {@code X-Forwarded-For} value is the client. In the running
     * server {@code ForwardedHeaderTransformer} has already consumed that header: it is removed and the client is
     * left as the (unresolved) remote address, so both shapes are read. Only a literal IP address is accepted (never
     * resolved, canonicalised), which also bounds the bucket key space. A request with no usable address is counted
     * in a shared {@value #UNKNOWN_CLIENT} bucket rather than skipped, so a malformed header cannot be used to
     * bypass the limit; real traffic always carries a valid address, so it does not compete for that bucket.
     */
    private String getClientIp(ServerHttpRequest request) {
        String forwardedFor = request.getHeaders().getFirst(X_FORWARDED_FOR);
        if (StringUtils.hasText(forwardedFor)) {
            String firstValue = forwardedFor.split(",", 2)[0].trim();
            if (InetAddresses.isInetAddress(firstValue)) {
                return InetAddresses.forString(firstValue).getHostAddress();
            }
        }

        InetSocketAddress remoteAddress = request.getRemoteAddress();
        if (remoteAddress != null) {
            String host = remoteAddress.getHostString();
            if (InetAddresses.isInetAddress(host)) {
                return InetAddresses.forString(host).getHostAddress();
            }
        }

        return UNKNOWN_CLIENT;
    }

    private Mono<Void> handleRateLimitExceeded(ServerWebExchange exchange) {
        String url = SIGNUP_PAGE_URL + "?error="
                + URLEncoder.encode(RateLimitConstants.RATE_LIMIT_REACHED_SIGNUP, StandardCharsets.UTF_8);

        meterRegistry
                .counter(
                        UserSpan.SIGNUP_FAILURE,
                        "source",
                        "rate_limit",
                        "errorCode",
                        "RateLimitExceeded",
                        "message",
                        RateLimitConstants.RATE_LIMIT_REACHED_SIGNUP)
                .increment();

        return this.redirectStrategy.sendRedirect(exchange, URI.create(url));
    }
}
