package com.appsmith.server.filters;

import com.appsmith.server.configurations.ProjectProperties;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

/**
 * Add `X-Appsmith-Version` header set to the current Appsmith version to _all_ responses.
 */
@Component
@RequiredArgsConstructor
public class VersionHeaderFilter implements WebFilter {
    private final ProjectProperties projectProperties;

    @NotNull @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        exchange.getResponse().getHeaders().add("X-Appsmith-Version", projectProperties.getVersion());
        return chain.filter(exchange);
    }
}
