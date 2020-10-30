package com.appsmith.server.repositories;

import com.appsmith.server.domains.NewPage;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface NewPageRepository extends BaseRepository<NewPage, String>, CustomNewPageRepository {

    Flux<NewPage> findByApplicationId(String applicationId);

}
