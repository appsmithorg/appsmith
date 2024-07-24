package com.appsmith.server.exceptions;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.util.DuplicateKeyExceptionUtils;
import com.appsmith.server.helpers.CommonGitFileUtils;
import com.appsmith.server.helpers.RedisUtils;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import io.micrometer.core.instrument.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.JGitInternalException;
import org.eclipse.jgit.errors.LockFailedException;
import org.springframework.core.io.buffer.DataBufferLimitException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.ServerWebInputException;
import reactor.core.publisher.Mono;

import java.io.File;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import static com.appsmith.server.exceptions.util.SentryLogger.doLog;

/**
 * This class catches all the Exceptions and formats them into a proper ResponseDTO<ErrorDTO> object before
 * sending it to the client.
 */
@ControllerAdvice
@RequiredArgsConstructor
@Slf4j
public class GlobalExceptionHandler {

    private final RedisUtils redisUtils;

    private final AnalyticsService analyticsService;

    private final CommonGitFileUtils commonGitFileUtils;

    private final SessionUserService sessionUserService;

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
        if (AppsmithError.INVALID_DYNAMIC_BINDING_REFERENCE
                .getAppErrorCode()
                .equals(e.getError().getAppErrorCode())) {
            response = new ResponseDTO<>(
                    e.getHttpStatus(),
                    new ErrorDTO(e.getAppErrorCode(), e.getErrorType(), "{" + e.getMessage() + "}", e.getTitle()));
        } else {
            response = new ResponseDTO<>(
                    e.getHttpStatus(),
                    new ErrorDTO(
                            e.getAppErrorCode(), e.getErrorType(), e.getMessage(), e.getTitle(), e.getReferenceDoc()));
        }

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchDuplicateKeyException(
            org.springframework.dao.DuplicateKeyException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.DUPLICATE_KEY;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);

