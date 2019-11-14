package com.appsmith.server.services;

import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.PageNameIdDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PageService extends CrudService<Page, String> {

    Mono<Page> findById(String pageId);

    Mono<Page> save(Page page);

    Mono<Page> findByIdAndLayoutsId(String pageId, String layoutId);

    Mono<Page> doesPageBelongToCurrentUserOrganization(Page page);

    Mono<Page> findByName(String name);

    Mono<Void> deleteAll();

    Flux<PageNameIdDTO> findNamesByApplicationId(String applicationId);

    Mono<Page> getPage(String pageId, Boolean viewMode);
}
