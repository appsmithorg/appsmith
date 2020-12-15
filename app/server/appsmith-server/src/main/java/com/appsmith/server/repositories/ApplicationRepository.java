package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.List;

@Repository
public interface ApplicationRepository extends BaseRepository<Application, String>, CustomApplicationRepository {

    Flux<Application> findByIdIn(List<String> ids);

    Flux<Application> findByOrganizationId(String organizationId);

    Flux<Application> findByClonedFromApplicationId(String clonedFromApplicationId);
}
