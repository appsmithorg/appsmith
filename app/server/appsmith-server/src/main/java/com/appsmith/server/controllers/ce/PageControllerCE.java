package com.appsmith.server.controllers.ce;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.ApplicationMode;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.CRUDPageResponseDTO;
import com.appsmith.server.dtos.PageCreationDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.dtos.PageUpdateDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.solutions.CreateDBTablePageSolution;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RequestMapping(Url.PAGE_URL)
@RequiredArgsConstructor
@Slf4j
public class PageControllerCE {

    private final ApplicationPageService applicationPageService;
    private final NewPageService newPageService;
    private final CreateDBTablePageSolution createDBTablePageSolution;

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<PageDTO>> createPage(@Valid @RequestBody PageCreationDTO page) {
        log.debug("Going to create page {}", page.name());
        return applicationPageService
                .createPage(page.toPageDTO())
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED, created));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/crud-page")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<CRUDPageResponseDTO>> createCRUDPage(
            @RequestBody @NonNull CRUDPageResourceDTO resource,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId) {
        log.debug("Going to create crud-page in application {}", resource.getApplicationId());
        return createDBTablePageSolution
                .createPageFromDBTable(null, resource, environmentId, null, Boolean.TRUE)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED, created));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/crud-page/{branchedPageId}")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<CRUDPageResponseDTO>> createCRUDPage(
            @PathVariable String branchedPageId,
            @NonNull @RequestBody CRUDPageResourceDTO resource,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId) {
        log.debug("Going to create CRUD page {}", branchedPageId);
        return createDBTablePageSolution
                .createPageFromDBTable(branchedPageId, resource, environmentId, null, Boolean.TRUE)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED, created));
    }

    @Deprecated
    @JsonView(Views.Public.class)
    @GetMapping("/application/{branchedApplicationId}")
    public Mono<ResponseDTO<ApplicationPagesDTO>> getPageNamesByApplicationId(
            @PathVariable String branchedApplicationId) {
        return newPageService
                .findApplicationPagesByBranchedApplicationIdAndViewMode(branchedApplicationId, false, true)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK, resources));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/view/application/{branchedApplicationId}")
    public Mono<ResponseDTO<ApplicationPagesDTO>> getPageNamesByApplicationIdInViewMode(
            @PathVariable String branchedApplicationId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return newPageService
                .findApplicationPagesByBranchedApplicationIdAndViewMode(branchedApplicationId, true, true)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK, resources));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{branchedPageId}")
    public Mono<ResponseDTO<PageDTO>> getPageById(
            @PathVariable String branchedPageId,
            @RequestParam(required = false, defaultValue = "false") Boolean migrateDsl) {
        return applicationPageService
                .getPageAndMigrateDslByBranchedPageId(branchedPageId, false, migrateDsl)
                .map(page -> new ResponseDTO<>(HttpStatus.OK, page));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{branchedPageId}/view")
    public Mono<ResponseDTO<PageDTO>> getPageView(
            @PathVariable String branchedPageId,
            @RequestParam(required = false, defaultValue = "false") Boolean migrateDsl) {
        return applicationPageService
                .getPageAndMigrateDslByBranchedPageId(branchedPageId, true, migrateDsl)
                .map(page -> new ResponseDTO<>(HttpStatus.OK, page));
    }

    /**
     * This only deletes the unpublished version of the page.
     * In case the page has never been published, the page gets deleted.
     * In case the page has been published, this page would eventually get deleted whenever the application is published
     * next.
     *
     * @param branchedPageId branchedPageId which will be needed to find the actual page that needs to be deleted
     * @return deleted page DTO
     */
    @JsonView(Views.Public.class)
    @DeleteMapping("/{branchedPageId}")
    public Mono<ResponseDTO<PageDTO>> deletePage(@PathVariable String branchedPageId) {
        log.debug("Going to delete page with id: {}", branchedPageId);
        return applicationPageService
                .deleteUnpublishedPage(branchedPageId)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK, deletedResource));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/clone/{branchedPageId}")
    public Mono<ResponseDTO<PageDTO>> clonePage(@PathVariable String branchedPageId) {
        return applicationPageService
                .clonePage(branchedPageId)
                .map(page -> new ResponseDTO<>(HttpStatus.CREATED, page));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{branchedPageId}")
    public Mono<ResponseDTO<PageDTO>> updatePage(
            @PathVariable String branchedPageId, @RequestBody @Valid PageUpdateDTO resource) {
        log.debug("Going to update page with id: {}", branchedPageId);
        return newPageService
                .updatePage(branchedPageId, resource.toPageDTO())
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK, updatedResource));
    }

    /**
     * Returns a list of pages. It takes either Application ID or a Page ID and mode as input.
     * If Application ID is present, it'll fetch all pages of that application in the provided mode.
     * if Page ID is present, it'll fetch all pages of the corresponding Application.
     * If both IDs are present, it'll use the Application ID only and ignore the Page ID
     *
     * @param branchedApplicationId Id of the application
     * @param branchedPageId        id of a page
     * @param mode          In which mode it's in
     * @return List of ApplicationPagesDTO along with other meta data
     */
    @JsonView(Views.Public.class)
    @GetMapping
    public Mono<ResponseDTO<ApplicationPagesDTO>> getAllPages(
            @RequestParam(name = FieldName.APPLICATION_ID, required = false) String branchedApplicationId,
            @RequestParam(name = FieldName.PAGE_ID, required = false) String branchedPageId,
            @RequestParam(defaultValue = "EDIT") ApplicationMode mode) {
        log.debug(
                "Going to fetch applicationPageDTO for branchedApplicationId: {}, branchedPageId: {}, mode: {}",
                branchedApplicationId,
                branchedPageId,
                mode);
        return newPageService
                .findApplicationPages(branchedApplicationId, branchedPageId, mode)
                .map(resources -> new ResponseDTO<>(HttpStatus.OK, resources));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{defaultPageId}/dependencyMap")
    public Mono<ResponseDTO<String>> updateDependencyMap(
            @PathVariable String defaultPageId,
            @RequestBody(required = false) Map<String, List<String>> dependencyMap,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return newPageService
                .updateDependencyMap(defaultPageId, dependencyMap, RefType.branch, branchName)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK, updatedResource));
    }
}
