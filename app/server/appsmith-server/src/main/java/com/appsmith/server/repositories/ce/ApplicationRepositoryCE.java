package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomApplicationRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Repository
public interface ApplicationRepositoryCE extends BaseRepository<Application, String>, CustomApplicationRepository {

    Flux<Application> findByIdIn(List<String> ids);

    Flux<Application> findByOrganizationId(String organizationId);

    Flux<Application> findByClonedFromApplicationId(String clonedFromApplicationId);

    Mono<Long> countByDeletedAtNull();

}
