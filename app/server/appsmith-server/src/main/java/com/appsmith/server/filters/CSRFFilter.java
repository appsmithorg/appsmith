package com.appsmith.server.filters;

import com.appsmith.server.dtos.ResponseDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED;

@Slf4j
@RequiredArgsConstructor
public class CSRFFilter implements WebFilter {

    private static final String X_REQUESTED_BY_NAME = "X-Requested-By";
    private static final String X_REQUESTED_BY_VALUE = "Appsmith";

    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        final ServerHttpRequest request = exchange.getRequest();
        final HttpMethod method = request.getMethod();

        /*
         * These methods should be handled as read-only requests, and assuming that is true, they are safe in the context of
         * CSRF, and shouldn't have a CSRF token check. While it looks like it's no-harm doing the CSRF token check for
         * "GET" requests also, it means we can't simply open these endpoints in the browser and see the response. This can
         * seriously inhibit troubleshooting and dev convenience.
         * Ref: https://docs.spring.io/spring-security/reference/features/exploits/csrf.html#csrf-protection-read-only
         */
        if (HttpMethod.GET.equals(method) || HttpMethod.HEAD.equals(method)) {
            return chain.filter(exchange);
        }

        final HttpHeaders headers = request.getHeaders();

        if (X_REQUESTED_BY_VALUE.equals(headers.getFirst(X_REQUESTED_BY_NAME))) {
            // If `X-Request-By: Appsmith` header is present, we're okay.
            return chain.filter(exchange);
        }

        if (!APPLICATION_FORM_URLENCODED.equalsTypeAndSubtype(headers.getContentType())) {
            // At this point, if the request isn't `Content-Type: application/x-www-form-urlencoded`, reject it.
            return fail(exchange);
        }

        String csrfCookieValue = "";
        final List<HttpCookie> csrfCookie = request.getCookies().get("x-csrf");
        if (!CollectionUtils.isEmpty(csrfCookie)) {
            csrfCookieValue = csrfCookie.get(0).getValue();
        }

        final String finalCookieValue = csrfCookieValue;
        return exchange.getFormData()
                .mapNotNull(d -> d.getFirst("csrf"))
                .defaultIfEmpty("")
                .flatMap(field -> {
                    if (StringUtils.isNotEmpty(finalCookieValue) && finalCookieValue.equals(field)) {
                        return chain.filter(exchange);
                    }

                    return fail(exchange);
                });
    }

    @NotNull private Mono<Void> fail(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.FORBIDDEN);
        response.getHeaders().set("Content-Type", MediaType.APPLICATION_JSON_VALUE);
        try {
            final byte[] bytes = objectMapper.writeValueAsBytes(
                    new ResponseDTO<>(HttpStatus.FORBIDDEN.value(), null, "Forbidden", false));
            return response.writeWith(
                    Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
        } catch (JsonProcessingException e) {
            return Mono.error(e);
        }
    }
}
