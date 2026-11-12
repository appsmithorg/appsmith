package com.appsmith.server.git;

import reactor.core.publisher.Mono;
import reactor.util.context.ContextView;

/**
 * Marks the Discard button request. A branch creation and an auto-deploy also discard changes,
 * and those calls do not set this context, so they do not get a discard audit row.
 */
public final class UserDiscardAudit {

    public static final String CONTEXT_KEY = "auditUserDiscard";

    private UserDiscardAudit() {}

    public static <T> Mono<T> mark(Mono<T> operation) {
        return operation.contextWrite(context -> context.put(CONTEXT_KEY, Boolean.TRUE));
    }

    public static boolean isMarked(ContextView context) {
        return Boolean.TRUE.equals(context.getOrDefault(CONTEXT_KEY, Boolean.FALSE));
    }
}
