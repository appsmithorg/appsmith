package com.appsmith.server.exceptions;

import com.appsmith.server.dtos.ResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * This class catches all the Exceptions and formats them into a proper ResponseDTO<ErrorDTO> object before
 * sending it to the client.
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * This function only catches the AppsmithException type and formats it into ResponseEntity<ErrorDTO> object
     * Ideally, we should only be throwing AppsmithException from our code. This ensures that we can standardize
     * and set proper error messages and codes.
     *
     * @param e        AppsmithException that will be caught by the function
     * @param exchange ServerWebExchange contract in order to extract the response and set the http status code
     * @return Mono<ResponseDto       <       ErrorDTO>>
     */
    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDto<ErrorDTO>> catchAppsmithException(AppsmithException e, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.resolve(e.getHttpStatus()));
        log.error("", e);
        return Mono.just(new ResponseDto<>(e.getHttpStatus(), new ErrorDTO(e.getAppErrorCode(), e.getMessage()), null, false));
    }

    /**
     * This function catches the generic Exception class and is meant to be a catch all to ensure that we don't leak
     * any information to the client. Ideally, the function #catchAppsmithException should be used
     *
     * @param e        Exception that will be caught by the function
     * @param exchange ServerWebExchange contract in order to extract the response and set the http status code
     * @return Mono<ResponseDto       <       ErrorDTO>>
     */
    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDto<ErrorDTO>> catchException(Exception e, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
        log.error("", e);
        return Mono.just(new ResponseDto<>(HttpStatus.INTERNAL_SERVER_ERROR.value(), new ErrorDTO(AppsmithError.INTERNAL_SERVER_ERROR.getHttpErrorCode(),
                AppsmithError.INTERNAL_SERVER_ERROR.getMessage()), null, false));
    }

}