        String urlPath = exchange.getRequest().getPath().toString();
        String conflictingObjectName = DuplicateKeyExceptionUtils.extractConflictingObjectName(
                e.getCause().getMessage());
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(
                appsmithError.getHttpErrorCode(),
                new ErrorDTO(
                        appsmithError.getAppErrorCode(),
                        appsmithError.getErrorType(),
                        appsmithError.getMessage(conflictingObjectName),
                        appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchTimeoutException(
            java.util.concurrent.TimeoutException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.PLUGIN_EXECUTION_TIMEOUT;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(
                appsmithError.getHttpErrorCode(),
                new ErrorDTO(
                        appsmithError.getAppErrorCode(),
                        appsmithError.getErrorType(),
                        appsmithError.getMessage(),
                        appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler(WebExchangeBindException.class)
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchWebExchangeBindException(
            WebExchangeBindException exc, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.VALIDATION_FAILURE;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        Map<String, String> errors = new HashMap<>();
        exc.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(
                appsmithError.getHttpErrorCode(),
                new ErrorDTO(
                        appsmithError.getAppErrorCode(),
                        appsmithError.getErrorType(),
                        appsmithError.getMessage(errors.toString()),
                        appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchServerWebInputException(
            ServerWebInputException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.GENERIC_BAD_REQUEST;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));

        StringBuilder builder = new StringBuilder();
        Throwable t = e;
        for (int turn = 0; t != null && turn < 10; ++turn) {
            if (turn > 0) {
                builder.append(";; ");
            }
            builder.append(t.getMessage());
            t = t.getCause();
        }
        log.warn(builder.toString());

        String errorMessage = e.getReason();
        if (e.getMethodParameter() != null) {
            errorMessage = "Malformed parameter '" + e.getMethodParameter().getParameterName()
                    + "' for " + e.getMethodParameter().getContainingClass().getSimpleName()
                    + (e.getMethodParameter().getMethod() != null
                            ? "." + e.getMethodParameter().getMethod().getName()
                            : "");
        }

        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(
                appsmithError.getHttpErrorCode(),
                new ErrorDTO(
                        appsmithError.getAppErrorCode(),
                        appsmithError.getErrorType(),
                        appsmithError.getMessage(errorMessage),
                        appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchPluginException(AppsmithPluginException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.INTERNAL_SERVER_ERROR;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(
                e.getHttpStatus(), new ErrorDTO(e.getAppErrorCode(), e.getErrorType(), e.getMessage(), e.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchAccessDeniedException(AccessDeniedException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.UNAUTHORIZED_ACCESS;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(
                appsmithError.getHttpErrorCode(),
                new ErrorDTO(
                        appsmithError.getAppErrorCode(),
                        appsmithError.getErrorType(),
                        appsmithError.getMessage(),
                        appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchDataBufferLimitException(
            DataBufferLimitException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.FILE_PART_DATA_BUFFER_ERROR;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(
                appsmithError.getHttpErrorCode(),
                new ErrorDTO(
                        appsmithError.getAppErrorCode(),
                        appsmithError.getErrorType(),
                        appsmithError.getMessage(e.getMessage()),
                        appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<Void>> catchResponseStatusException(ResponseStatusException e, ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(e.getStatusCode());

        String urlPath = exchange.getRequest().getPath().toString();
        ResponseDTO<Void> response = new ResponseDTO<>(e.getStatusCode().value(), null, e.getMessage(), false);

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
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(
                appsmithError.getHttpErrorCode(),
                new ErrorDTO(
                        appsmithError.getAppErrorCode(),
                        appsmithError.getErrorType(),
                        appsmithError.getMessage(),
                        appsmithError.getTitle()));

        return getResponseDTOMono(urlPath, response);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchJGitInternalException(JGitInternalException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.GIT_FILE_IN_USE;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String urlPath = exchange.getRequest().getPath().toString();
        if (e.getCause() instanceof LockFailedException) {
            LockFailedException lockFailedException = (LockFailedException) e.getCause();
            return deleteLockFileAndSendAnalytics(lockFailedException.getFile(), urlPath)
                    .flatMap(status -> getResponseDTOGitException(urlPath));
        }
        return getResponseDTOGitException(urlPath);
    }

    @ExceptionHandler
    @ResponseBody
    public Mono<ResponseDTO<ErrorDTO>> catchLockFailedException(LockFailedException e, ServerWebExchange exchange) {
        AppsmithError appsmithError = AppsmithError.GIT_FILE_IN_USE;
        exchange.getResponse().setStatusCode(HttpStatus.resolve(appsmithError.getHttpErrorCode()));
        doLog(e);
        String urlPath = exchange.getRequest().getPath().toString();
        return deleteLockFileAndSendAnalytics(e.getFile(), urlPath)
                .flatMap(status -> getResponseDTOGitException(urlPath));
    }

    private Mono<Boolean> deleteLockFileAndSendAnalytics(File file, String urlPath) {
        return commonGitFileUtils.deleteIndexLockFile(Path.of(file.getPath())).flatMap(fileTime -> {
            Map<String, Object> analyticsProps = new HashMap<>();
            if (urlPath.contains("/git") && urlPath.contains("/app")) {
                String appId = getAppIdFromUrlPath(urlPath);
                analyticsProps.put(FieldName.APPLICATION_ID, appId);
            }
            if (!fileTime.equals(0L)) {
                analyticsProps.put(FieldName.FILE_LOCK_DURATION, fileTime);
                return sessionUserService
                        .getCurrentUser()
                        .flatMap(user -> analyticsService.sendEvent(
                                AnalyticsEvents.GIT_STALE_FILE_LOCK_DELETED.toString(),
                                user.getUsername(),
                                analyticsProps))
                        .thenReturn(true);
            }
            return Mono.just(false);
        });
    }

    private Mono<ResponseDTO<ErrorDTO>> getResponseDTOGitException(String urlPath) {
        AppsmithError appsmithError = AppsmithError.INTERNAL_SERVER_ERROR;
        ResponseDTO<ErrorDTO> response = new ResponseDTO<>(
                appsmithError.getHttpErrorCode(),
                new ErrorDTO(
                        appsmithError.getAppErrorCode(),
                        appsmithError.getErrorType(),
                        appsmithError.getMessage(),
                        appsmithError.getTitle()));
        return getResponseDTOMono(urlPath, response);
    }

    private <T> Mono<ResponseDTO<T>> getResponseDTOMono(String urlPath, ResponseDTO<T> response) {
        if (urlPath.contains("/git") && urlPath.contains("/app")) {
            String appId = getAppIdFromUrlPath(urlPath);
            if (StringUtils.isEmpty(appId)) {
                return Mono.just(response);
            }
            return redisUtils.releaseFileLock(appId).then(Mono.just(response));
        }
        return Mono.just(response);
    }

    private String getAppIdFromUrlPath(String urlPath) {
        return urlPath.substring(urlPath.lastIndexOf('/') + 1);
    }
}
