package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.EntityType;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.refactors.applications.RefactoringService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.solutions.ActionExecutionSolution;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.util.MultiValueMap;
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
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequestMapping(Url.ACTION_URL)
@RequiredArgsConstructor
public class ActionControllerCE {

    private final LayoutActionService layoutActionService;
    private final NewActionService newActionService;
    private final RefactoringService refactoringService;
    private final ActionExecutionSolution actionExecutionSolution;

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<ActionDTO>> createAction(
            @Valid @RequestBody @JsonView(FromRequest.class) ActionDTO resource) {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return layoutActionService
                .createSingleAction(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED, created));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{branchedActionId}")
    public Mono<ResponseDTO<ActionDTO>> updateAction(
            @PathVariable String branchedActionId,
            @Valid @RequestBody @JsonView(FromRequest.class) ActionDTO resource) {
        log.debug("Going to update resource with branchedActionId: {}", branchedActionId);
        return layoutActionService
                .updateNewActionByBranchedId(branchedActionId, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK, updatedResource));
    }

    @JsonView(Views.Public.class)
    @PostMapping(value = "/execute", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseDTO<ActionExecutionResult>> executeAction(
            @RequestBody Flux<Part> partFlux,
            @RequestHeader(name = FieldName.HEADER_ENVIRONMENT_ID, required = false) String environmentId,
            ServerWebExchange serverWebExchange) {

        return actionExecutionSolution
                .executeAction(
                        partFlux, environmentId, serverWebExchange.getRequest().getHeaders(), Boolean.FALSE)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK, updatedResource));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/move")
    public Mono<ResponseDTO<ActionDTO>> moveAction(@RequestBody @Valid ActionMoveDTO actionMoveDTO) {
        log.debug(
                "Going to move action {} from page {} to page {}",
                actionMoveDTO.getAction().getName(),
                actionMoveDTO.getAction().getPageId(),
                actionMoveDTO.getDestinationPageId());
        return layoutActionService.moveAction(actionMoveDTO).map(action -> new ResponseDTO<>(HttpStatus.OK, action));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/refactor")
    public Mono<ResponseDTO<LayoutDTO>> refactorActionName(@RequestBody RefactorEntityNameDTO refactorEntityNameDTO) {
        refactorEntityNameDTO.setEntityType(EntityType.ACTION);
        return refactoringService
                .refactorEntityName(refactorEntityNameDTO)
                .map(created -> new ResponseDTO<>(HttpStatus.OK, created));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/view")
    public Mono<ResponseDTO<List<ActionViewDTO>>> getActionsForViewMode(
            @RequestParam(name = FieldName.APPLICATION_ID) String branchedApplicationId) {
        return newActionService
                .getActionsForViewMode(branchedApplicationId)
                .collectList()
                .map(actions -> new ResponseDTO<>(HttpStatus.OK, actions));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/executeOnLoad/{branchedActionId}")
    public Mono<ResponseDTO<ActionDTO>> setExecuteOnLoad(
            @PathVariable String branchedActionId, @RequestParam Boolean flag) {
        log.debug("Going to set execute on load for action id {} to {}", branchedActionId, flag);
        return layoutActionService
                .setExecuteOnLoad(branchedActionId, flag)
                .map(action -> new ResponseDTO<>(HttpStatus.OK, action));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<ActionDTO>> deleteAction(
            @PathVariable String id, @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to delete unpublished action with id: {}, branchName: {}", id, branchName);
        return layoutActionService
                .deleteUnpublishedAction(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK, deletedResource));
    }

    /**
     * This function fetches all actions in edit mode.
     * To fetch the actions in view mode, check the function `getActionsForViewMode`
     * <p>
     * The controller function is primarily used with param applicationId by the client to fetch the actions in edit
     * mode.
     */
    @JsonView(Views.Public.class)
    @GetMapping("")
    public Mono<ResponseDTO<List<ActionDTO>>> getAllUnpublishedActions(
            @RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get all actions with params: {}", params);
        // We handle JS actions as part of the collections request,
        // so that all the contextual variables are also picked up
        return newActionService
                .getUnpublishedActionsExceptJs(params)
                .collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK, resources));
    }
}
