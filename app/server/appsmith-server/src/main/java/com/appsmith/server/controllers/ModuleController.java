package com.appsmith.server.controllers;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleEntitiesDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.helpers.ModuleConsumable;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.crud.entity.CrudModuleEntityService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequestMapping(Url.MODULE_URL)
@RestController
public class ModuleController {
    private final CrudModuleService crudModuleService;
    private final CrudModuleEntityService crudModuleEntityService;

    @Autowired
    public ModuleController(CrudModuleService crudModuleService, CrudModuleEntityService crudModuleEntityService) {
        this.crudModuleService = crudModuleService;
        this.crudModuleEntityService = crudModuleEntityService;
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<ModuleDTO>> createModule(@Valid @RequestBody ModuleDTO resource) {
        log.debug("Going to create module under package {}", resource.getPackageId());
        return crudModuleService
                .createModule(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{moduleId}")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<ModuleDTO>> getModule(@PathVariable String moduleId) {
        return crudModuleService
                .getModule(moduleId)
                .map(moduleDTO -> new ResponseDTO<>(HttpStatus.OK.value(), moduleDTO, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @PutMapping("/{moduleId}")
    public Mono<ResponseDTO<ModuleDTO>> updateModule(
            @PathVariable String moduleId, @RequestBody @Valid ModuleDTO moduleResource) {
        return crudModuleService
                .updateModule(moduleResource, moduleId)
                .map(moduleDTO -> new ResponseDTO<>(HttpStatus.OK.value(), moduleDTO, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @PutMapping("/{moduleId}/{actionId}")
    public Mono<ResponseDTO<ModuleActionDTO>> updateModuleAction(
            @PathVariable String moduleId,
            @PathVariable String actionId,
            @RequestBody @Valid ModuleActionDTO moduleActionDTO) {
        return crudModuleEntityService
                .updateModuleAction(moduleActionDTO, moduleId, actionId)
                .map(updatedModuleActionDTO -> new ResponseDTO<>(HttpStatus.OK.value(), updatedModuleActionDTO, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @DeleteMapping("/{moduleId}")
    public Mono<ResponseDTO<ModuleDTO>> deleteModule(@PathVariable String moduleId) {
        return crudModuleService
                .deleteModule(moduleId)
                .map(deletedModule ->
                        new ResponseDTO<>(HttpStatus.OK.value(), deletedModule, "Module deleted successfully"));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{moduleId}/actions")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<List<ModuleConsumable>>> getModuleActions(@PathVariable String moduleId) {
        return crudModuleEntityService
                .getModuleActions(moduleId)
                .map(moduleActions -> new ResponseDTO<>(HttpStatus.OK.value(), moduleActions, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{moduleId}/entities")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<ModuleEntitiesDTO>> getModuleEntities(@PathVariable String moduleId) {
        return crudModuleEntityService
                .getAllEntities(moduleId, CreatorContextType.MODULE, null)
                .map(moduleInstanceEntitiesDTO ->
                        new ResponseDTO<>(HttpStatus.OK.value(), moduleInstanceEntitiesDTO, null));
    }
}
