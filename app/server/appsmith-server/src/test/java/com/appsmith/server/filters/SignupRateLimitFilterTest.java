package com.appsmith.server.filters;

import com.appsmith.external.constants.spans.UserSpan;
import com.appsmith.server.constants.RateLimitConstants;
import com.appsmith.server.ratelimiting.RateLimitService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.adapter.ForwardedHeaderTransformer;
import reactor.core.publisher.Mono;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SignupRateLimitFilterTest {

    private static final String SIGNUP_PATH = "/api/v1/users";
    private static final int LIMIT = 3;
    private static final String EXPECTED_LOCATION = "/user/signup?error="
            + URLEncoder.encode(RateLimitConstants.RATE_LIMIT_REACHED_SIGNUP, StandardCharsets.UTF_8);

    private RateLimitService rateLimitService;
    private MeterRegistry meterRegistry;
    private SignupRateLimitFilter filter;
    private WebFilterChain chain;
    private AtomicInteger chainInvocations;
    // Emulates the bucket: LIMIT tokens per (bucket, key), refused afterwards.
    private final Map<String, Integer> consumed = new HashMap<>();

    @BeforeEach
    void setUp() {
        rateLimitService = mock(RateLimitService.class);
        when(rateLimitService.tryIncreaseCounter(anyString(), anyString())).thenAnswer(invocation -> {
            String bucketKey = invocation.getArgument(0) + "|" + invocation.getArgument(1);
            int used = consumed.merge(bucketKey, 1, Integer::sum);
            return Mono.just(used <= LIMIT);
        });
        meterRegistry = new SimpleMeterRegistry();
        filter = new SignupRateLimitFilter(rateLimitService, meterRegistry);
        chainInvocations = new AtomicInteger();
        chain = exchange -> {
            chainInvocations.incrementAndGet();
            return Mono.empty();
        };
    }

    private MockServerWebExchange signupExchange(String xForwardedFor, String remoteIp) {
        return exchange(HttpMethod.POST, SIGNUP_PATH, MediaType.APPLICATION_FORM_URLENCODED, xForwardedFor, remoteIp);
    }

    private MockServerWebExchange exchange(
            HttpMethod method, String path, MediaType contentType, String xForwardedFor, String remoteIp) {
        MockServerHttpRequest.BodyBuilder builder = MockServerHttpRequest.method(method, path)
                .contentType(contentType)
                .remoteAddress(inetSocketAddress(remoteIp));
        if (xForwardedFor != null) {
            builder.header("X-Forwarded-For", xForwardedFor);
        }
        return MockServerWebExchange.from(builder.body("email=a%40b.com&password=secret"));
    }

    private static ServerWebExchange withRequest(ServerHttpRequest request) {
        return MockServerWebExchange.from(MockServerHttpRequest.post(SIGNUP_PATH))
                .mutate()
                .request(request)
                .build();
    }

    private static InetSocketAddress inetSocketAddress(String ip) {
        try {
            return new InetSocketAddress(InetAddress.getByName(ip), 54321);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private void assertRateLimited(ServerWebExchange exchange) {
        assertThat(exchange.getResponse().getStatusCode().is3xxRedirection()).isTrue();
        assertThat(exchange.getResponse().getHeaders().getLocation()).hasToString(EXPECTED_LOCATION);
    }

    @Test
    void signup_withinLimit_invokesChainAndKeysByFirstForwardedForIp() {
        for (int i = 0; i < LIMIT; i++) {
            MockServerWebExchange exchange = signupExchange("203.0.113.7, 10.0.0.1, 10.0.0.2", "127.0.0.1");
            filter.filter(exchange, chain).block();
            assertThat(exchange.getResponse().getHeaders().getLocation()).isNull();
        }

        assertThat(chainInvocations.get()).isEqualTo(LIMIT);
        verify(rateLimitService, org.mockito.Mockito.times(LIMIT))
                .tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_SIGNUP_API, "203.0.113.7");
    }

    @Test
    void signup_afterLimitFromSameIp_redirectsWithRateLimitMessageAndSkipsChain() {
        for (int i = 0; i < LIMIT; i++) {
            filter.filter(signupExchange("203.0.113.7", "127.0.0.1"), chain).block();
        }
        assertThat(chainInvocations.get()).isEqualTo(LIMIT);

        MockServerWebExchange blocked = signupExchange("203.0.113.7", "127.0.0.1");
        filter.filter(blocked, chain).block();

        assertRateLimited(blocked);
        assertThat(chainInvocations.get()).isEqualTo(LIMIT);
        assertThat(meterRegistry
                        .counter(
                                UserSpan.SIGNUP_FAILURE,
                                "source",
                                "rate_limit",
                                "errorCode",
                                "RateLimitExceeded",
                                "message",
                                RateLimitConstants.RATE_LIMIT_REACHED_SIGNUP)
                        .count())
                .isEqualTo(1.0);
    }

    @Test
    void signup_differentIpAfterFirstIpIsLimited_isAllowed() {
        for (int i = 0; i <= LIMIT; i++) {
            filter.filter(signupExchange("203.0.113.7", "127.0.0.1"), chain).block();
        }
        int invocationsBefore = chainInvocations.get();

        MockServerWebExchange other = signupExchange("198.51.100.9", "127.0.0.1");
        filter.filter(other, chain).block();

        assertThat(other.getResponse().getHeaders().getLocation()).isNull();
        assertThat(chainInvocations.get()).isEqualTo(invocationsBefore + 1);
        verify(rateLimitService).tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_SIGNUP_API, "198.51.100.9");
    }

    @Test
    void signup_withoutForwardedFor_fallsBackToRemoteAddress() {
        filter.filter(signupExchange(null, "192.0.2.44"), chain).block();

        verify(rateLimitService).tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_SIGNUP_API, "192.0.2.44");
        assertThat(chainInvocations.get()).isEqualTo(1);
    }

    @Test
    void signup_withMalformedForwardedFor_fallsBackToRemoteAddress() {
        filter.filter(signupExchange("not-an-ip, 203.0.113.7", "192.0.2.44"), chain)
                .block();

        verify(rateLimitService).tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_SIGNUP_API, "192.0.2.44");
        assertThat(chainInvocations.get()).isEqualTo(1);
    }

    @Test
    void otherPath_isNotCounted() {
        MockServerWebExchange exchange = exchange(
                HttpMethod.POST,
                SIGNUP_PATH + "/super",
                MediaType.APPLICATION_FORM_URLENCODED,
                "203.0.113.7",
                "127.0.0.1");

        filter.filter(exchange, chain).block();

        verify(rateLimitService, never()).tryIncreaseCounter(anyString(), anyString());
        assertThat(chainInvocations.get()).isEqualTo(1);
    }

    @Test
    void sameSignupPathWithOtherMethodOrContentType_isNotCounted() {
        // PUT /api/v1/users is the profile update; JSON POST is not the form signup. Neither may consume tokens.
        filter.filter(
                        exchange(HttpMethod.PUT, SIGNUP_PATH, MediaType.APPLICATION_JSON, "203.0.113.7", "127.0.0.1"),
                        chain)
                .block();
        filter.filter(
                        exchange(HttpMethod.POST, SIGNUP_PATH, MediaType.APPLICATION_JSON, "203.0.113.7", "127.0.0.1"),
                        chain)
                .block();

        verify(rateLimitService, never()).tryIncreaseCounter(anyString(), anyString());
        assertThat(chainInvocations.get()).isEqualTo(2);
    }

    @Test
    void signup_afterForwardedHeaderTransformer_keysByForwardedClientIp() {
        // Production runs ForwardedHeaderTransformer ahead of the web filters: it strips X-Forwarded-For and leaves the
        // client as an unresolved remote address. The limit must still be keyed on that client.
        MockServerHttpRequest raw = MockServerHttpRequest.post(SIGNUP_PATH)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .remoteAddress(inetSocketAddress("127.0.0.1"))
                .header("X-Forwarded-For", "203.0.113.7, 10.0.0.1")
                .build();
        ServerHttpRequest transformed = new ForwardedHeaderTransformer().apply(raw);
        assertThat(transformed.getHeaders().getFirst("X-Forwarded-For")).isNull();

        for (int i = 0; i < LIMIT; i++) {
            filter.filter(withRequest(transformed), chain).block();
        }
        ServerWebExchange blocked = withRequest(transformed);
        filter.filter(blocked, chain).block();

        verify(rateLimitService, org.mockito.Mockito.times(LIMIT + 1))
                .tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_SIGNUP_API, "203.0.113.7");
        assertRateLimited(blocked);
        assertThat(chainInvocations.get()).isEqualTo(LIMIT);
    }

    @Test
    void signup_withUnusableClientAddress_isStillCountedInSharedBucket() {
        // A garbage X-Forwarded-For becomes an unresolved, non-IP remote address after the transformer. It must not
        // be a way around the limit.
        ServerHttpRequest transformed = new ForwardedHeaderTransformer()
                .apply(MockServerHttpRequest.post(SIGNUP_PATH)
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .remoteAddress(inetSocketAddress("127.0.0.1"))
                        .header("X-Forwarded-For", "not-an-ip")
                        .build());

        for (int i = 0; i < LIMIT; i++) {
            filter.filter(withRequest(transformed), chain).block();
        }
        ServerWebExchange blocked = withRequest(transformed);
        filter.filter(blocked, chain).block();

        assertRateLimited(blocked);
        assertThat(chainInvocations.get()).isEqualTo(LIMIT);
        verify(rateLimitService, org.mockito.Mockito.times(LIMIT + 1))
                .tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_SIGNUP_API, "unknown");
    }

    @Test
    void signup_withoutAnyClientAddress_isCountedInSharedBucket() {
        MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.post(SIGNUP_PATH)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .build());

        filter.filter(exchange, chain).block();

        verify(rateLimitService).tryIncreaseCounter(RateLimitConstants.BUCKET_KEY_FOR_SIGNUP_API, "unknown");
        assertThat(chainInvocations.get()).isEqualTo(1);
    }
}
