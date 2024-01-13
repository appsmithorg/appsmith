package com.appsmith.server.onload.executables;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Executable;
import com.appsmith.server.domains.Layout;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ExecutableOnLoadServiceCE<T extends BaseDomain> {

    Flux<Executable> getAllExecutablesByCreatorIdFlux(String creatorId);

    Mono<Executable> fillSelfReferencingPaths(Executable executable);

    Flux<Executable> getUnpublishedOnLoadExecutablesExplicitSetByUserInPageFlux(String creatorId);

    Mono<Executable> updateUnpublishedExecutable(String id, Executable executable);

    Mono<Layout> findAndUpdateLayout(String creatorId, String layoutId, Layout layout);
}
