package com.appsmith.server.filters;

import com.appsmith.server.acl.AclService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {

        return chain.filter(exchange);

//        ServerHttpRequest request = exchange.getRequest();
//        HttpMethod httpMethod = request.getMethod();
//        String url = request.getPath().value();
//        String[] urlParts = url.split("/");
//
//        // This is because all the urls are of the form /api/v1/{resource}. When we split by "/", the resource is always
//        // the 4th element in the result array
//        if (urlParts.length < 4) {
//            log.debug("Got request path {}. Not applying ACL filter", request.getPath());
//            return chain.filter(exchange);
//        }
//
//        String resource = urlParts[3];
//
//        Mono<OpaResponse> aclResponse = aclService.evaluateAcl(httpMethod, resource, url);
//        return aclResponse
//                .map(acl -> {
//                    log.debug("Got ACL response: {}", acl);
//                    return acl;
//                })
//                .flatMap(acl -> {
//                    if (acl != null && acl.isSuccessful()) {
//                        // Acl returned true. Continue with the filter chain
//                        return chain.filter(exchange);
//                    }
//
//                    // The Acl response is false. Return unauthorized exception to the client
//                    // We construct the error response JSON here because throwing an exception here doesn't get caught
//                    // in the {@see GlobalExceptionHandler}.
//                    AppsmithError error = AppsmithError.UNAUTHORIZED_ACCESS;
//                    exchange.getResponse().setStatusCode(HttpStatus.resolve(error.getHttpErrorCode()));
//                    exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
//                    try {
//                        ResponseDTO<ErrorDTO> responseBody = new ResponseDTO<>(error.getHttpErrorCode(), new ErrorDTO(error.getAppErrorCode(),
//                                error.getMessage()));
//                        String responseStr = objectMapper.writeValueAsString(responseBody);
//                        DataBuffer buffer = exchange.getResponse().bufferFactory().allocateBuffer().write(responseStr.getBytes());
//                        return exchange.getResponse().writeWith(Mono.just(buffer));
//                    } catch (JsonProcessingException e) {
//                        log.error("Exception caught while serializing JSON in AclFilter. Cause: ", e);
//                        return exchange.getResponse().writeWith(Mono.empty());
//                    }
//                });
    }
}
