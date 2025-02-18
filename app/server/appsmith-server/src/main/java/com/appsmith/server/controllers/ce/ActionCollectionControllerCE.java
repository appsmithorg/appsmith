package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.LayoutCollectionService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequestMapping(Url.ACTION_COLLECTION_URL)
public class ActionCollectionControllerCE {
    private final ActionCollectionService actionCollectionService;
    private final LayoutCollectionService layoutCollectionService;
    private final RefactoringService refactoringService;

    @Autowired
    public ActionCollectionControllerCE(
            ActionCollectionService actionCollectionService,
            LayoutCollectionService layoutCollectionService,
            RefactoringService refactoringService) {
        this.actionCollectionService = actionCollectionService;
        this.layoutCollectionService = layoutCollectionService;
        this.refactoringService = refactoringService;
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<ActionCollectionDTO>> create(@Valid @RequestBody ActionCollectionDTO resource) {
        log.debug("Going to create action collection {}", resource.getClass().getName());
        return layoutCollectionService
                .createCollection(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED, created));
    }

    @JsonView(Views.Public.class)
    @GetMapping("")
    public Mono<ResponseDTO<List<ActionCollectionDTO>>> getAllUnpublishedActionCollections(
            @RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get all unpublished action collections with params: {}", params);
        return actionCollectionService
                .getPopulatedActionCollectionsByViewMode(params, false)
                .collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK, resources));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/move")
    public Mono<ResponseDTO<ActionCollectionDTO>> moveActionCollection(
            @RequestBody @Valid ActionCollectionMoveDTO actionCollectionMoveDTO) {
        log.debug(
                "Going to move action collection with id {} to page {}",
                actionCollectionMoveDTO.getCollectionId(),
                actionCollectionMoveDTO.getDestinationPageId());
        return layoutCollectionService
                .moveCollection(actionCollectionMoveDTO)
                .map(actionCollection -> new ResponseDTO<>(HttpStatus.OK, actionCollection));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/refactor")
    public Mono<ResponseDTO<LayoutDTO>> refactorActionCollectionName(
            @RequestBody RefactorEntityNameDTO refactorEntityNameDTO) {
        refactorEntityNameDTO.setEntityType(EntityType.JS_OBJECT);
        return refactoringService
                .refactorEntityName(refactorEntityNameDTO)
                .map(created -> new ResponseDTO<>(HttpStatus.OK, created));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/view")
    public Mono<ResponseDTO<List<ActionCollectionViewDTO>>> getAllPublishedActionCollections(
            @RequestParam String applicationId) {
        log.debug("Going to get all published action collections with application Id: {}", applicationId);
        return actionCollectionService
                .getActionCollectionsForViewMode(applicationId, null)
                .collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK, resources));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{id}")
    public Mono<ResponseDTO<ActionCollectionDTO>> updateActionCollection(
            @PathVariable String id, @Valid @RequestBody ActionCollectionDTO resource) {
        log.debug("Going to update action collection with id: {}", id);
        return layoutCollectionService
                .updateUnpublishedActionCollection(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK, updatedResource));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{id}/body")
    public Mono<ResponseDTO<Integer>> updateActionCollectionBody(
            @PathVariable String id, @Valid @RequestBody ActionCollectionDTO resource) {
        log.debug("Going to update action collection body with id: {}", id);
        return layoutCollectionService
                .updateUnpublishedActionCollectionBody(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK, updatedResource));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/refactorAction")
    public Mono<ResponseDTO<LayoutDTO>> refactorActionCollection(
            @Valid @RequestBody RefactorEntityNameDTO refactorEntityNameDTO) {
        log.debug(
                "Going to refactor action collection with id: {}",
                refactorEntityNameDTO.getActionCollection().getId());

        refactorEntityNameDTO.setEntityType(EntityType.JS_ACTION);
        return refactoringService
                .refactorEntityName(refactorEntityNameDTO)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK, updatedResource));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<ActionCollectionDTO>> deleteActionCollection(@PathVariable String id) {
        log.debug("Going to delete unpublished action collection with id: {}", id);
        return actionCollectionService
                .deleteUnpublishedActionCollection(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK, deletedResource));
    }
}
