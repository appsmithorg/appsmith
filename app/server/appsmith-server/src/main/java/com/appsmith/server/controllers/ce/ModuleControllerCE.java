package com.appsmith.server.controllers.ce;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.helpers.AppsmithEventContextType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ModuleDTO;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.repositories.CustomModuleRepository;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.ModuleService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Slf4j
@RequestMapping("/api/v1/modules")
public class ModuleControllerCE {

    private final ModuleService moduleService;
    private final ModuleRepository moduleRepository;
    private final LayoutActionService layoutActionService;

    @Autowired
    public ModuleControllerCE(ModuleService moduleService,
                              ModuleRepository moduleRepository,
                              LayoutActionService layoutActionService) {
        this.moduleService = moduleService;
        this.moduleRepository = moduleRepository;
        this.layoutActionService = layoutActionService;
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<ModuleDTO>> createModule(@Valid @RequestBody ModuleDTO resource,
                                                     @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
                                                     @RequestHeader(name = "Origin", required = false) String originHeader,
                                                     ServerWebExchange exchange) {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return moduleService.createModule(resource)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/action")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<ActionDTO>> createAction(@Valid @RequestBody ActionDTO resource,
                                                     @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
                                                     @RequestHeader(name = "Origin", required = false) String originHeader,
                                                     ServerWebExchange exchange) {
        log.debug("Going to create resource {}", resource.getClass().getName());
        return layoutActionService.createAction(resource, new AppsmithEventContext(AppsmithEventContextType.DEFAULT), false)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }
}
