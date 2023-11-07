package com.appsmith.server.onload.executables;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Executable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ExecutableOnLoadServiceCE<T extends BaseDomain> {

    Flux<Executable> getAllExecutablesByCreatorIdFlux(String pageId);

    Mono<Executable> fillSelfReferencingPaths(Executable executable);

    Flux<Executable> getUnpublishedOnLoadExecutablesExplicitSetByUserInPageFlux(String pageId);

    Mono<Executable> updateUnpublishedExecutable(String id, Executable executable);
}
