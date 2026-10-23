package com.appsmith.server.git;

import com.appsmith.external.constants.AnalyticsEvents;
import reactor.core.publisher.Mono;

/**
 * Git reload operations import and publish the application as an implementation detail.
 * Those saves are not the user importing a file, deploying, or editing, so their audit rows are skipped.
 * A downloaded JSON import and the Deploy button do not set this context, and neither does importing a new
 * application from a Git repository.
 */
public final class GitRehydrateAudit {

    public static final String CONTEXT_KEY = "suppressGitRehydrateAudit";

    private GitRehydrateAudit() {}

    public static <T> Mono<T> suppress(Mono<T> operation) {
        return operation.contextWrite(context -> context.put(CONTEXT_KEY, Boolean.TRUE));
    }

    public static boolean skipsAuditLog(AnalyticsEvents event) {
        return AnalyticsEvents.IMPORT.equals(event)
                || AnalyticsEvents.PUBLISH_APPLICATION.equals(event)
                || AnalyticsEvents.UPDATE.equals(event)
                || AnalyticsEvents.UPDATE_LAYOUT.equals(event);
    }
}
