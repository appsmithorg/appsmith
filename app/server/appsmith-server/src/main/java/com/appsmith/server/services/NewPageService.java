package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Page;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface NewPageService extends CrudService<NewPage, String> {

    public Mono<Page> findById(String pageId, AclPermission aclPermission, Boolean view);

    Flux<Page> findByApplicationId(String applicationId, AclPermission permission, Boolean view);

//    Mono<Page> save(Page page);

    Mono<Page> createDefault(Page object);

    Mono<Page> findByIdAndLayoutsId(String pageId, String layoutId, AclPermission aclPermission, Boolean view);

    Mono<Page> findByNameAndViewMode(String name, AclPermission permission, Boolean view);

    Mono<Void> deleteAll();

//    Mono<ApplicationPagesDTO> findNamesByApplicationId(String applicationId);

    Layout createDefaultLayout();

//    Mono<ApplicationPagesDTO> findNamesByApplicationName(String applicationName);

//    Mono<Page> findByNameAndApplicationId(String name, String applicationId, AclPermission permission);
}
