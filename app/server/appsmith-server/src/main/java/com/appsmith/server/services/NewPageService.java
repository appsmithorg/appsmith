package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface NewPageService extends CrudService<NewPage, String> {

    Mono<PageDTO> getPageByViewMode(NewPage newPage, Boolean viewMode);

    Mono<NewPage> findById(String pageId, AclPermission aclPermission);

    Mono<PageDTO> findPageById(String pageId, AclPermission aclPermission, Boolean view);

    Flux<PageDTO> findByApplicationId(String applicationId, AclPermission permission, Boolean view);

    Flux<NewPage> findNewPagesByApplicationId(String applicationId, AclPermission permission);

    Mono<PageDTO> saveUnpublishedPage(PageDTO page);

    Mono<PageDTO> createDefault(PageDTO object);

    Mono<PageDTO> findByIdAndLayoutsId(String pageId, String layoutId, AclPermission aclPermission, Boolean view);

    Mono<PageDTO> findByNameAndViewMode(String name, AclPermission permission, Boolean view);

    Mono<Void> deleteAll();

    Mono<ApplicationPagesDTO> findApplicationPagesByApplicationIdAndViewMode(String applicationId, Boolean view);

    Layout createDefaultLayout();

    Mono<ApplicationPagesDTO> findNamesByApplicationNameAndViewMode(String applicationName, Boolean view);

    Mono<PageDTO> findByNameAndApplicationIdAndViewMode(String name, String applicationId, AclPermission permission, Boolean view);

    Mono<List<NewPage>> archivePagesByApplicationId(String applicationId, AclPermission permission);

    Mono<List<String>> findAllPageIdsInApplication(String applicationId, AclPermission permission, Boolean view);

    Mono<PageDTO> updatePage(String id, PageDTO page);

    Mono<NewPage> save(NewPage page);

    Mono<NewPage> archive(NewPage page);

    Mono<Boolean> archiveById(String id);

    Flux<NewPage> saveAll(List<NewPage> pages);
}
