package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface NewPageServiceCE extends CrudService<NewPage, String> {

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

    Mono<ApplicationPagesDTO> findApplicationPagesByApplicationIdViewModeAndBranch(String applicationId,
                                                                                   String branchName,
                                                                                   Boolean view,
                                                                                   boolean markApplicationAsRecentlyAccessed);

    Mono<ApplicationPagesDTO> findApplicationPagesByApplicationIdViewMode(
            String applicationId, Boolean view, boolean markApplicationAsRecentlyAccessed
    );

    Layout createDefaultLayout();

    Mono<ApplicationPagesDTO> findNamesByApplicationNameAndViewMode(String applicationName, Boolean view);

    Mono<PageDTO> findByNameAndApplicationIdAndViewMode(String name, String applicationId, AclPermission permission, Boolean view);

    Mono<List<NewPage>> archivePagesByApplicationId(String applicationId, AclPermission permission);

    Mono<List<String>> findAllPageIdsInApplication(String applicationId, AclPermission permission, Boolean view);

    Mono<PageDTO> updatePage(String pageId, PageDTO page);

    Mono<PageDTO> updatePageByDefaultPageIdAndBranch(String defaultPageId, PageDTO page, String branchName);

    Mono<NewPage> save(NewPage page);

    Mono<NewPage> archive(NewPage page);

    Mono<Boolean> archiveById(String id);

    Flux<NewPage> saveAll(List<NewPage> pages);

    Mono<String> getNameByPageId(String pageId, boolean isPublishedName);

    Mono<NewPage> findByBranchNameAndDefaultPageId(String branchName, String defaultPageId, AclPermission permission);

    Mono<String> findBranchedPageId(String branchName, String defaultPageId, AclPermission permission);

    Mono<NewPage> findByGitSyncIdAndDefaultApplicationId(String defaultApplicationId, String gitSyncId, AclPermission permission);

    Flux<NewPage> findPageSlugsByApplicationIds(List<String> applicationIds, AclPermission aclPermission);
}
