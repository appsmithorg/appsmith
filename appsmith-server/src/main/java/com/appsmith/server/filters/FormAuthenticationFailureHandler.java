package com.appsmith.server.filters;

import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.exceptions.ErrorDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class FormAuthenticationFailureHandler implements ServerAuthenticationFailureHandler {

    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> onAuthenticationFailure(WebFilterExchange webFilterExchange, AuthenticationException exception) {
        log.debug("In the form auth failure function");
        ServerWebExchange exchange = webFilterExchange.getExchange();
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ResponseDTO<Boolean> responseDTO = new ResponseDTO<>(HttpStatus.UNAUTHORIZED.value(),
                new ErrorDTO(AppsmithError.UNAUTHORIZED_ACCESS.getHttpErrorCode(),
                AppsmithError.UNAUTHORIZED_ACCESS.getMessage()));

        String responseStr;
        try {
            responseStr = objectMapper.writeValueAsString(responseDTO);
        } catch (JsonProcessingException e) {
            log.error("IOException caught while serializing auth failure response to string. Cause: ", e);
            return response.writeWith(Mono.error(new AppsmithException(AppsmithError.LOGIN_INTERNAL_ERROR)));
        }

        DataBuffer buffer = response.bufferFactory().wrap(responseStr.getBytes());
        return response.writeWith(Mono.just(buffer));
    }
}
