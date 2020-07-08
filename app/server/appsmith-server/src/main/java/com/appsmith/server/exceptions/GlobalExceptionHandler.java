package com.appsmith.server.exceptions;

import com.appsmith.external.pluginExceptions.AppsmithPluginException;
import com.appsmith.server.dtos.ResponseDTO;
import com.rollbar.notifier.Rollbar;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Mono;


/**
 * This class catches all the Exceptions and formats them into a proper ResponseDTO<ErrorDTO> object before
 * sending it to the client.
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private final Rollbar rollbar;

    @Autowired
    public GlobalExceptionHandler(@Autowired(required = false) Rollbar rollbar) {
        this.rollbar = rollbar;
    }

    private void doLog(Throwable error) {
        log.error("", error);
        if (rollbar != null) {
            rollbar.log(error);
        }
    }

    /**
     * This function only catches the AppsmithException type and formats it into ResponseEntity<ErrorDTO> object
     * Ideally, we should only be throwing AppsmithException from our code. This ensures that we can standardize
     * and set proper error messages and codes.
     *
     * @param e        AppsmithException that will be caught by the function
     * @param exchange ServerWebExchange contract in order to extract the response and set the http status code
     * @return Mono<ResponseDto < ErrorDTO>>
     */
    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchAppsmithException(AppsmithException e, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.resolve(e.getHttpStatus()));
        doLog(e);
        return Mono.just(new ResponseDTO<>(e.getHttpStatus(), new ErrorDTO(e.getAppErrorCode(), e.getMessage())));
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchDuplicateKeyException(org.springframework.dao.DuplicateKeyException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.DUPLICATE_KEY;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        return Mono.just(new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(),
                appsmithError.getMessage(e.getMessage()))));
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchTimeoutException(java.util.concurrent.TimeoutException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.PLUGIN_EXECUTION_TIMEOUT;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        return Mono.just(new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(),
                appsmithError.getMessage())));
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchServerWebInputException(ServerWebInputException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.GENERIC_BAD_REQUEST;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        return Mono.just(new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(),
                appsmithError.getMessage(e.getReason()))));
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchPluginException(AppsmithPluginException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.INTERNAL_SERVER_ERROR;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        return Mono.just(new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(),
                e.getLocalizedMessage())));
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchAccessDeniedException(AccessDeniedException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.UNAUTHORIZED_ACCESS;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        return Mono.just(new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(),
                appsmithError.getMessage())));
    }

    /**
     * This function catches the generic Exception class and is meant to be a catch all to ensure that we don't leak
     * any information to the client. Ideally, the function #catchAppsmithException should be used
     *
     * @param e        Exception that will be caught by the function
     * @param exchange ServerWebExchange contract in order to extract the response and set the http status code
     * @return Mono<ResponseDto < ErrorDTO>>
     */
    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchException(Exception e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.INTERNAL_SERVER_ERROR;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        return Mono.just(new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(),
                appsmithError.getMessage())));
    }
}
