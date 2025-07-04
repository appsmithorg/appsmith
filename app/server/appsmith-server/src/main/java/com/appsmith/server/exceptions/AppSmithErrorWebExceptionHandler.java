package com.appsmith.server.exceptions;

import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.server.dtos.ResponseDTO;
import jakarta.annotation.Nonnull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.autoconfigure.web.reactive.error.DefaultErrorWebExceptionHandler;
import org.springframework.boot.web.error.ErrorAttributeOptions;
import org.springframework.boot.web.reactive.error.ErrorAttributes;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.ServerRequest;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.reactive.result.view.ViewResolver;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.stream.Collectors;

import static org.springframework.web.reactive.function.server.RequestPredicates.all;
import static org.springframework.web.reactive.function.server.RouterFunctions.route;

@Component
@Slf4j
@Order(-2)
public class AppSmithErrorWebExceptionHandler extends DefaultErrorWebExceptionHandler {

    public static final String DESERIALIZATION_ERROR_MESSAGE =
            "Failed to deserialize payload. Is the byte array a result of corresponding serialization for DefaultDeserializer";

    @Autowired
    public AppSmithErrorWebExceptionHandler(
            ErrorAttributes errorAttributes,
            WebProperties webProperties,
            ServerProperties serverProperties,
            ApplicationContext applicationContext,
            ObjectProvider<ViewResolver> viewResolvers,
            ServerCodecConfigurer serverCodecConfigurer) {
        super(errorAttributes, webProperties.getResources(), serverProperties.getError(), applicationContext);
        this.setViewResolvers(viewResolvers.orderedStream().collect(Collectors.toList()));
        this.setMessageWriters(serverCodecConfigurer.getWriters());
        this.setMessageReaders(serverCodecConfigurer.getReaders());
    }

    @Override
    protected RouterFunction<ServerResponse> getRoutingFunction(ErrorAttributes errorAttributes) {
        return route(all(), this::render);
    }

    @Override
    protected int getHttpStatus(Map<String, Object> errorAttributes) {
        Object status = errorAttributes.get("status");
        if (status instanceof Integer) {
            return (Integer) status;
        }
        if (status instanceof String) {
            try {
                return Integer.parseInt((String) status);
            } catch (NumberFormatException e) {
                log.warn("Could not parse status as integer: {}", status);
            }
        }

        // If status is missing or invalid, check for exception type
        Object error = errorAttributes.get("error");
        if (error instanceof Throwable) {
            Throwable throwable = (Throwable) error;
            if (throwable instanceof AppsmithException) {
                return ((AppsmithException) throwable).getHttpStatus();
            }
            if (throwable instanceof AppsmithPluginException) {
                return ((AppsmithPluginException) throwable).getHttpStatus();
            }
        }

        // Default to 500 if we can't determine the status
        log.warn(
                "Could not determine HTTP status from error attributes, defaulting to 500. Error attributes: {}",
                errorAttributes);
        return 500;
    }

    @Nonnull
    private Mono<ServerResponse> render(ServerRequest request) {
        Map<String, Object> error =
                getErrorAttributes(request, ErrorAttributeOptions.of(ErrorAttributeOptions.Include.STACK_TRACE));
        int errorCode = getHttpStatus(error);

        ServerResponse.BodyBuilder responseBuilder =
                ServerResponse.status(errorCode).contentType(MediaType.APPLICATION_JSON);

        if (errorCode == 500 && String.valueOf(error.get("trace")).contains(DESERIALIZATION_ERROR_MESSAGE)) {
            // If the error is regarding a deserialization error in the session data, then the user is essentially
            // locked out.
            // They have to use a different browser, or Incognito, or clear their cookies to get back in. So, we'll
            // delete
            // the SESSION cookie here, so that the user gets sent back to the Login page, and they can unblock
            // themselves.
            responseBuilder = responseBuilder.cookie(ResponseCookie.from("SESSION", "")
                    .httpOnly(true)
                    .path("/")
                    .maxAge(0)
                    .build());
        }

        return responseBuilder.body(BodyInserters.fromValue(new ResponseDTO<>(
                errorCode, new ErrorDTO(String.valueOf(errorCode), String.valueOf(error.get("error"))))));
    }
}
