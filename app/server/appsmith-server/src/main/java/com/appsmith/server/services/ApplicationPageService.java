package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Page;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Mono;

public interface ApplicationPageService {
    Mono<Page> createPage(Page page);

    Mono<UpdateResult> addPageToApplication(Application application, Page page, Boolean isDefault);

    Mono<Page> getPage(String pageId, Boolean viewMode);

    Mono<Application> createApplication(Application application);

    Mono<Application> createApplication(Application application, String orgId);

    Mono<Page> getPageByName(String applicationName, String pageName, Boolean viewMode);

    Mono<Application> makePageDefault(String applicationId, String pageId);

    Mono<Application> cloneApplication(Application application);

    Mono<Application> deleteApplication(String id);
}
