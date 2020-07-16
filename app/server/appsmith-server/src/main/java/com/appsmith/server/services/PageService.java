package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PageService extends CrudService<Page, String> {

    Mono<Page> findById(String pageId, AclPermission aclPermission);

    Flux<Page> findByApplicationId(String applicationId);

    Mono<Page> save(Page page);

    Mono<Page> createPlain(Page object);

    Mono<Page> findByIdAndLayoutsId(String pageId, String layoutId, AclPermission aclPermission);

    Mono<Page> findByName(String name);

    Mono<Void> deleteAll();

    Mono<ApplicationPagesDTO> findNamesByApplicationId(String applicationId);

    Layout createDefaultLayout();

    Mono<ApplicationPagesDTO> findNamesByApplicationName(String applicationName);

    Mono<Page> findByNameAndApplicationId(String name, String applicationId, AclPermission permission);
}
