package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Page;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomPageRepository;
import reactor.core.publisher.Flux;

public interface PageRepositoryCE extends BaseRepository<Page, String>, CustomPageRepository {

    Flux<Page> findByApplicationId(String applicationId);

}
