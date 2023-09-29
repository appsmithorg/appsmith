package com.appsmith.server.controllers;

import com.appsmith.external.models.PackageDTO;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.PackageDetailsDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.packages.services.crud.CrudPackageService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequestMapping(Url.PACKAGE_URL)
@RestController
public class PackageController {
    private final CrudPackageService crudPackageService;

    @Autowired
    public PackageController(CrudPackageService crudPackageService) {
        this.crudPackageService = crudPackageService;
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Package>> createPackage(
            @Valid @RequestBody Package resource,
            @RequestParam(name = "workspaceId") String workspaceId,
            @RequestHeader(name = "Origin", required = false) String originHeader,
            ServerWebExchange exchange) {
        log.debug("Going to create package in workspace {}", workspaceId);
        return crudPackageService
                .createPackage(resource, workspaceId)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<List<PackageDTO>>> getAllPackages() {
        return crudPackageService
                .getAllPackages()
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
    public Mono<ResponseDTO<Package>> updatePackage(
            @PathVariable String packageId, @RequestBody @Valid Package packageResource) {
        log.debug("Going to update package {}", packageId);
        return crudPackageService
                .updatePackage(packageResource, packageId)
                .map(updatedPackage -> new ResponseDTO<>(HttpStatus.OK.value(), updatedPackage, null));
    }
}
