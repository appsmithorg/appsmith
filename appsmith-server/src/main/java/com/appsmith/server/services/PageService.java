package com.appsmith.server.services;

import com.appsmith.server.constants.AclConstants;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Page;
import com.appsmith.server.dtos.PageNameIdDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface PageService extends CrudService<Page, String> {

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<Page> findById(String pageId);

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Flux<Page> findByApplicationId(String applicationId);

    @AclPermission(values = {AclConstants.CREATE_PERMISSION, AclConstants.UPDATE_PERMISSION})
    Mono<Page> save(Page page);

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<Page> findByIdAndLayoutsId(String pageId, String layoutId);

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<Page> findByName(String name);

    @AclPermission(values = AclConstants.DELETE_PERMISSION)
    Mono<Void> deleteAll();

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Flux<PageNameIdDTO> findNamesByApplicationId(String applicationId);

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Layout createDefaultLayout();

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Flux<PageNameIdDTO> findNamesByApplicationName(String applicationName);

    @AclPermission(values = AclConstants.READ_PERMISSION)
    Mono<Page> findByNameAndApplicationId(String name, String applicationId);
}
