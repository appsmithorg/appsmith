package com.appsmith.server.repositories;

import com.appsmith.server.domains.Page;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface PageRepository extends BaseRepository<Page, String>, CustomPageRepository {

    Flux<Page> findByApplicationId(String applicationId);

}
