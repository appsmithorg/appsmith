package com.appsmith.server.filters;

import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class FormAuthenticationSuccessHandler implements ServerAuthenticationSuccessHandler {

    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> onAuthenticationSuccess(WebFilterExchange webFilterExchange,
                                              Authentication authentication) {
        log.debug("In the form auth success function");
        ServerWebExchange exchange = webFilterExchange.getExchange();
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.OK);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ResponseDTO<Boolean> responseDTO = new ResponseDTO<>(HttpStatus.OK.value(), true, null);

        String responseStr;
        try {
            responseStr = objectMapper.writeValueAsString(responseDTO);
        } catch (JsonProcessingException e) {
            log.error("IOException caught while serializing auth success response to string. Cause: ", e);
            return response.writeWith(Mono.error(new AppsmithException(AppsmithError.LOGIN_INTERNAL_ERROR)));
        }

        DataBuffer buffer = response.bufferFactory().wrap(responseStr.getBytes());
        return response.writeWith(Mono.just(buffer));
    }

}
