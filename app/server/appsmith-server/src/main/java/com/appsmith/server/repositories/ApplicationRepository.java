package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface ApplicationRepository extends BaseRepository<Application, String>, CustomApplicationRepository {

    Flux<Application> findByOrganizationId(String organizationId);

}
