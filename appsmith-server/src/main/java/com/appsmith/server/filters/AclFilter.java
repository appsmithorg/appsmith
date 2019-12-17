package com.appsmith.server.filters;

import com.appsmith.server.acl.AclService;
import com.appsmith.server.acl.OpaResponse;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
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

    @Autowired
    public AclFilter(AclService aclService) {
        this.aclService = aclService;
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
                .filter(acl -> acl.getResult())
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(acl -> chain.filter(exchange));
    }
}
