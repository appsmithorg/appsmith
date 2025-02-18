package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.views.Views;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.artifacts.base.ArtifactService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.Theme;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.ApplicationCreationDTO;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.ApplicationPagesDTO;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.BuildingBlockDTO;
import com.appsmith.server.dtos.BuildingBlockResponseDTO;
import com.appsmith.server.dtos.GitAuthDTO;
import com.appsmith.server.dtos.PartialExportFileDTO;
import com.appsmith.server.dtos.ReleaseItemsDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.exports.internal.partial.PartialExportService;
import com.appsmith.server.fork.internal.ApplicationForkingService;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.imports.internal.partial.PartialImportService;
import com.appsmith.server.projections.ApplicationSnapshotResponseDTO;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationSnapshotService;
import com.appsmith.server.solutions.UserReleaseNotes;
import com.appsmith.server.themes.base.ThemeService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.Part;
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
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.constants.ArtifactType.APPLICATION;

@Slf4j
@RequestMapping(Url.APPLICATION_URL)
@RequiredArgsConstructor
public class ApplicationControllerCE {

    protected final ArtifactService artifactService;
    protected final ApplicationService service;
    private final ApplicationPageService applicationPageService;
    private final UserReleaseNotes userReleaseNotes;
    private final ApplicationForkingService applicationForkingService;
    private final ThemeService themeService;
    private final ApplicationSnapshotService applicationSnapshotService;
    private final PartialExportService partialExportService;
    private final PartialImportService partialImportService;
    private final ImportService importService;
    private final ExportService exportService;

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Application>> create(@Valid @RequestBody ApplicationCreationDTO resource) {
        log.debug("Going to create application in workspace {}", resource.workspaceId());
        return applicationPageService
                .createApplication(resource.toApplication())
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/publish/{branchedApplicationId}")
    public Mono<ResponseDTO<Boolean>> publish(
            @PathVariable String branchedApplicationId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return applicationPageService
                .publish(branchedApplicationId, true)
                .thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), true, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{branchedApplicationId}/page/{branchedPageId}/makeDefault")
    public Mono<ResponseDTO<Application>> makeDefault(
            @PathVariable String branchedApplicationId, @PathVariable String branchedPageId) {
        return applicationPageService
                .makePageDefault(branchedApplicationId, branchedPageId)
                .map(updatedApplication -> new ResponseDTO<>(HttpStatus.OK.value(), updatedApplication, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{branchedApplicationId}/page/{branchedPageId}/reorder")
    public Mono<ResponseDTO<ApplicationPagesDTO>> reorderPage(
            @PathVariable String branchedApplicationId,
            @PathVariable String branchedPageId,
            @RequestParam Integer order) {
        return applicationPageService
                .reorderPage(branchedApplicationId, branchedPageId, order)
                .map(updatedApplication -> new ResponseDTO<>(HttpStatus.OK.value(), updatedApplication, null));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/{branchedApplicationId}")
    public Mono<ResponseDTO<Application>> delete(@PathVariable String branchedApplicationId) {
        log.debug("Going to delete application with branchedApplicationId: {}", branchedApplicationId);
        return applicationPageService
                .deleteApplication(branchedApplicationId)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/home")
    public Mono<ResponseDTO<List<Application>>> findByWorkspaceIdAndRecentlyUsedOrder(
            @RequestParam(required = false) String workspaceId) {
        log.debug("Going to get all applications by workspace id {}", workspaceId);
        return service.findByWorkspaceIdAndBaseApplicationsInRecentlyUsedOrder(workspaceId)
                .collectList()
                .map(applications -> new ResponseDTO<>(HttpStatus.OK.value(), applications, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping(Url.RELEASE_ITEMS)
    public Mono<ResponseDTO<ReleaseItemsDTO>> getReleaseItemsInformation() {
        log.debug("Going to get version release items");
        return userReleaseNotes
                .getReleaseItems()
                .map(applications -> new ResponseDTO<>(HttpStatus.OK.value(), applications, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{branchedApplicationId}/changeAccess")
    public Mono<ResponseDTO<Application>> shareApplication(
            @PathVariable String branchedApplicationId, @RequestBody ApplicationAccessDTO applicationAccessDTO) {
        log.debug(
                "Going to change access for application {} to {}",
                branchedApplicationId,
                applicationAccessDTO.getPublicAccess());
        return service.changeViewAccessForAllBranchesByBranchedApplicationId(
                        branchedApplicationId, applicationAccessDTO)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/clone/{branchedApplicationId}")
    public Mono<ResponseDTO<Application>> cloneApplication(@PathVariable String branchedApplicationId) {
        return applicationPageService
                .cloneApplication(branchedApplicationId)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/view/{branchedApplicationId}")
    public Mono<ResponseDTO<Application>> getApplicationInViewMode(@PathVariable String branchedApplicationId) {
        return service.getApplicationInViewMode(branchedApplicationId)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{branchedApplicationId}/fork/{workspaceId}")
    public Mono<ResponseDTO<ApplicationImportDTO>> forkApplication(
            @PathVariable String branchedApplicationId, @PathVariable String workspaceId) {
        return applicationForkingService
                .forkApplicationToWorkspace(branchedApplicationId, workspaceId)
                .map(fetchedResource -> new ResponseDTO<>(HttpStatus.OK.value(), fetchedResource, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/export/{branchedApplicationId}")
    public Mono<ResponseEntity<Object>> getApplicationFile(@PathVariable String branchedApplicationId) {
        log.debug("Going to export application with branchedApplicationId: {}", branchedApplicationId);

        return exportService.getArtifactFile(branchedApplicationId, APPLICATION).map(fetchedResource -> {
            HttpHeaders responseHeaders = fetchedResource.getHttpHeaders();
            Object applicationResource = fetchedResource.getArtifactResource();
            return new ResponseEntity<>(applicationResource, responseHeaders, HttpStatus.OK);
        });
    }

    @JsonView(Views.Public.class)
    @PostMapping("/snapshot/{branchedApplicationId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Boolean>> createSnapshot(@PathVariable String branchedApplicationId) {
        log.debug("Going to create snapshot with application branchedApplicationId: {}", branchedApplicationId);

        return applicationSnapshotService
                .createApplicationSnapshot(branchedApplicationId)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED.value(), result, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/snapshot/{branchedApplicationId}")
    public Mono<ResponseDTO<ApplicationSnapshotResponseDTO>> getSnapshotWithoutApplicationJson(
            @PathVariable String branchedApplicationId) {
        log.debug("Going to get snapshot with application branchedApplicationId: {}", branchedApplicationId);

        return applicationSnapshotService
                .getWithoutDataByBranchedApplicationId(branchedApplicationId)
                .map(applicationSnapshot -> new ResponseDTO<>(HttpStatus.OK.value(), applicationSnapshot, null));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/snapshot/{branchedApplicationId}")
    public Mono<ResponseDTO<Boolean>> deleteSnapshotWithoutApplicationJson(@PathVariable String branchedApplicationId) {
        log.debug("Going to delete snapshot with application branchedApplicationId: {}", branchedApplicationId);

        return applicationSnapshotService
                .deleteSnapshot(branchedApplicationId)
                .map(isDeleted -> new ResponseDTO<>(HttpStatus.OK.value(), isDeleted, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/snapshot/{branchedApplicationId}/restore")
    public Mono<ResponseDTO<Application>> restoreSnapshot(@PathVariable String branchedApplicationId) {
        log.debug("Going to restore snapshot with application branchedApplicationId: {}", branchedApplicationId);

        return applicationSnapshotService
                .restoreSnapshot(branchedApplicationId)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping(value = "/import/{workspaceId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseDTO<ArtifactImportDTO>> importApplicationFromFile(
            @RequestPart("file") Mono<Part> fileMono,
            @PathVariable String workspaceId,
            @RequestParam(name = FieldName.APPLICATION_ID, required = false) String branchedApplicationId) {
        log.debug("Going to import application in workspace with id: {}", workspaceId);
        return fileMono.flatMap(file -> importService.extractArtifactExchangeJsonAndSaveArtifact(
                        file, workspaceId, branchedApplicationId))
                .map(fetchedResource -> new ResponseDTO<>(HttpStatus.OK.value(), fetchedResource, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/ssh-keypair/{branchedApplicationId}")
    public Mono<ResponseDTO<GitAuth>> generateSSHKeyPair(
            @PathVariable String branchedApplicationId, @RequestParam(required = false) String keyType) {
        return artifactService
                .createOrUpdateSshKeyPair(ArtifactType.APPLICATION, branchedApplicationId, keyType)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/ssh-keypair/{branchedApplicationId}")
    public Mono<ResponseDTO<GitAuthDTO>> getSSHKey(@PathVariable String branchedApplicationId) {
        return service.getSshKey(branchedApplicationId)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{branchedApplicationId}")
    public Mono<ResponseDTO<Application>> update(
            @PathVariable String branchedApplicationId, @RequestBody Application resource) {
        log.debug("Going to update resource from base controller with id: {}", branchedApplicationId);
        return service.updateApplicationWithPresets(branchedApplicationId, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @JsonView(Views.Public.class)
    @PatchMapping("{branchedApplicationId}/themes/{themeId}")
    public Mono<ResponseDTO<Theme>> setCurrentTheme(
            @PathVariable String branchedApplicationId, @PathVariable String themeId) {
        return themeService
                .changeCurrentTheme(themeId, branchedApplicationId)
                .map(theme -> new ResponseDTO<>(HttpStatus.OK.value(), theme, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/import/{workspaceId}/datasources")
    public Mono<ResponseDTO<List<Datasource>>> getUnConfiguredDatasource(
            @PathVariable String workspaceId, @RequestParam(name = "defaultApplicationId") String baseApplicationId) {
        return importService
                .findDatasourceByArtifactId(workspaceId, baseApplicationId, APPLICATION)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping(value = "/{branchedApplicationId}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseDTO<Application>> uploadAppNavigationLogo(
            @PathVariable String branchedApplicationId, @RequestPart("file") Mono<Part> fileMono) {
        return fileMono.flatMap(part -> service.saveAppNavigationLogo(branchedApplicationId, part))
                .map(url -> new ResponseDTO<>(HttpStatus.OK.value(), url, null));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/{branchedApplicationId}/logo")
    public Mono<ResponseDTO<Void>> deleteAppNavigationLogo(@PathVariable String branchedApplicationId) {
        return service.deleteAppNavigationLogo(branchedApplicationId)
                .thenReturn(new ResponseDTO<>(HttpStatus.OK.value(), null, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping(
            value = "/export/partial/{branchedApplicationId}/{branchedPageId}",
            consumes = MediaType.APPLICATION_JSON_VALUE)
    public Mono<ResponseDTO<ApplicationJson>> exportApplicationPartially(
            @PathVariable String branchedApplicationId,
            @PathVariable String branchedPageId,
            @Valid @RequestBody PartialExportFileDTO fileDTO) {
        // params - contains ids of jsLib, actions and datasourceIds to be exported
        return partialExportService
                .getPartialExportResources(branchedApplicationId, branchedPageId, fileDTO)
                .map(fetchedResource -> new ResponseDTO<>(HttpStatus.OK.value(), fetchedResource, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping(
            value = "/import/partial/{workspaceId}/{branchedApplicationId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseDTO<Application>> importApplicationPartially(
            @RequestPart("file") Mono<Part> fileMono,
            @PathVariable String workspaceId,
            @PathVariable String branchedApplicationId,
            @RequestParam(name = FieldName.PAGE_ID) String branchedPageId) {
        return fileMono.flatMap(fileData -> partialImportService.importResourceInPage(
                        workspaceId, branchedApplicationId, branchedPageId, fileData))
                .map(fetchedResource -> new ResponseDTO<>(HttpStatus.CREATED.value(), fetchedResource, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/import/partial/block")
    public Mono<ResponseDTO<BuildingBlockResponseDTO>> importBlock(@RequestBody BuildingBlockDTO buildingBlockDTO) {
        return partialImportService
                .importBuildingBlock(buildingBlockDTO)
                .map(fetchedResource -> new ResponseDTO<>(HttpStatus.CREATED.value(), fetchedResource, null));
    }
}
