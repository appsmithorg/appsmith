package com.appsmith.server.onload.executables;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Executable;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

public interface ExecutableOnLoadServiceCE<T extends BaseDomain> {

    Flux<Executable> getAllExecutablesByCreatorIdFlux(String creatorId);

    Mono<Executable> fillSelfReferencingPaths(Executable executable);

    Flux<Executable> getUnpublishedOnLoadExecutablesExplicitSetByUserInPageFlux(String creatorId);

    Mono<Executable> updateUnpublishedExecutable(String id, Executable executable);

    Mono<Layout> findAndUpdateLayout(String creatorId, String layoutId, Layout layout);

    /**
     * Saves the layout only if the creator did not change since {@code expectedUpdatedAt}.
     *
     * <p>This default supports no revision check:
     * <ul>
     *   <li>{@code expectedUpdatedAt} is null: saves the layout without a check.
     *   <li>{@code expectedUpdatedAt} is set: fails with {@code INVALID_PARAMETER}.
     * </ul>
     * A creator type that supports the check overrides this method.
     */
    default Mono<Layout> findAndUpdateLayout(
            String creatorId, String layoutId, Layout layout, Instant expectedUpdatedAt) {
        if (expectedUpdatedAt == null) {
            return findAndUpdateLayout(creatorId, layoutId, layout);
        }
        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.EXPECTED_REVISION));
    }
}
