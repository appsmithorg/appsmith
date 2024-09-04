package com.appsmith.server.newpages.base;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public interface NewPageServiceCE extends CrudService<NewPage, String> {

    Mono<PageDTO> getPageByViewMode(NewPage newPage, Boolean viewMode);

    Mono<NewPage> findById(String pageId, AclPermission aclPermission);

    Mono<PageDTO> findPageById(String pageId, AclPermission aclPermission, Boolean view);

    Flux<PageDTO> findByApplicationId(String applicationId, AclPermission permission, Boolean view);

    Flux<NewPage> findNewPagesByApplicationId(String applicationId, AclPermission permission);

    Flux<NewPage> findNewPagesByApplicationId(
            String applicationId, AclPermission permission, List<String> includeFields);

    Mono<PageDTO> saveUnpublishedPage(PageDTO page);

    Mono<PageDTO> createDefault(PageDTO object);

    Mono<PageDTO> findByIdAndLayoutsId(String pageId, String layoutId, AclPermission aclPermission, Boolean view);

    Mono<PageDTO> findByNameAndViewMode(String name, AclPermission permission, Boolean view);

    Mono<Void> deleteAll();

    Mono<ApplicationPagesDTO> findApplicationPages(
            String branchedApplicationId, String branchedPageId, ApplicationMode mode);

    Mono<ApplicationPagesDTO> findApplicationPagesByBranchedApplicationIdAndViewMode(
            String branchedApplicationId, Boolean view, boolean markApplicationAsRecentlyAccessed);

    Layout createDefaultLayout();

    Mono<PageDTO> findByNameAndApplicationIdAndViewMode(
            String name, String applicationId, AclPermission permission, Boolean view);

    Mono<List<NewPage>> archivePagesByApplicationId(String applicationId, AclPermission permission);

    Mono<PageDTO> updatePage(String pageId, PageDTO page);

    Mono<NewPage> save(NewPage page);

    Mono<NewPage> archive(NewPage page);

    Mono<NewPage> archiveById(String id);

    Mono<Boolean> archiveByIds(Collection<String> idList);

    Mono<NewPage> archiveByIdWithoutPermission(String id);

    Flux<NewPage> saveAll(List<NewPage> pages);

    Mono<String> getNameByPageId(String pageId, boolean isPublishedName);

    Mono<NewPage> findByBranchNameAndBasePageId(
            String branchName, String defaultPageId, AclPermission permission, List<String> projectedFieldNames);

    Mono<NewPage> findByBranchNameAndBasePageIdAndApplicationMode(
            String branchName, String basePageId, ApplicationMode mode);

    Mono<String> findBranchedPageId(String branchName, String basePageId, AclPermission permission);

    Mono<Void> publishPages(Collection<String> pageIds, AclPermission permission);

    Flux<NewPage> findAllByApplicationIds(List<String> applicationIds, List<String> includedFields);

    ApplicationPagesDTO getApplicationPagesDTO(Application application, List<NewPage> newPages, boolean viewMode);

    Mono<ApplicationPagesDTO> createApplicationPagesDTO(
            Application branchedApplication, List<NewPage> newPages, boolean viewMode, boolean isRecentlyAccessed);

    Mono<String> updateDependencyMap(String pageId, Map<String, List<String>> dependencyMap, String branchName);

    Flux<PageDTO> findByApplicationIdAndApplicationMode(
            String applicationId, AclPermission permission, ApplicationMode applicationMode);
}
