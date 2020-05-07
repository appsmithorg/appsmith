package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.OrganizationApplicationsDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping(Url.APPLICATION_URL)
@Slf4j
public class ApplicationController extends BaseController<ApplicationService, Application, String> {
    private final ApplicationPageService applicationPageService;

    @Autowired
    public ApplicationController(ApplicationService service, ApplicationPageService applicationPageService) {
        super(service);
        this.applicationPageService = applicationPageService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Application>> create(@Valid @RequestBody Application resource,
                                                 @RequestHeader(name = "Origin", required = false) String originHeader) {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return applicationPageService.createApplication(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PostMapping("/publish/{applicationId}")
    public Mono<ResponseDTO<Boolean>> publish(@PathVariable String applicationId) {
        return service.publish(applicationId)
                .map(published -> new ResponseDTO<>(HttpStatus.OK.value(), published, null));
    }

    @PutMapping("/{applicationId}/page/{pageId}/makeDefault")
    public Mono<ResponseDTO<Application>> makeDefault(@PathVariable String applicationId, @PathVariable String pageId) {
        return applicationPageService.makePageDefault(applicationId, pageId)
                .map(updatedApplication -> new ResponseDTO<>(HttpStatus.OK.value(), updatedApplication, null));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<Application>> delete(@PathVariable String id) {
        log.debug("Going to delete application with id: {}", id);
        return applicationPageService.deleteApplication(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    @GetMapping("/new")
    public Mono<ResponseDTO<List<OrganizationApplicationsDTO>>> getAllApplicationsMock() {
        log.debug("Going to get all applications grouped by organization");
        return service.getAllApplications()
                .map(applications -> new ResponseDTO<>(HttpStatus.OK.value(), applications, null));
    }

}
