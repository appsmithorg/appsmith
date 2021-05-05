package com.appsmith.server.exceptions;

import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.server.dtos.ResponseDTO;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.ResourceProperties;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.autoconfigure.web.reactive.error.DefaultErrorWebExceptionHandler;
import org.springframework.boot.web.reactive.error.ErrorAttributes;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
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
@Order(-2)
public class AppSmithErrorWebExceptionHandler extends DefaultErrorWebExceptionHandler {
    @Autowired
    public AppSmithErrorWebExceptionHandler(ErrorAttributes errorAttributes, ResourceProperties resourceProperties,
                                            ServerProperties serverProperties, ApplicationContext applicationContext,
                                            ObjectProvider<ViewResolver> viewResolvers,
                                            ServerCodecConfigurer serverCodecConfigurer) {
        super(errorAttributes, resourceProperties, serverProperties.getError(), applicationContext);
        this.setViewResolvers(viewResolvers.orderedStream().collect(Collectors.toList()));
        this.setMessageWriters(serverCodecConfigurer.getWriters());
        this.setMessageReaders(serverCodecConfigurer.getReaders());
    }

    @Override
    protected RouterFunction<ServerResponse> getRoutingFunction(ErrorAttributes errorAttributes) {
        return route(all(), this::render);
    }

    private Mono<ServerResponse> render(ServerRequest request) {
        Map<String, Object> error = getErrorAttributes(request, false);
        int errorCode = getHttpStatus(error);

        return ServerResponse.status(errorCode).
                contentType(MediaType.APPLICATION_JSON).
                body(BodyInserters.
                        fromValue(new ResponseDTO<>(errorCode, new ErrorDTO(errorCode, String.valueOf(error.get("error"))))));
    }
}
