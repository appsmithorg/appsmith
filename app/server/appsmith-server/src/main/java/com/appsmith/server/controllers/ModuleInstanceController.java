package com.appsmith.server.controllers;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ConvertToModuleRequestDTO;
import com.appsmith.server.dtos.CreateExistingEntityToModuleResponseDTO;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.ModuleInstanceEntitiesDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.moduleinstances.crud.LayoutModuleInstanceService;
import com.appsmith.server.moduleinstances.moduleconvertible.EntityToModuleConverterService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequestMapping(Url.MODULE_INSTANCE_URL)
@RestController
public class ModuleInstanceController {
    private final CrudModuleInstanceService crudModuleInstanceService;
    private final LayoutModuleInstanceService layoutModuleInstanceService;
    private final RefactoringService refactoringService;
    private final EntityToModuleConverterService entityToModuleConverterService;

    public ModuleInstanceController(
            CrudModuleInstanceService crudModuleInstanceService,
            LayoutModuleInstanceService layoutModuleInstanceService,
            RefactoringService refactoringService,
            EntityToModuleConverterService entityToModuleConverterService) {
        this.crudModuleInstanceService = crudModuleInstanceService;
        this.layoutModuleInstanceService = layoutModuleInstanceService;
        this.refactoringService = refactoringService;
        this.entityToModuleConverterService = entityToModuleConverterService;
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<CreateModuleInstanceResponseDTO>> createModuleInstance(
            @Valid @RequestBody ModuleInstanceDTO resource,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to create module instance under module {}", resource.getSourceModuleId());

        return crudModuleInstanceService
                .createModuleInstance(resource, branchName)
                .map(createdModuleInstance -> new ResponseDTO<>(HttpStatus.OK.value(), createdModuleInstance, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<List<ModuleInstanceDTO>>> getModuleInstances(
            @RequestParam String contextId,
            @RequestParam CreatorContextType contextType,
            @RequestParam(required = false, defaultValue = "false") boolean viewMode,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to fetch module instances by contextType: {} and contextId: {}", contextType, contextId);

        ResourceModes accessMode = viewMode ? ResourceModes.VIEW : ResourceModes.EDIT;
        return layoutModuleInstanceService
                .getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
                        contextId, contextType, accessMode, branchName)
                .map(moduleInstanceDTOS -> new ResponseDTO<>(HttpStatus.OK.value(), moduleInstanceDTOS, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @PutMapping("/{moduleInstanceId}")
    public Mono<ResponseDTO<ModuleInstanceDTO>> updateModuleInstance(
            @PathVariable String moduleInstanceId,
            @RequestBody @Valid ModuleInstanceDTO moduleInstanceDTO,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to update module instance with id: {}", moduleInstanceId);
        return layoutModuleInstanceService
                .updateUnpublishedModuleInstance(moduleInstanceDTO, moduleInstanceId, branchName, false)
                .map(updatedModuleInstanceDTO ->
                        new ResponseDTO<>(HttpStatus.OK.value(), updatedModuleInstanceDTO, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @DeleteMapping("/{moduleInstanceId}")
    public Mono<ResponseDTO<ModuleInstanceDTO>> deleteModuleInstance(
            @PathVariable String moduleInstanceId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return crudModuleInstanceService
                .deleteUnpublishedModuleInstance(moduleInstanceId, branchName)
                .map(deletedModuleInstance -> new ResponseDTO<>(
                        HttpStatus.OK.value(), deletedModuleInstance, "Module instance deleted successfully"));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/entities")
    @ResponseStatus(HttpStatus.OK)
    public Mono<ResponseDTO<ModuleInstanceEntitiesDTO>> getModuleInstanceEntities(
            @RequestParam String contextId,
            @RequestParam CreatorContextType contextType,
            @RequestParam(required = false, defaultValue = "false") boolean viewMode,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug(
                "Going to fetch module instance entities by contextType: {} and contextId: {}", contextType, contextId);

        return crudModuleInstanceService
                .getAllEntities(contextId, contextType, branchName, viewMode)
                .map(moduleInstanceEntitiesDTO ->
                        new ResponseDTO<>(HttpStatus.OK.value(), moduleInstanceEntitiesDTO, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/refactor")
    public Mono<ResponseDTO<LayoutDTO>> refactorModuleInstanceName(
            @RequestBody RefactorEntityNameDTO refactorEntityNameDTO,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        refactorEntityNameDTO.setEntityType(EntityType.MODULE_INSTANCE);
        return refactoringService
                .refactorCompositeEntityName(refactorEntityNameDTO, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/convert")
    public Mono<ResponseDTO<CreateExistingEntityToModuleResponseDTO>> convertQueryToModule(
            @RequestBody ConvertToModuleRequestDTO convertToModuleRequestDTO,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return entityToModuleConverterService
                .convertExistingEntityToModule(convertToModuleRequestDTO, branchName)
                .map(converted -> new ResponseDTO<>(HttpStatus.OK.value(), converted, "Operation successful"));
    }
}
