package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserHomepageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.solutions.ApplicationFetcher;
import com.appsmith.server.solutions.ApplicationForkingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RestController
@RequestMapping(Url.APPLICATION_URL)
@Slf4j
public class ApplicationController extends BaseController<ApplicationService, Application, String> {

    private final ApplicationPageService applicationPageService;
    private final ApplicationFetcher applicationFetcher;
    private final ApplicationForkingService applicationForkingService;

    @Autowired
    public ApplicationController(
            ApplicationService service,
            ApplicationPageService applicationPageService,
            ApplicationFetcher applicationFetcher,
            ApplicationForkingService applicationForkingService) {
        super(service);
        this.applicationPageService = applicationPageService;
        this.applicationFetcher = applicationFetcher;
        this.applicationForkingService = applicationForkingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Application>> create(@Valid @RequestBody Application resource,
                                                 @RequestParam String orgId,
                                                 ServerWebExchange exchange) {
        if (orgId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "organization id"));
        }
        log.debug("Going to create resource {}", resource.getClass().getName());
        return applicationPageService.createApplication(resource, orgId)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PostMapping("/publish/{applicationId}")
    public Mono<ResponseDTO<Boolean>> publish(@PathVariable String applicationId) {
        return applicationPageService.publish(applicationId)
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
    public Mono<ResponseDTO<UserHomepageDTO>> getAllApplicationsForHome() {
        log.debug("Going to get all applications grouped by organization");
        return applicationFetcher.getAllApplications()
                .map(applications -> new ResponseDTO<>(HttpStatus.OK.value(), applications, null));
    }

    @PutMapping("/{applicationId}/changeAccess")
    public Mono<ResponseDTO<Application>> shareApplication(@PathVariable String applicationId, @RequestBody ApplicationAccessDTO applicationAccessDTO) {
        log.debug("Going to change access for application {} to {}", applicationId, applicationAccessDTO.getPublicAccess());
        return service.changeViewAccess(applicationId, applicationAccessDTO)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @PostMapping("/clone/{applicationId}")
    public Mono<ResponseDTO<Application>> cloneApplication(@PathVariable String applicationId) {
        return applicationPageService.cloneApplication(applicationId)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("/view/{applicationId}")
    public Mono<ResponseDTO<Application>> getApplicationInViewMode(@PathVariable String applicationId) {
        return service.getApplicationInViewMode(applicationId)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @PostMapping("/{applicationId}/fork/{organizationId}")
    public Mono<ResponseDTO<Application>> forkApplication(
            @PathVariable String applicationId,
            @PathVariable String organizationId
    ) {
        return applicationForkingService.forkApplicationToOrganization(applicationId, organizationId)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

}
