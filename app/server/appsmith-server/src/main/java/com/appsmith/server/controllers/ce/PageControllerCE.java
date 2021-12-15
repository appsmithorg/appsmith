package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.CRUDPageResponseDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
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
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;


@RequestMapping(Url.PAGE_URL)
@Slf4j
public class PageControllerCE {

    private final ApplicationPageService applicationPageService;
    private final NewPageService newPageService;
    private final CreateDBTablePageSolution createDBTablePageSolution;

    @Autowired
    public PageControllerCE(ApplicationPageService applicationPageService,
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
                                                 @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
                                                 @RequestHeader(name = "Origin", required = false) String originHeader,
                                                 ServerWebExchange exchange) {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return applicationPageService.createPageWithBranchName(resource, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PostMapping("/crud-page")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<CRUDPageResponseDTO>> createCRUDPage(@RequestBody @NonNull CRUDPageResourceDTO resource,
                                                                 @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to create crud-page in application {}, branchName {}", resource.getApplicationId(), branchName);
        return createDBTablePageSolution.createPageFromDBTable(null, resource, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PutMapping("/crud-page/{defaultPageId}")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<CRUDPageResponseDTO>> createCRUDPage(@PathVariable String defaultPageId,
                                                                 @NonNull @RequestBody CRUDPageResourceDTO resource,
                                                                 @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to create CRUD page {}, branchName {}", defaultPageId, branchName);
        return createDBTablePageSolution.createPageFromDBTable(defaultPageId, resource, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @Deprecated
    @GetMapping("/application/{applicationId}")
    public Mono<ResponseDTO<ApplicationPagesDTO>> getPageNamesByApplicationId(@PathVariable String applicationId,
                                                                              @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return newPageService.findApplicationPagesByApplicationIdViewModeAndBranch(applicationId, branchName, false, true)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/view/application/{applicationId}")
    public Mono<ResponseDTO<ApplicationPagesDTO>> getPageNamesByApplicationIdInViewMode(@PathVariable String applicationId,
                                                                                        @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return newPageService.findApplicationPagesByApplicationIdViewModeAndBranch(applicationId, branchName, true, true)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }

    @GetMapping("/{defaultPageId}")
    public Mono<ResponseDTO<PageDTO>> getPageById(@PathVariable String defaultPageId,
                                                  @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return applicationPageService.getPageByBranchAndDefaultPageId(defaultPageId, branchName, false)
                .map(page -> new ResponseDTO<>(HttpStatus.OK.value(), page, null));
    }


    @GetMapping("/{defaultPageId}/view")
    public Mono<ResponseDTO<PageDTO>> getPageView(@PathVariable String defaultPageId,
                                                  @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return applicationPageService.getPageByBranchAndDefaultPageId(defaultPageId, branchName, true)
                .map(page -> new ResponseDTO<>(HttpStatus.OK.value(), page, null));
    }

    @GetMapping("{pageName}/application/{applicationName}/view")
    public Mono<ResponseDTO<PageDTO>> getPageViewByName(@PathVariable String applicationName,
                                                        @PathVariable String pageName) {
        return Mono.error(new AppsmithException(AppsmithError.DEPRECATED_API));
    }

    /**
     * This only deletes the unpublished version of the page.
     * In case the page has never been published, the page gets deleted.
     * In case the page has been published, this page would eventually get deleted whenever the application is published
     * next.
     * @param defaultPageId defaultPageId which will be needed to find the actual page that needs to be deleted
     * @param branchName    git branch to find the exact page which needs to be deleted
     * @return              deleted page DTO
     */
    @DeleteMapping("/{defaultPageId}")
    public Mono<ResponseDTO<PageDTO>> deletePage(@PathVariable String defaultPageId,
                                                 @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to delete page with id: {}, branchName: {}", defaultPageId, branchName);
        return applicationPageService.deleteUnpublishedPageByBranchAndDefaultPageId(defaultPageId, branchName)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    @PostMapping("/clone/{defaultPageId}")
    public Mono<ResponseDTO<PageDTO>> clonePage(@PathVariable String defaultPageId,
                                                @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return applicationPageService.clonePageByDefaultPageIdAndBranch(defaultPageId, branchName)
                .map(page -> new ResponseDTO<>(HttpStatus.CREATED.value(), page, null));
    }

    @PutMapping("/{defaultPageId}")
    public Mono<ResponseDTO<PageDTO>> updatePage(@PathVariable String defaultPageId,
                                                 @RequestBody PageDTO resource,
                                                 @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to update page with id: {}, branchName: {}", defaultPageId, branchName);
        return newPageService.updatePageByDefaultPageIdAndBranch(defaultPageId, resource, branchName)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }
}
