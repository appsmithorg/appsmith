package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ConsumablePackagesAndModulesDTO;
import com.appsmith.server.dtos.ImportableArtifactDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.dtos.PackageDetailsDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exports.internal.ExportService;
import com.appsmith.server.imports.internal.ImportService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.constants.ArtifactType.PACKAGE;

@Slf4j
@RequestMapping(Url.PACKAGE_URL)
@RequiredArgsConstructor
@RestController
public class PackageController {

    private final CrudPackageService crudPackageService;
    private final PublishPackageService publishPackageService;
    private final ExportService exportService;
    private final ImportService importService;

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<PackageDTO>> createPackage(
            @Valid @RequestBody PackageDTO resource, @RequestParam(name = "workspaceId") String workspaceId) {
        log.debug("Going to create package in workspace {}", workspaceId);
        return crudPackageService
                .createPackage(resource, workspaceId)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<List<PackageDTO>>> getAllEditablePackages() {
        return crudPackageService
                .getAllEditablePackages()
                .map(packageDTOS -> new ResponseDTO<>(HttpStatus.OK.value(), packageDTOS, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/consumables")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<ConsumablePackagesAndModulesDTO>> getAllConsumablePackages(
            @RequestParam String workspaceId) {
        return crudPackageService
                .getAllPackagesForConsumer(workspaceId)
                .map(packageDTOS -> new ResponseDTO<>(HttpStatus.OK.value(), packageDTOS, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/{packageId}")
    public Mono<ResponseDTO<PackageDetailsDTO>> getPackageDetails(@PathVariable String packageId) {
        return crudPackageService
                .getPackageDetails(packageId)
                .map(packageDetailsDTOCreated ->
                        new ResponseDTO<>(HttpStatus.OK.value(), packageDetailsDTOCreated, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @PutMapping("/{packageId}")
    public Mono<ResponseDTO<PackageDTO>> updatePackage(
            @PathVariable String packageId, @RequestBody @Valid PackageDTO packageResource) {
        log.debug("Going to update package {}", packageId);
        return crudPackageService
                .updatePackage(packageResource, packageId)
                .map(updatedPackage -> new ResponseDTO<>(HttpStatus.OK.value(), updatedPackage, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @PostMapping("/{packageId}/publish")
    public Mono<ResponseDTO<Boolean>> publishPackage(@PathVariable String packageId) {
        log.debug("Going to publish package {}", packageId);

        return publishPackageService
                .publishPackage(packageId)
                .map(isPublished -> new ResponseDTO<>(HttpStatus.OK.value(), isPublished, null));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/{packageId}")
    public Mono<ResponseDTO<PackageDTO>> deletePackage(@PathVariable String packageId) {
        log.debug("Going to delete package {}", packageId);
        return crudPackageService
                .deletePackage(packageId)
                .map(deletedPackage -> new ResponseDTO<>(HttpStatus.OK.value(), deletedPackage, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/export/{id}")
    public Mono<ResponseEntity<Object>> getPackageFile(
            @PathVariable String id, @RequestParam(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to export package with id: {}, branch: {}", id, branchName);

        return exportService.getArtifactFile(id, branchName, PACKAGE).map(fetchedResource -> {
            HttpHeaders responseHeaders = fetchedResource.getHttpHeaders();
            Object applicationResource = fetchedResource.getArtifactResource();
            return new ResponseEntity<>(applicationResource, responseHeaders, HttpStatus.OK);
        });
    }

    @JsonView(Views.Public.class)
    @PostMapping(value = "/import/{workspaceId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseDTO<ImportableArtifactDTO>> importPackageFromFile(
            @RequestPart("file") Mono<Part> fileMono,
            @PathVariable String workspaceId,
            @RequestParam(name = FieldName.PACKAGE_ID, required = false) String packageId) {
        log.debug("Going to import package in workspace with id: {}", workspaceId);
        return fileMono.flatMap(file ->
                        importService.extractArtifactExchangeJsonAndSaveArtifact(file, workspaceId, packageId, PACKAGE))
                .map(fetchedResource -> new ResponseDTO<>(HttpStatus.OK.value(), fetchedResource, null));
    }
}
