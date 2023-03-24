package com.appsmith.server.helpers;

import com.appsmith.server.constants.FieldName;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public class ExchangeUtils {

    public static final String HEADER_ANONYMOUS_USER_ID = "X-Anonymous-User-Id";
    public static final String USER_AGENT = "User-Agent";

    private ExchangeUtils() {
        // This is a utility class. Instantiation is not allowed.
    }

    /**
     * Returns the value of the given header, from the _current_ request. Since this gets the header from
     * the current request, it has to be called from a request context. It won't work in new background contexts, like
     * when calling `.subscribe()` on a Mono.
     * @return a Mono that resolves to the value of the given header, if present. Else, an empty Mono.
     * @param headerName The header name to look for.
     */
    private static Mono<String> getHeaderFromCurrentRequest(String headerName) {
        return Mono.deferContextual(Mono::just)
                .flatMap(contextView -> Mono.justOrEmpty(
                        contextView.get(ServerWebExchange.class).getRequest().getHeaders().getFirst(headerName)
                ))
                // An error is thrown when the context is not available. We don't want to fail the request in this case.
                .onErrorResume(error -> Mono.empty());
    }

    /**
     * Returns the value of `X-Anonymous-User-Id` header, from the _current_ request. Since this gets the header from
     * the current request, it has to be called from a request context. It won't work in new background contexts, like
     * when calling `.subscribe()` on a Mono.
     * @return a Mono that resolves to the value of the `X-Anonymous-User-Id` header, if present. Else, `FieldName.ANONYMOUS_USER`.
     */
    public static Mono<String> getAnonymousUserIdFromCurrentRequest() {
        return getHeaderFromCurrentRequest(HEADER_ANONYMOUS_USER_ID)
            .defaultIfEmpty(FieldName.ANONYMOUS_USER);
    }

    public static Mono<String> getUserAgentFromCurrentRequest() {
        return getHeaderFromCurrentRequest(USER_AGENT)
            .defaultIfEmpty("unavailable");
    }

}
