package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.solutions.CreateDBTablePageSolution;
import lombok.NonNull;
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
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RestController
@RequestMapping(Url.PAGE_URL)
@Slf4j
public class PageController {
    private final ApplicationPageService applicationPageService;
    private final NewPageService newPageService;
    private final CreateDBTablePageSolution createDBTablePageSolution;
    
    @Autowired
    public PageController(ApplicationPageService applicationPageService,
                          NewPageService newPageService,
                          CreateDBTablePageSolution createDBTablePageSolution
    ) {
        this.applicationPageService = applicationPageService;
        this.newPageService = newPageService;
        this.createDBTablePageSolution = createDBTablePageSolution;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<PageDTO>> createPage(@Valid @RequestBody PageDTO resource,
                                             @RequestHeader(name = "Origin", required = false) String originHeader,
                                             ServerWebExchange exchange) {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return applicationPageService.createPage(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PostMapping("/crud-page")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<PageDTO>> createCRUDPage(@RequestBody @NonNull CRUDPageResourceDTO resource) {
        log.debug("Going to create crud-page");
        return createDBTablePageSolution.createPageFromDBTable(null, resource)
            .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }
    
    @PutMapping("/crud-page/{pageId}")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<PageDTO>> createCRUDPage(@PathVariable String pageId,
                                                     @NonNull @RequestBody CRUDPageResourceDTO resource) {
        log.debug("Going to update resource {}", pageId);
        return createDBTablePageSolution.createPageFromDBTable(pageId, resource)
            .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @Deprecated
    @GetMapping("/application/{applicationId}")
    public Mono<ResponseDTO<ApplicationPagesDTO>> getPageNamesByApplicationId(@PathVariable String applicationId) {
        return newPageService.findApplicationPagesByApplicationIdAndViewMode(applicationId, false)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/view/application/{applicationId}")
    public Mono<ResponseDTO<ApplicationPagesDTO>> getPageNamesByApplicationIdInViewMode(@PathVariable String applicationId) {
        return newPageService.findApplicationPagesByApplicationIdAndViewMode(applicationId, true)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/{pageId}")
    public Mono<ResponseDTO<PageDTO>> getPageById(@PathVariable String pageId) {
        return applicationPageService.getPage(pageId, false)
                .map(page -> new ResponseDTO<>(HttpStatus.OK.value(), page, null));
    }


    @GetMapping("/{pageId}/view")
    public Mono<ResponseDTO<PageDTO>> getPageView(@PathVariable String pageId) {
        return applicationPageService.getPage(pageId, true)
                .map(page -> new ResponseDTO<>(HttpStatus.OK.value(), page, null));
    }

    @GetMapping("{pageName}/application/{applicationName}/view")
    public Mono<ResponseDTO<PageDTO>> getPageViewByName(@PathVariable String applicationName, @PathVariable String pageName) {
        return applicationPageService.getPageByName(applicationName, pageName, true)
                .map(page -> new ResponseDTO<>(HttpStatus.OK.value(), page, null));
    }

    /**
     * This only deletes the unpublished version of the page.
     * In case the page has never been published, the page gets deleted.
     * In case the page has been published, this page would eventually get deleted whenever the application is published
     * next.
     * @param id
     * @return
     */
    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<PageDTO>> deletePage(@PathVariable String id) {
        log.debug("Going to delete page with id: {}", id);
        return applicationPageService.deleteUnpublishedPage(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    @PostMapping("/clone/{pageId}")
    public Mono<ResponseDTO<PageDTO>> clonePage(@PathVariable String pageId) {
        return applicationPageService.clonePage(pageId)
                .map(page -> new ResponseDTO<>(HttpStatus.CREATED.value(), page, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDTO<PageDTO>> updatePage(@PathVariable String id, @RequestBody PageDTO resource) {
        log.debug("Going to update page with id: {}", id);
        return newPageService.updatePage(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }
}
