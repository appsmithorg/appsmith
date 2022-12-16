package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationTemplate;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApplicationTemplateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
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
        return applicationTemplateService.getActiveTemplates(null)
                .map(templates -> new ResponseDTO<>(HttpStatus.OK.value(), templates, null));
    }

    @GetMapping("{templateId}")
    public Mono<ResponseDTO<ApplicationTemplate>> getTemplateDetails(@PathVariable String templateId) {
        return applicationTemplateService.getTemplateDetails(templateId)
                .map(templates -> new ResponseDTO<>(HttpStatus.OK.value(), templates, null));
    }

    @GetMapping("{templateId}/similar")
    public Mono<ResponseDTO<List<ApplicationTemplate>>> getSimilarTemplates(@PathVariable String templateId, @RequestParam MultiValueMap<String, String> params) {
        return applicationTemplateService.getSimilarTemplates(templateId, params).collectList()
                .map(templates -> new ResponseDTO<>(HttpStatus.OK.value(), templates, null));
    }

    @GetMapping("filters")
    public Mono<ResponseDTO<ApplicationTemplate>> getFilters() {
        return applicationTemplateService.getFilters()
                .map(filters -> new ResponseDTO<>(HttpStatus.OK.value(), filters, null));
    }

    @PostMapping("{templateId}/import/{workspaceId}")
    public Mono<ResponseDTO<ApplicationImportDTO>> importApplicationFromTemplate(@PathVariable String templateId,
                                                                                 @PathVariable String workspaceId) {
        return applicationTemplateService.importApplicationFromTemplate(templateId, workspaceId)
                .map(importedApp -> new ResponseDTO<>(HttpStatus.OK.value(), importedApp, null));
    }

    @GetMapping("recent")
    public Mono<ResponseDTO<List<ApplicationTemplate>>> getRecentlyUsedTemplates() {
        return applicationTemplateService.getRecentlyUsedTemplates()
                .map(templates -> new ResponseDTO<>(HttpStatus.OK.value(), templates, null));
    }

    @PostMapping("{templateId}/merge/{applicationId}/{organizationId}")
    public Mono<ResponseDTO<ApplicationImportDTO>> mergeTemplateWithApplication(@PathVariable String templateId,
                                                                       @PathVariable String applicationId,
                                                                       @PathVariable String organizationId,
                                                                       @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
                                                                       @RequestBody(required = false) List<String> pagesToImport) {
        return applicationTemplateService.mergeTemplateWithApplication(templateId, applicationId, organizationId, branchName, pagesToImport)
                .map(importedApp -> new ResponseDTO<>(HttpStatus.OK.value(), importedApp, null));
    }
}
