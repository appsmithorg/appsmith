package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import com.appsmith.server.repositories.ce.ApplicationRepositoryCE;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface ApplicationRepository extends ApplicationRepositoryCE, CustomApplicationRepository {

    Flux<Application> findAllByWorkspaceIdIn(Iterable<String> workspaceIds);
    Mono<Application> findFirstByWorkspaceId(String workspaceId);

}
