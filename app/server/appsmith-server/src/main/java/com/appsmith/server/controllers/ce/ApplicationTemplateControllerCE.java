package com.appsmith.server.controllers.ce;

import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationTemplate;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApplicationTemplateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
public class ApplicationTemplateControllerCE {

    protected final ApplicationTemplateService applicationTemplateService;

    public ApplicationTemplateControllerCE(ApplicationTemplateService applicationTemplateService) {
        this.applicationTemplateService = applicationTemplateService;
    }

    @GetMapping
    public Mono<ResponseDTO<List<ApplicationTemplate>>> getAll() {
        return applicationTemplateService.getActiveTemplates().collectList()
                .map(templates -> new ResponseDTO<>(HttpStatus.OK.value(), templates, null));
    }

    @GetMapping("{templateId}")
    public Mono<ResponseDTO<ApplicationTemplate>> getTemplateDetails(@PathVariable String templateId) {
        return applicationTemplateService.getTemplateDetails(templateId)
                .map(templates -> new ResponseDTO<>(HttpStatus.OK.value(), templates, null));
    }

    @GetMapping("{templateId}/similar")
    public Mono<ResponseDTO<List<ApplicationTemplate>>> getSimilarTemplates(@PathVariable String templateId) {
        return applicationTemplateService.getSimilarTemplates(templateId).collectList()
                .map(templates -> new ResponseDTO<>(HttpStatus.OK.value(), templates, null));
    }

    @PostMapping("{templateId}/import/{organizationId}")
    public Mono<Application> importApplicationFromTemplate(@PathVariable String templateId,
                                                           @PathVariable String organizationId) {
        return applicationTemplateService.importApplicationFromTemplate(templateId, organizationId);
    }
}
