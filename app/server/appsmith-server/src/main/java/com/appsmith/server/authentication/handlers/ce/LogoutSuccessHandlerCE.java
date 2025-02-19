package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.AnalyticsService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.logout.ServerLogoutSuccessHandler;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

@Slf4j
public class LogoutSuccessHandlerCE implements ServerLogoutSuccessHandler {

    private final ObjectMapper objectMapper;
    private final AnalyticsService analyticsService;

    @Getter(AccessLevel.PROTECTED)
    private final String postLogoutRedirectUri = "/user/login";

    public LogoutSuccessHandlerCE(ObjectMapper objectMapper, AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> onLogoutSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        log.debug("In the logout success handler");

        ServerWebExchange exchange = webFilterExchange.getExchange();
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.OK);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        ResponseDTO<Boolean> responseBody = new ResponseDTO<>(HttpStatus.OK.value(), true, null);
        String responseStr;
        try {
            responseStr = objectMapper.writeValueAsString(responseBody);
        } catch (JsonProcessingException e) {
            log.error("Unable to write to response json. Cause: ", e);
            // Returning a hard-coded failure json
            responseStr = "{\"responseMeta\":{\"status\":500,\"success\":false},\"data\":false}";
            DataBuffer buffer = exchange.getResponse()
                    .bufferFactory()
                    .allocateBuffer(responseStr.length())
                    .write(responseStr.getBytes());
            return response.writeWith(Mono.just(buffer));
        }

        DataBuffer buffer = exchange.getResponse()
                .bufferFactory()
                .allocateBuffer(responseStr.length())
                .write(responseStr.getBytes());
        Mono<Void> postLogoutRedirectionMono = this.generatePostLogoutRedirectUri(webFilterExchange, authentication)
                .flatMap(this::clearOAuthSessionIfRequired)
                .then(response.writeWith(Mono.just(buffer)));
        return analyticsService
                .sendObjectEvent(AnalyticsEvents.LOGOUT, (User) authentication.getPrincipal())
                .then(postLogoutRedirectionMono);
    }

    protected Mono<String> generatePostLogoutRedirectUri(
            WebFilterExchange webFilterExchange, Authentication authentication) {
        return Mono.just(postLogoutRedirectUri(webFilterExchange.getExchange().getRequest()));
    }

    protected static UriComponents getUriComponents(ServerHttpRequest request) {
        return UriComponentsBuilder.fromUri(request.getURI())
                .replacePath(request.getPath().contextPath().value())
                .replaceQuery(null)
                .fragment(null)
                .build();
    }

    protected String postLogoutRedirectUri(ServerHttpRequest request) {
        UriComponents uriComponents = getUriComponents(request);
        String scheme = uriComponents.getScheme();
        String host = uriComponents.getHost();
        return UriComponentsBuilder.newInstance()
                .scheme((scheme != null) ? scheme : "")
                .host((host != null) ? host : "")
                .path(this.getPostLogoutRedirectUri())
                .build()
                .toUriString();
    }

    protected Mono<Void> clearOAuthSessionIfRequired(String logoutRedirectUri) {
        return Mono.empty();
    }
}
