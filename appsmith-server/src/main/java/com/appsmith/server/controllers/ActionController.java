package com.appsmith.server.controllers;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Collection;
import com.appsmith.server.dtos.ExecuteActionDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ActionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import javax.validation.Valid;

@RestController
@RequestMapping(Url.ACTION_URL)
@Slf4j
public class ActionController extends BaseController<ActionService, Action, String> {

    private final ActionCollectionService actionCollectionService;

    @Autowired
    public ActionController(ActionService service,
                            ActionCollectionService actionCollectionService) {
        super(service);
        this.actionCollectionService = actionCollectionService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Action>> create(@Valid @RequestBody Action resource) throws AppsmithException {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return actionCollectionService.createAction(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @PutMapping("/{id}")
    public Mono<ResponseDTO<Action>> update(@PathVariable String id, @RequestBody Action resource) {
        log.debug("Going to update resource with id: {}", id);
        return actionCollectionService.updateAction(id, resource)
                .map(updatedResource -> new ResponseDTO<>(HttpStatus.OK.value(), updatedResource, null));
    }

    @PostMapping("/execute")
    public Mono<ActionExecutionResult> executeAction(@RequestBody ExecuteActionDTO executeActionDTO) {
        return service.executeAction(executeActionDTO);
    }
}
