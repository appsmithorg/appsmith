package com.appsmith.server.controllers.ce;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorActionNameDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.solutions.RefactoringSolution;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

import jakarta.validation.Valid;
import java.util.List;

@Slf4j
@RequestMapping(Url.ACTION_URL)
public class ActionControllerCE {

    private final LayoutActionService layoutActionService;
    private final NewActionService newActionService;
    private final RefactoringSolution refactoringSolution;

    @Autowired
    public ActionControllerCE(LayoutActionService layoutActionService,
                              NewActionService newActionService,
                              RefactoringSolution refactoringSolution) {
        this.layoutActionService = layoutActionService;
        this.newActionService = newActionService;
        this.refactoringSolution = refactoringSolution;
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<ActionDTO>> createAction(@Valid @RequestBody ActionDTO resource,
                                                     @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
                                                     @RequestHeader(name = "Origin", required = false) String originHeader,
                                                     ServerWebExchange exchange) {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return layoutActionService.createSingleActionWithBranch(resource, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{defaultActionId}")
    public Mono<ResponseDTO<ActionDTO>> updateAction(@PathVariable String defaultActionId,
                                                     @Valid @RequestBody ActionDTO resource,
                                                     @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to update resource with defaultActionId: {}, branch: {}", defaultActionId, branchName);
        return layoutActionService.updateSingleActionWithBranchName(defaultActionId, resource, branchName)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping(value = "/execute", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Mono<ResponseDTO<ActionExecutionResult>> executeAction(@RequestBody Flux<Part> partFlux,
                                                                  @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
                                                                  @RequestHeader(name = FieldName.ENVIRONMENT_NAME, required = false) String environmentName) {
        return newActionService.executeAction(partFlux, branchName, environmentName)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/move")
    public Mono<ResponseDTO<ActionDTO>> moveAction(@RequestBody @Valid ActionMoveDTO actionMoveDTO,
                                                   @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to move action {} from page {} to page {} on branch {}", actionMoveDTO.getAction().getName(), actionMoveDTO.getAction().getPageId(), actionMoveDTO.getDestinationPageId(), branchName);
        return layoutActionService.moveAction(actionMoveDTO, branchName)
                .map(action -> new ResponseDTO<>(HttpStatus.OK.value(), action, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/refactor")
    public Mono<ResponseDTO<LayoutDTO>> refactorActionName(@RequestBody RefactorActionNameDTO refactorActionNameDTO,
                                                           @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return refactoringSolution.refactorActionName(refactorActionNameDTO, branchName)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/view")
    public Mono<ResponseDTO<List<ActionViewDTO>>> getActionsForViewMode(@RequestParam String applicationId,
                                                                        @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return newActionService.getActionsForViewMode(applicationId, branchName).collectList()
                .map(actions -> new ResponseDTO<>(HttpStatus.OK.value(), actions, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/executeOnLoad/{defaultActionId}")
    public Mono<ResponseDTO<ActionDTO>> setExecuteOnLoad(@PathVariable String defaultActionId,
                                                         @RequestParam Boolean flag,
                                                         @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to set execute on load for action id {} and branchName {} to {}", defaultActionId, branchName, flag);
        return layoutActionService.setExecuteOnLoad(defaultActionId, branchName, flag)
                .map(action -> new ResponseDTO<>(HttpStatus.OK.value(), action, null));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<ActionDTO>> deleteAction(@PathVariable String id,
                                                     @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to delete unpublished action with id: {}, branchName: {}", id, branchName);
        return layoutActionService.deleteUnpublishedAction(id, branchName)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    /**
     * This function fetches all actions in edit mode.
     * To fetch the actions in view mode, check the function `getActionsForViewMode`
     * <p>
     * The controller function is primarily used with param applicationId by the client to fetch the actions in edit
     * mode.
     *
     * @param params
     * @return
     */
    @JsonView(Views.Public.class)
    @GetMapping("")
    public Mono<ResponseDTO<List<ActionDTO>>> getAllUnpublishedActions(@RequestParam MultiValueMap<String, String> params,
                                                                       @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to get all actions with params: {}, branch: {}", params, branchName);
        // We handle JS actions as part of the collections request, so that all the contextual variables are also picked up
        return newActionService.getUnpublishedActionsExceptJs(params, branchName)
                .collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }
}
