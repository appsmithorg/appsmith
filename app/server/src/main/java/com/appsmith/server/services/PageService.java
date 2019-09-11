package com.appsmith.server.services;

import com.appsmith.server.domains.Page;
import reactor.core.publisher.Mono;

public interface PageService extends CrudService<Page, String> {

    Mono<Page> findById(String pageId);

    Mono<Page> save(Page page);

    Mono<Page> findByIdAndLayoutsId(String pageId, String layoutId);

    Mono<Page> doesPageIdBelongToCurrentUserOrganization(Page page);

    Mono<Page> findByName(String name);

    Mono<Void> deleteAll();
}
