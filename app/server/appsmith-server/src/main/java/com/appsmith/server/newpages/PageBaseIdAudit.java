package com.appsmith.server.newpages;

import com.appsmith.external.constants.AnalyticsEvents;
import reactor.core.publisher.Mono;

/**
 * A new page has no id until it is saved, so the server then writes that id into {@code baseId}.
 * That write is not the user editing the page, so its update audit row is skipped.
 * The page created row, and a later edit of the page, do not set this context.
 */
public final class PageBaseIdAudit {

    public static final String CONTEXT_KEY = "suppressPageBaseIdAudit";

    private PageBaseIdAudit() {}

    public static <T> Mono<T> suppress(Mono<T> operation) {
        return operation.contextWrite(context -> context.put(CONTEXT_KEY, Boolean.TRUE));
    }

    public static boolean skipsAuditLog(AnalyticsEvents event) {
        return AnalyticsEvents.UPDATE.equals(event);
    }
}
