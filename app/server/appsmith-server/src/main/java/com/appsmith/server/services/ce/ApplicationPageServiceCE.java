package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.ClonePageMetaDTO;
import com.appsmith.server.dtos.PageDTO;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface ApplicationPageServiceCE {

    Mono<PageDTO> createPage(PageDTO page);

    Mono<PageDTO> createPageWithBranchName(PageDTO page, String branchName);

    Mono<Integer> addPageToApplication(Application application, PageDTO page, Boolean isDefault);

    Mono<PageDTO> getPage(NewPage newPage, boolean viewMode);

    Mono<PageDTO> getPage(String pageId, boolean viewMode);

    Mono<PageDTO> getPageAndMigrateDslByBranchAndDefaultPageId(
            String defaultPageId, String branchName, boolean viewMode, boolean migrateDsl);

    Mono<Application> createApplication(Application application);

    Mono<Application> createApplication(Application application, String workspaceId);

    Mono<Application> makePageDefault(PageDTO page);

    Mono<Application> makePageDefault(String applicationId, String pageId);

    Mono<Application> makePageDefault(String defaultApplicationId, String defaultPageId, String branchName);

    Mono<Application> setApplicationPolicies(Mono<User> userMono, String workspaceId, Application application);

    Mono<Application> deleteApplication(String id);

    Mono<PageDTO> clonePage(String pageId, ClonePageMetaDTO clonePageMetaDTO);

    Mono<PageDTO> clonePageByDefaultPageIdAndBranch(String defaultPageId, String branchName);

    Mono<Application> cloneApplication(String applicationId, String branchName);

    Mono<PageDTO> deleteUnpublishedPageByBranchAndDefaultPageId(String defaultPageId, String branchName);

    Mono<PageDTO> deleteUnpublishedPageWithOptionalPermission(
            String id,
            Optional<AclPermission> deletePagePermission,
            Optional<AclPermission> readApplicationPermission,
            Optional<AclPermission> deleteCollectionPermission,
            Optional<AclPermission> deleteActionPermission);

    Mono<PageDTO> deleteUnpublishedPage(String id);

    Mono<Application> publish(String applicationId, boolean isPublishedManually);

    Mono<Application> publish(String defaultApplicationId, String branchName, boolean isPublishedManually);

    void generateAndSetPagePolicies(Application application, PageDTO page);

    Mono<ApplicationPagesDTO> reorderPage(String applicationId, String pageId, Integer order, String branchName);

    Mono<Application> deleteApplicationByResource(Application application);

    Mono<Application> createOrUpdateSuffixedApplication(Application application, String name, int suffix);

    int getEvaluationVersion();

    Mono<List<NewPage>> getPagesBasedOnApplicationMode(
            Application branchedApplication, ApplicationMode applicationMode);

    Mono<PageDTO> getPageDTOAfterMigratingDSL(NewPage newPage, boolean viewMode, boolean migrateDsl);
}
