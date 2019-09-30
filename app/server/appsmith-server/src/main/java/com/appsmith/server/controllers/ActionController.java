package com.appsmith.server.controllers;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Action;
import com.appsmith.server.dtos.ExecuteActionDTO;
import com.appsmith.server.services.ActionService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping(Url.ACTION_URL)
public class ActionController extends BaseController<ActionService, Action, String> {

    public ActionController(ActionService service) {
        super(service);
    }

    @PostMapping("/execute")
    public Mono<ActionExecutionResult> executeAction(@RequestBody ExecuteActionDTO executeActionDTO) {
        return service.executeAction(executeActionDTO);
    }
}
