package com.appsmith.server.services;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Page;
import reactor.core.publisher.Mono;

public interface ApplicationPageService {
    Mono<Page> createPage(Page page);

    Mono<Application> addPageToApplication(Mono<Application> applicationMono, Page page);

    Mono<Page> doesPageBelongToCurrentUserOrganization(Page page);

    Mono<Page> getPage(String pageId, Boolean viewMode);

    Mono<Application> createApplication(Application application);

    Mono<Page> getPageByName(String applicationName, String pageName, Boolean viewMode);
}
