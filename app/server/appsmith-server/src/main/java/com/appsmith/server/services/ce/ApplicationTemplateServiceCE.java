package com.appsmith.server.services.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationTemplate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ApplicationTemplateServiceCE {
    Flux<ApplicationTemplate> getActiveTemplates();
    Flux<ApplicationTemplate> getSimilarTemplates(String templateId);
    Mono<ApplicationTemplate> getTemplateDetails(String templateId);
    Mono<Application> importApplicationFromTemplate(String templateId, String organizationId);
}
