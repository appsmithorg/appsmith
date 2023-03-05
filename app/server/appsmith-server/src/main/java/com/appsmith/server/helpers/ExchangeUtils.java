package com.appsmith.server.helpers;

import com.appsmith.server.constants.FieldName;
import org.apache.commons.lang3.ObjectUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

public class ExchangeUtils {

    public static final String HEADER_ANONYMOUS_USER_ID = "X-Anonymous-User-Id";

    /**
     * Returns the value of `X-Anonymous-User-Id` header, from the _current_ request. Since this gets the header from
     * the current request, it has to be called from a request context. It won't work in new background contexts, like
     * when calling `.subscribe()` on a Mono.
     * @return a Mono that resolves to the value of the `X-Anonymous-User-Id` header, if present. Else, `FieldName.ANONYMOUS_USER`.
     */
    public static Mono<String> getAnonymousUserIdFromCurrentRequest() {
        return Mono.deferContextual(Mono::just)
                .map(contextView -> ObjectUtils.defaultIfNull(
                        contextView.get(ServerWebExchange.class).getRequest().getHeaders().getFirst(HEADER_ANONYMOUS_USER_ID),
                        FieldName.ANONYMOUS_USER
                ))
                // An error is thrown when the context is not available. We don't want to fail the request in this case.
                .onErrorResume(error -> Mono.empty())
                .defaultIfEmpty(FieldName.ANONYMOUS_USER);
    }

}
