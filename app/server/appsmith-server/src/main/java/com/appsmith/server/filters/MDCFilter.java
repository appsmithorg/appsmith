package com.appsmith.server.filters;

import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.LogHelper;
import com.appsmith.server.helpers.UserOrganizationHelper;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import reactor.util.context.Context;

import java.util.Map;

import static com.appsmith.external.constants.MDCConstants.USER_EMAIL;
import static com.appsmith.server.constants.ce.FieldNameCE.ORGANIZATION_ID;
import static java.util.stream.Collectors.toMap;

/**
 * This class parses all headers that start with X-MDC-* and set them in the logger MDC.
 * These MDC parameters are also set in the response object before being sent to the user.
 */
@Component
@Slf4j
public class MDCFilter implements WebFilter {

    private final UserOrganizationHelper userOrganizationHelper;
    private static final String MDC_HEADER_PREFIX = "X-MDC-";

    /**
     * This header is added to the request by Caddy. We don't copy it to the response since that is also done by Caddy.
     * We read it from the request, _only_ to log it.
     */
    @SuppressWarnings("UastIncorrectHttpHeaderInspection")
    public static final String INTERNAL_REQUEST_ID_HEADER = "X-Appsmith-Request-Id";

    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    public MDCFilter(UserOrganizationHelper userOrganizationHelper) {
        this.userOrganizationHelper = userOrganizationHelper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        try {
            return ReactiveSecurityContextHolder.getContext()
                    .map(ctx -> ctx.getAuthentication().getPrincipal())
                    .zipWith(userOrganizationHelper
                            .getCurrentUserOrganizationId()
                            .defaultIfEmpty(""))
                    .flatMap(tuple2 -> {
                        final Object principal = tuple2.getT1();
                        final String organizationId = tuple2.getT2();
                        final User user = principal instanceof User ? (User) principal : null;
                        return chain.filter(exchange)
                                .contextWrite(ctx ->
                                        addRequestHeadersToContext(exchange.getRequest(), ctx, user, organizationId));
                    });
        } finally {
            MDC.clear();
        }
    }

    private Context addRequestHeadersToContext(
            final ServerHttpRequest request, final Context context, final User user, final String organizationId) {
        final Map<String, String> contextMap = request.getHeaders().toSingleValueMap().entrySet().stream()
                .filter(x -> x.getKey().startsWith(MDC_HEADER_PREFIX))
                .collect(toMap(v -> v.getKey().substring((MDC_HEADER_PREFIX.length())), Map.Entry::getValue));

        if (user != null) {
            contextMap.put(USER_EMAIL, user.getEmail());
        }

        if (StringUtils.hasLength(organizationId)) {
            contextMap.put(ORGANIZATION_ID, organizationId);
        }

        final String internalRequestId = request.getHeaders().getFirst(INTERNAL_REQUEST_ID_HEADER);
        contextMap.put(INTERNAL_REQUEST_ID_HEADER, internalRequestId);

        final String requestId = request.getHeaders().getFirst(REQUEST_ID_HEADER);
        if (!StringUtils.isEmpty(requestId)) {
            contextMap.put(REQUEST_ID_HEADER, requestId);
        }

        // Set the MDC context here for regular non-reactive logs
        MDC.setContextMap(contextMap);

        // Setting the context map to the reactive context. This will be used in the reactive logger to print the MDC
        return context.put(LogHelper.CONTEXT_MAP, contextMap);
    }
}
