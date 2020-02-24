package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import com.appsmith.server.services.AclEntity;
import org.springframework.data.domain.Example;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
@AclEntity("applications")
public interface ApplicationRepository extends BaseRepository<Application, String> {

    default Mono<Application> findByIdAndOrganizationId(String id, String orgId){
        System.out.println("In the custom implementation");
        return Mono.empty();
    }

    Mono<Application> findByName(String name);

    @Override
    Flux<Application> findAll(Example example);

    @Override
    Mono<Application> findById(String id);
}
