package com.appsmith.server.exceptions;

import com.appsmith.external.exceptions.AppsmithErrorAction;
import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.util.DuplicateKeyExceptionUtils;
import com.appsmith.server.helpers.RedisUtils;
import io.micrometer.core.instrument.util.StringUtils;
import com.appsmith.server.filters.MDCFilter;
import io.sentry.Sentry;
import io.sentry.SentryLevel;
import io.sentry.protocol.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.buffer.DataBufferLimitException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Mono;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;


/**
 * This class catches all the Exceptions and formats them into a proper ResponseDTO<ErrorDTO> object before
 * sending it to the client.
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private final RedisUtils redisUtils;

    public GlobalExceptionHandler(RedisUtils redisUtils) {
        this.redisUtils = redisUtils;
    }

    private void doLog(Throwable error) {
        log.error("", error);

        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        error.printStackTrace(printWriter);
        String stringStackTrace = stringWriter.toString();

        Sentry.configureScope(
                scope -> {
                    /**
                     * Send stack trace as a string message. This is a work around till it is figured out why raw
                     * stack trace is not visible on Sentry dashboard.
                     * */
                    scope.setExtra("Stack Trace", stringStackTrace);
                    scope.setLevel(SentryLevel.ERROR);
                    scope.setTag("source", "appsmith-internal-server");
                }
        );

        if (error instanceof BaseException) {
            BaseException baseError = (BaseException) error;
            if (baseError.getErrorAction() == AppsmithErrorAction.LOG_EXTERNALLY) {
                Sentry.configureScope(scope -> {
                    baseError.getContextMap().forEach(scope::setTag);
                });
                final User user = new User();
                user.setEmail(baseError.getContextMap().getOrDefault(MDCFilter.USER_EMAIL, "unknownUser"));
                Sentry.setUser(user);
                Sentry.captureException(error);
            }
        } else {
            Sentry.captureException(error);
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

        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response;

        // Do special formatting for this error to run the message string into valid jsonified string
        if (AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE.getAppErrorCode().equals(e.getError().getAppErrorCode())) {
            response = new ResponseDTO<>(e.getHttpStatus(), new ErrorDTO(e.getAppErrorCode(), e.getErrorType(), "{" + e.getMessage() + "}", e.getTitle()));
        } else {
            response = new ResponseDTO<>(e.getHttpStatus(), new ErrorDTO(e.getAppErrorCode(), e.getErrorType(), e.getMessage(), e.getTitle(), e.getReferenceDoc()));
        }

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchDuplicateKeyException(org.springframework.dao.DuplicateKeyException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.DUPLICATE_KEY;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);

        String urlPath = exchange.getRequest().getPath().toString();
        String conflictingObjectName = DuplicateKeyExceptionUtils.extractConflictingObjectName(e.getCause().getMessage());
        ResponseDTO<ErrorDTO> response =  new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(), appsmithError.getErrorType(),
                appsmithError.getMessage(conflictingObjectName), appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchTimeoutException(java.util.concurrent.TimeoutException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.PLUGIN_EXECUTION_TIMEOUT;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(), appsmithError.getErrorType(),
                appsmithError.getMessage(), appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler(WebExchangeBindException.class)
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchWebExchangeBindException(
            WebExchangeBindException exc, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.VALIDATION_FAILURE;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        Map<String, String> errors = new HashMap<>();
        exc.getBindingResult()
                .getAllErrors()
                .forEach(
                        (error) -> {
                            String fieldName = ((FieldError) error).getField();
                            String errorMessage = error.getDefaultMessage();
                            errors.put(fieldName, errorMessage);
                        });
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(), appsmithError.getErrorType(),
                appsmithError.getMessage(errors.toString()), appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }


    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchServerWebInputException(ServerWebInputException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.GENERIC_BAD_REQUEST;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String errorMessage = e.getReason();
        if (e.getMethodParameter() != null) {
            errorMessage = "Malformed parameter '" + e.getMethodParameter().getParameterName()
                    + "' for " + e.getMethodParameter().getContainingClass().getSimpleName()
                    + (e.getMethodParameter().getMethod() != null ? "." + e.getMethodParameter().getMethod().getName() : "");
        }

        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(), appsmithError.getErrorType(),
                appsmithError.getMessage(errorMessage), appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchPluginException(AppsmithPluginException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.INTERNAL_SERVER_ERROR;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(),
                e.getMessage(), e.getErrorType(), e.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchAccessDeniedException(AccessDeniedException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.UNAUTHORIZED_ACCESS;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(),
                appsmithError.getErrorType(), appsmithError.getMessage(), appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchDataBufferLimitException(DataBufferLimitException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.FILE_PART_DATA_BUFFER_ERROR;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(), appsmithError.getErrorType(),
                appsmithError.getMessage(e.getMessage()), appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
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
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(appsmithError.getHttpErrorCode(), new ErrorDTO(appsmithError.getAppErrorCode(), appsmithError.getErrorType(),
                appsmithError.getMessage(), appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    private Mono<ResponseDTO<ErrorDTO>> getResponseDTOMono(String urlPath, ResponseDTO<ErrorDTO> response) {
        if(urlPath.contains("/git") && urlPath.contains("/app")) {
            String appId = urlPath.substring(urlPath.lastIndexOf('/') + 1);
            if(StringUtils.isEmpty(appId)) {
                return Mono.just(response);
            }
            return redisUtils.releaseFileLock(appId)
                    .then(Mono.just(response));
        }
        return Mono.just(response);
    }
}