package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ApplicationPageServiceCE {

    Mono<PageDTO> createPage(PageDTO page);

    Mono<Integer> addPageToApplication(Application application, PageDTO page, Boolean isDefault);

    Mono<PageDTO> getPage(NewPage newPage, boolean viewMode);

    Mono<PageDTO> getPage(String pageId, boolean viewMode);

    Mono<PageDTO> getPageAndMigrateDslByBranchAndBasePageId(
            String defaultPageId, String branchName, boolean viewMode, boolean migrateDsl);

    Mono<Application> createApplication(Application application);

    Mono<Application> createApplication(Application application, String workspaceId);

    Mono<PageDTO> getPageAndMigrateDslByBranchedPageId(String branchedPageId, boolean viewMode, boolean migrateDsl);

    Mono<Application> makePageDefault(PageDTO page);

    Mono<Application> makePageDefault(String applicationId, String pageId);

    Mono<Application> setApplicationPolicies(Mono<User> userMono, String workspaceId, Application application);

    Mono<Application> deleteApplication(String id);

    Mono<PageDTO> clonePage(String pageId);

    Mono<Application> cloneApplication(String branchedApplicationId);

    Mono<PageDTO> deleteUnpublishedPage(
            String id,
            AclPermission deletePagePermission,
            AclPermission readApplicationPermission,
            AclPermission deleteCollectionPermission,
            AclPermission deleteActionPermission);

    Mono<PageDTO> deleteUnpublishedPage(String id);

    Mono<Application> publishWithoutPermissionChecks(String branchedApplicationId, boolean isPublishedManually);

    Mono<Application> publish(String branchedApplicationId, boolean isPublishedManually);

    void generateAndSetPagePolicies(Application application, PageDTO page);

    Mono<ApplicationPagesDTO> reorderPage(String branchedApplicationId, String branchedPageId, Integer order);

    Mono<Application> deleteApplicationByResource(Application application);

    Mono<Application> createOrUpdateSuffixedApplication(Application application, String name, int suffix);

    int getEvaluationVersion();

    Mono<List<NewPage>> getPagesBasedOnApplicationMode(
            Application branchedApplication, ApplicationMode applicationMode);

    Mono<PageDTO> getPageDTOAfterMigratingDSL(NewPage newPage, boolean viewMode, boolean migrateDsl);
}
