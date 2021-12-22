package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.dtos.ResponseDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.logout.ServerLogoutSuccessHandler;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
public class LogoutSuccessHandlerCE implements ServerLogoutSuccessHandler {

    private final ObjectMapper objectMapper;

    public LogoutSuccessHandlerCE(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> onLogoutSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        log.debug("In the logout success handler");

        ServerWebExchange exchange = webFilterExchange.getExchange();
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.OK);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
        try {
            ResponseDTO<Boolean> responseBody = new ResponseDTO<>(HttpStatus.OK.value(), true, null);
            String responseStr = objectMapper.writeValueAsString(responseBody);
            DataBuffer buffer = exchange.getResponse().bufferFactory().allocateBuffer().write(responseStr.getBytes());
            return response.writeWith(Mono.just(buffer));
        } catch (JsonProcessingException e) {
            log.error("Unable to write to response json. Cause: ", e);
            // Returning a hard-coded failure json
            String responseStr = "{\"responseMeta\":{\"status\":500,\"success\":false},\"data\":false}";
            DataBuffer buffer = exchange.getResponse().bufferFactory().allocateBuffer().write(responseStr.getBytes());
            return response.writeWith(Mono.just(buffer));
        }
    }

}
