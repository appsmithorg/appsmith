package com.appsmith.server.services;

import com.appsmith.external.constants.AnalyticsEvents;
import reactor.core.publisher.Mono;
import reactor.util.context.ContextView;

/**
 * Fork and application JSON import save the copy through the normal create and update methods.
 * Those saves are not the user creating or editing, so their audit rows are skipped.
 * The fork row and the import row are not in this list. Other requests do not set this context.
 */
public final class ArtifactCopyAudit {

    public static final String CONTEXT_KEY = "suppressArtifactCopyAudit";

    private ArtifactCopyAudit() {}

    public static <T> Mono<T> suppress(Mono<T> operation) {
        return operation.contextWrite(context -> context.put(CONTEXT_KEY, Boolean.TRUE));
    }

    public static boolean isActive(ContextView context) {
        return Boolean.TRUE.equals(context.getOrDefault(CONTEXT_KEY, Boolean.FALSE));
    }

    public static boolean skipsAuditLog(AnalyticsEvents event) {
        return AnalyticsEvents.CREATE.equals(event)
                || AnalyticsEvents.UPDATE.equals(event)
                || AnalyticsEvents.UPDATE_LAYOUT.equals(event)
                || AnalyticsEvents.PUBLISH_APPLICATION.equals(event);
    }
}
