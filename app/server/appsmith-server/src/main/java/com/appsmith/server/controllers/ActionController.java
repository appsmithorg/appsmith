package com.appsmith.server.controllers;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.server.constants.Url;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.NewActionService;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping(Url.ACTION_URL)
@Slf4j
public class ActionController {

    private final ActionCollectionService actionCollectionService;
    private final LayoutActionService layoutActionService;
    private final NewActionService newActionService;

    @Autowired
    public ActionController(ActionCollectionService actionCollectionService,
                            LayoutActionService layoutActionService,
                            NewActionService newActionService) {
        this.actionCollectionService = actionCollectionService;
        this.layoutActionService = layoutActionService;
        this.newActionService = newActionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<ActionDTO>> createAction(@Valid @RequestBody ActionDTO resource,
                                               @RequestHeader(name = "Origin", required = false) String originHeader,
                                               ServerWebExchange exchange) {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return actionCollectionService.createAction(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDTO<ActionDTO>> updateAction(@PathVariable String id, @RequestBody ActionDTO resource) {
        log.debug("Going to update resource with id: {}", id);
        return actionCollectionService.updateAction(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @PostMapping("/execute")
    public Mono<ResponseDTO<ActionExecutionResult>> executeAction(@RequestBody ExecuteActionDTO executeActionDTO) {
        return newActionService.executeAction(executeActionDTO)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @PutMapping("/move")
    public Mono<ResponseDTO<ActionDTO>> moveAction(@RequestBody @Valid ActionMoveDTO actionMoveDTO) {
        log.debug("Going to move action {} from page {} to page {}", actionMoveDTO.getAction().getName(), actionMoveDTO.getAction().getPageId(), actionMoveDTO.getDestinationPageId());
        return layoutActionService.moveAction(actionMoveDTO)
                .map(action -> new ResponseDTO<>(HttpStatus.OK.value(), action, null));
    }

    @PutMapping("/refactor")
    public Mono<ResponseDTO<LayoutDTO>> refactorActionName(@RequestBody RefactorNameDTO refactorNameDTO) {
        return layoutActionService.refactorActionName(refactorNameDTO)
                .map(created -> new ResponseDTO<>(HttpStatus.OK.value(), created, null));
    }

    @GetMapping("/view")
    public Mono<ResponseDTO<List<ActionViewDTO>>> getActionsForViewMode(@RequestParam String applicationId) {
        return newActionService.getActionsForViewMode(applicationId).collectList()
                .map(actions -> new ResponseDTO<>(HttpStatus.OK.value(), actions, null));
    }

    @PutMapping("/executeOnLoad/{id}")
    public Mono<ResponseDTO<ActionDTO>> setExecuteOnLoad(@PathVariable String id, @RequestParam Boolean flag) {
        log.debug("Going to set execute on load for action id {} to {}", id, flag);
        return layoutActionService.setExecuteOnLoad(id, flag)
                .map(action -> new ResponseDTO<>(HttpStatus.OK.value(), action, null));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<ActionDTO>> deleteAction(@PathVariable String id) {
        log.debug("Going to delete unpublished action with id: {}", id);
        return newActionService.deleteUnpublishedAction(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    /**
     * This function fetches all actions in edit mode.
     * To fetch the actions in view mode, check the function `getActionsForViewMode`
     *
     * The controller function is primarily used with param applicationId by the client to fetch the actions in edit
     * mode.
     *
     * @param params
     * @return
     */
    @GetMapping("")
    public Mono<ResponseDTO<List<ActionDTO>>> getAllUnpublishedActions(@RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get all actions with params : {}", params);
        return newActionService.getUnpublishedActions(params).collectList()
                .map(resources -> new ResponseDTO<>(HttpStatus.OK.value(), resources, null));
    }
}
