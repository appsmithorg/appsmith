package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.PageDTO;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

public interface ApplicationPageServiceCE {

    Mono<PageDTO> createPage(PageDTO page);

    Mono<PageDTO> createPageWithBranchName(PageDTO page, String branchName);

    Mono<UpdateResult> addPageToApplication(Application application, PageDTO page, Boolean isDefault);

    Mono<PageDTO> getPage(String pageId, boolean viewMode);

    Mono<PageDTO> getPageByBranchAndDefaultPageId(String defaultPageId, String branchName, boolean viewMode);

    Mono<Application> createApplication(Application application);

    Mono<Application> createApplication(Application application, String orgId);

    Mono<PageDTO> getPageByName(String applicationName, String pageName, boolean viewMode);

    Mono<Application> makePageDefault(PageDTO page);

    Mono<Application> makePageDefault(String applicationId, String pageId);

    Mono<Application> makePageDefault(String defaultApplicationId, String defaultPageId, String branchName);

    Mono<Application> setApplicationPolicies(Mono<User> userMono, String orgId, Application application);

    Mono<Application> deleteApplication(String id);

    Mono<PageDTO> clonePage(String pageId);

    Mono<PageDTO> clonePageByDefaultPageIdAndBranch(String defaultPageId, String branchName);

    Mono<Application> cloneApplication(String applicationId, String branchName);

    Mono<PageDTO> deleteUnpublishedPageByBranchAndDefaultPageId(String defaultPageId, String branchName);

    Mono<PageDTO> deleteUnpublishedPage(String id);

    Mono<Application> publish(String applicationId, boolean isPublishedManually);

    Mono<Application> publish(String defaultApplicationId, String branchName, boolean isPublishedManually);

    void generateAndSetPagePolicies(Application application, PageDTO page);

    Mono<Void> sendApplicationPublishedEvent(Application application);

    Mono<ApplicationPagesDTO> reorderPage(String applicationId, String pageId, Integer order, String branchName);

    Mono<Application> deleteApplicationByResource(Application application);

    Mono<Application> createOrUpdateSuffixedApplication(Application application, String name, int suffix);
}
