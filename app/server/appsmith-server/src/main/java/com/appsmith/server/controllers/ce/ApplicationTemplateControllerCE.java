package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationTemplate;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.TemplateDTO;
import com.appsmith.server.services.ApplicationTemplateService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
public class ApplicationTemplateControllerCE {

    protected final ApplicationTemplateService applicationTemplateService;

    public ApplicationTemplateControllerCE(ApplicationTemplateService applicationTemplateService) {
        this.applicationTemplateService = applicationTemplateService;
    }

    @JsonView(Views.Public.class)
    @GetMapping
    public Mono<ResponseDTO<List<ApplicationTemplate>>> getAll() {
        return applicationTemplateService
                .getActiveTemplates(null)
                .map(templates -> new ResponseDTO<>(HttpStatus.OK.value(), templates, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("{templateId}")
    public Mono<ResponseDTO<ApplicationTemplate>> getTemplateDetails(@PathVariable String templateId) {
        return applicationTemplateService
                .getTemplateDetails(templateId)
                .map(templates -> new ResponseDTO<>(HttpStatus.OK.value(), templates, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("{templateId}/similar")
    public Mono<ResponseDTO<List<ApplicationTemplate>>> getSimilarTemplates(
            @PathVariable String templateId, @RequestParam MultiValueMap<String, String> params) {
        return applicationTemplateService
                .getSimilarTemplates(templateId, params)
                .collectList()
                .map(templates -> new ResponseDTO<>(HttpStatus.OK.value(), templates, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("filters")
    public Mono<ResponseDTO<ApplicationTemplate>> getFilters() {
        return applicationTemplateService
                .getFilters()
                .map(filters -> new ResponseDTO<>(HttpStatus.OK.value(), filters, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("{templateId}/import/{workspaceId}")
    public Mono<ResponseDTO<ApplicationImportDTO>> importApplicationFromTemplate(
            @PathVariable String templateId, @PathVariable String workspaceId) {
        return applicationTemplateService
                .importApplicationFromTemplate(templateId, workspaceId)
                .map(importedApp -> new ResponseDTO<>(HttpStatus.OK.value(), importedApp, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("{templateId}/merge/{branchedApplicationId}/{workspaceId}")
    public Mono<ResponseDTO<ApplicationImportDTO>> mergeTemplateWithApplication(
            @PathVariable String templateId,
            @PathVariable String branchedApplicationId,
            @PathVariable String workspaceId,
            @RequestBody(required = false) List<String> pagesToImport) {
        return applicationTemplateService
                .mergeTemplateWithApplication(templateId, branchedApplicationId, workspaceId, pagesToImport)
                .map(importedApp -> new ResponseDTO<>(HttpStatus.OK.value(), importedApp, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("publish/community-template")
    public Mono<ResponseDTO<Application>> publishAsCommunityTemplate(@RequestBody TemplateDTO resource) {
        return applicationTemplateService
                .publishAsCommunityTemplate(resource)
                .map(template -> new ResponseDTO<>(HttpStatus.OK.value(), template, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("publish/use-case")
    public Mono<ResponseDTO<Boolean>> publishAppsmithTemplate(@RequestBody TemplateDTO resource) {
        return applicationTemplateService
                .publishAppsmithTemplate(resource)
                .map(template -> new ResponseDTO<>(HttpStatus.OK.value(), template, null));
    }
}
