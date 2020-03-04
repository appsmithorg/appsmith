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
    }
}
