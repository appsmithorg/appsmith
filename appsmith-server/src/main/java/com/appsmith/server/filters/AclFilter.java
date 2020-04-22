package com.appsmith.server.filters;

import com.appsmith.server.acl.AclService;
import com.appsmith.server.acl.OpaResponse;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.ErrorDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class AclFilter implements WebFilter {

    final AclService aclService;
    final ObjectMapper objectMapper;

    @Autowired
    public AclFilter(AclService aclService, ObjectMapper objectMapper) {
        this.aclService = aclService;
        this.objectMapper = objectMapper;
    }

    /**
     * This function invokes the AclService using parameters parsed from the url.
     * The parameters are:
     * 1. HTTP Method - GET, POST etc.
     * 2. Resource being accessed - layouts, pages , etc
     * <p>
     * The ACL policy filters user access based on the permissions that the user has and the resource they are trying
     * to access
     * <p>
     * Check @see src/main/resources/acl.rego for details of a sample ACL policy
     *
     * @param exchange
     * @param chain
     * @return
     */
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        HttpMethod httpMethod = request.getMethod();
        String url = request.getPath().value();
        String[] urlParts = url.split("/");

        // This is because all the urls are of the form /api/v1/{resource}. When we split by "/", the resource is always
        // the 4th element in the result array
        if (urlParts.length < 4) {
            log.debug("Got request path {}. Not applying ACL filter", request.getPath());
            return chain.filter(exchange);
        }

        String resource = urlParts[3];

        Mono<OpaResponse> aclResponse = aclService.evaluateAcl(httpMethod, resource, url);
        return aclResponse
                .map(acl -> {
                    log.debug("Got ACL response: {}", acl);
                    return acl;
                })
                .flatMap(acl -> {
                    if (acl != null && acl.isSuccessful()) {
                        // Acl returned true. Continue with the filter chain
                        return chain.filter(exchange);
                    }

                    // The Acl response is false. Return unauthorized exception to the client
                    // We construct the error response JSON here because throwing an exception here doesn't get caught
                    // in the {@see GlobalExceptionHandler}.
                    AppsmithError error = AppsmithError.UNAUTHORIZED_ACCESS;
                    exchange.getResponse().setStatusCode(HttpStatus.resolve(error.getHttpErrorCode()));
                    exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
                    try {
                        ResponseDTO<ErrorDTO> responseBody = new ResponseDTO<>(error.getHttpErrorCode(), new ErrorDTO(error.getAppErrorCode(),
                                error.getMessage()));
                        String responseStr = objectMapper.writeValueAsString(responseBody);
                        DataBuffer buffer = exchange.getResponse().bufferFactory().allocateBuffer().write(responseStr.getBytes());
                        return exchange.getResponse().writeWith(Mono.just(buffer));
                    } catch (JsonProcessingException e) {
                        log.error("Exception caught while serializing JSON in AclFilter. Cause: ", e);
                        return exchange.getResponse().writeWith(Mono.empty());
                    }
                });
    }
}
