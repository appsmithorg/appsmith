package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ApplicationTemplateServiceCE {
    Flux<ApplicationTemplate> getActiveTemplates(List<String> templateIds);
    Flux<ApplicationTemplate> getSimilarTemplates(String templateId);
    Flux<ApplicationTemplate> getRecentlyUsedTemplates();
    Mono<ApplicationTemplate> getTemplateDetails(String templateId);
    Mono<Application> importApplicationFromTemplate(String templateId, String workspaceId);
    Mono<ApplicationTemplate> getFilters();
}
