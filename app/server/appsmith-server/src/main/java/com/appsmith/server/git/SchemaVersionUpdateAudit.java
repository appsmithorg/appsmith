package com.appsmith.server.git;

import com.appsmith.external.constants.AnalyticsEvents;
import reactor.core.publisher.Mono;

/**
 * After a commit, the server writes schema versions onto the application.
 * That save is not the user editing the app, so its update audit row is skipped.
 * The commit row and the deploy row are outside this context.
 */
public final class SchemaVersionUpdateAudit {

    public static final String CONTEXT_KEY = "suppressSchemaVersionUpdateAudit";

    private SchemaVersionUpdateAudit() {}

    public static <T> Mono<T> suppress(Mono<T> operation) {
        return operation.contextWrite(context -> context.put(CONTEXT_KEY, Boolean.TRUE));
    }

    public static boolean skipsAuditLog(AnalyticsEvents event) {
        return AnalyticsEvents.UPDATE.equals(event);
    }
}
