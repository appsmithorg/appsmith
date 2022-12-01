package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.GitAuthDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.dtos.UserHomepageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.ThemeService;
import com.appsmith.server.solutions.ApplicationFetcher;
import com.appsmith.server.solutions.ApplicationForkingService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.Part;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@Slf4j
@RequestMapping(Url.APPLICATION_URL)
public class ApplicationControllerCE extends BaseController<ApplicationService, Application, String> {

    private final ApplicationPageService applicationPageService;
    private final ApplicationFetcher applicationFetcher;
    private final ApplicationForkingService applicationForkingService;
    private final ImportExportApplicationService importExportApplicationService;
    private final ThemeService themeService;

    @Autowired
    public ApplicationControllerCE(
            ApplicationService service,
            ApplicationPageService applicationPageService,
            ApplicationFetcher applicationFetcher,
            ApplicationForkingService applicationForkingService,
            ImportExportApplicationService importExportApplicationService, ThemeService themeService) {
        super(service);
        this.applicationPageService = applicationPageService;
        this.applicationFetcher = applicationFetcher;
        this.applicationForkingService = applicationForkingService;
        this.importExportApplicationService = importExportApplicationService;
        this.themeService = themeService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Application>> create(@Valid @RequestBody Application resource,
                                                 @RequestParam String workspaceId,
                                                 ServerWebExchange exchange) {
        if (workspaceId == null) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "workspace id"));
        }
        log.debug("Going to create application in workspace {}", workspaceId);
        return applicationPageService.createApplication(resource, workspaceId)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PostMapping("/publish/{defaultApplicationId}")
    public Mono<ResponseDTO<Boolean>> publish(@PathVariable String defaultApplicationId,
                                              @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return applicationPageService.publish(defaultApplicationId, branchName, true)
                .thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), true, null));
    }

    @PutMapping("/{defaultApplicationId}/page/{defaultPageId}/makeDefault")
    public Mono<ResponseDTO<Application>> makeDefault(@PathVariable String defaultApplicationId,
                                                      @PathVariable String defaultPageId,
                                                      @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return applicationPageService.makePageDefault(defaultApplicationId, defaultPageId, branchName)
                .map(updatedApplication -> new ResponseDTO<>(HttpStatus.OK.value(), updatedApplication, null));
    }

    @PutMapping("/{defaultApplicationId}/page/{defaultPageId}/reorder")
    public Mono<ResponseDTO<ApplicationPagesDTO>> reorderPage(
            @PathVariable String defaultApplicationId,
            @PathVariable String defaultPageId,
            @RequestParam Integer order,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return applicationPageService.reorderPage(defaultApplicationId, defaultPageId, order, branchName)
                .map(updatedApplication -> new ResponseDTO<>(HttpStatus.OK.value(), updatedApplication, null));
    }

    @Override
    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<Application>> delete(@PathVariable String id,
                                                 @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to delete application with id: {}", id);
        return applicationPageService.deleteApplication(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    @GetMapping("/new")
    public Mono<ResponseDTO<UserHomepageDTO>> getAllApplicationsForHome() {
        log.debug("Going to get all applications grouped by workspace");
        return applicationFetcher.getAllApplications()
                .map(applications -> new ResponseDTO<>(HttpStatus.OK.value(), applications, null));
    }

    @PutMapping("/{defaultApplicationId}/changeAccess")
    public Mono<ResponseDTO<Application>> shareApplication(@PathVariable String defaultApplicationId,
                                                           @RequestBody ApplicationAccessDTO applicationAccessDTO,
                                                           @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to change access for application {}, branch {} to {}", defaultApplicationId, branchName, applicationAccessDTO.getPublicAccess());
        return service.changeViewAccess(defaultApplicationId, branchName, applicationAccessDTO)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @PostMapping("/clone/{applicationId}")
    public Mono<ResponseDTO<Application>> cloneApplication(@PathVariable String applicationId,
                                                           @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return applicationPageService.cloneApplication(applicationId, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("/view/{defaultApplicationId}")
    public Mono<ResponseDTO<Application>> getApplicationInViewMode(@PathVariable String defaultApplicationId,
                                                                   @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getApplicationInViewMode(defaultApplicationId, branchName)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @PostMapping("/{defaultApplicationId}/fork/{workspaceId}")
    public Mono<ResponseDTO<Application>> forkApplication(
            @PathVariable String defaultApplicationId,
            @PathVariable String workspaceId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return applicationForkingService.forkApplicationToWorkspace(defaultApplicationId, workspaceId, branchName)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @GetMapping("/export/{id}")
    public Mono<ResponseEntity<Object>> getApplicationFile(@PathVariable String id,
                                                           @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to export application with id: {}, branch: {}", id, branchName);

        return importExportApplicationService.getApplicationFile(id, branchName)
                .map(fetchedResource -> {
                    HttpHeaders responseHeaders = fetchedResource.getHttpHeaders();
                    Object applicationResource = fetchedResource.getApplicationResource();
                    return new ResponseEntity<>(applicationResource, responseHeaders, HttpStatus.OK);
                });
    }

    @PostMapping(value = "/import/{workspaceId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseDTO<ApplicationImportDTO>> importApplicationFromFile(@RequestPart("file") Mono<Part> fileMono,
                                                                             @PathVariable String workspaceId) {
        log.debug("Going to import application in workspace with id: {}", workspaceId);
        return fileMono
                .flatMap(file -> importExportApplicationService.extractFileAndSaveApplication(workspaceId, file))
                .map(fetchedResource -> new ResponseDTO<>(HttpStatus.OK.value(), fetchedResource, null));
    }

    @PostMapping("/ssh-keypair/{applicationId}")
    public Mono<ResponseDTO<GitAuth>> generateSSHKeyPair(@PathVariable String applicationId,
                                                         @RequestParam(required = false) String keyType) {
        return service.createOrUpdateSshKeyPair(applicationId, keyType)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @GetMapping("/ssh-keypair/{applicationId}")
    public Mono<ResponseDTO<GitAuthDTO>> getSSHKey(@PathVariable String applicationId) {
        return service.getSshKey(applicationId)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @Override
    @PutMapping("/{defaultApplicationId}")
    public Mono<ResponseDTO<Application>> update(@PathVariable String defaultApplicationId,
                                                 @RequestBody Application resource,
                                                 @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to update resource from base controller with id: {}", defaultApplicationId);
        return service.update(defaultApplicationId, resource, branchName)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @PatchMapping("{applicationId}/themes/{themeId}")
    public Mono<ResponseDTO<Theme>> setCurrentTheme(@PathVariable String applicationId, @PathVariable String themeId, @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return themeService.changeCurrentTheme(themeId, applicationId, branchName)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK.value(), theme, null));
    }

    @GetMapping("/import/{workspaceId}/datasources")
    public Mono<ResponseDTO<List<Datasource>>> getUnConfiguredDatasource(@PathVariable String workspaceId, @RequestParam String defaultApplicationId) {
        return importExportApplicationService.findDatasourceByApplicationId(defaultApplicationId, workspaceId)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    // !! This API endpoint should not be exposed !!
    @Override
    @GetMapping("")
    public Mono<ResponseDTO<List<Application>>> getAll(@RequestParam MultiValueMap<String, String> params,
                                             @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return Mono.just(
                new ResponseDTO<>(HttpStatus.BAD_REQUEST.value(), null, AppsmithError.UNSUPPORTED_OPERATION.getMessage())
        );
    }
}
