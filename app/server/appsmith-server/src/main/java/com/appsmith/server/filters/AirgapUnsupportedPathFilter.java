package com.appsmith.server.filters;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.server.RequestPath;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.constants.Url.APPLICATION_URL;
import static com.appsmith.server.constants.Url.APP_TEMPLATE_URL;
import static com.appsmith.server.constants.Url.DATASOURCE_URL;
import static com.appsmith.server.constants.Url.MARKETPLACE_URL;
import static com.appsmith.server.constants.Url.SAAS_URL;
import static com.appsmith.server.constants.Url.USAGE_PULSE_URL;
import static com.appsmith.server.constants.ce.UrlCE.MOCKS;
import static com.appsmith.server.constants.ce.UrlCE.RELEASE_ITEMS;

/**
 * Webfilter which will block the APIs that are not supported in Airgap instances
 */
@Slf4j
public class AirgapUnsupportedPathFilter implements WebFilter {

    private final AirgapInstanceConfig airgapInstanceConfig;

    public AirgapUnsupportedPathFilter(AirgapInstanceConfig airgapInstanceConfig) {
        this.airgapInstanceConfig = airgapInstanceConfig;
    }

    private static final String WILDCARD_SUFFIX = "/**";

    private static final List<String> blockedPaths = List.of(
        APP_TEMPLATE_URL + WILDCARD_SUFFIX,
        MARKETPLACE_URL + WILDCARD_SUFFIX,
        DATASOURCE_URL + MOCKS,
        USAGE_PULSE_URL + WILDCARD_SUFFIX,
        APPLICATION_URL + RELEASE_ITEMS,
        SAAS_URL + WILDCARD_SUFFIX
    );

    @NotNull
    @Override
    public Mono<Void> filter(@NotNull ServerWebExchange exchange, @NotNull WebFilterChain chain) {
        if (!airgapInstanceConfig.isAirgapEnabled() || !isRequestPathMatched(exchange.getRequest().getPath())) {
            return chain.filter(exchange);
        }
        log.info("Client is trying to access blocked URI path in air-gap instance {}", exchange.getRequest().getPath());
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    private boolean isRequestPathMatched(RequestPath requestPath) {
        AntPathMatcher matcher = new AntPathMatcher();
        return blockedPaths
                .stream()
                .anyMatch(blockedPath -> matcher.match(blockedPath, requestPath.value()));
    }
}
