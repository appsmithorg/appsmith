package com.appsmith.server.onpageload.executables;

import com.appsmith.external.models.Executable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ExecutableOnPageLoadServiceCE<T extends Executable> {

    Flux<Executable> getAllExecutablesByPageIdFlux(String pageId);

    Mono<Executable> fillSelfReferencingPaths(T executable);

    Flux<Executable> getUnpublishedOnLoadExecutablesExplicitSetByUserInPageFlux(String pageId);
}
