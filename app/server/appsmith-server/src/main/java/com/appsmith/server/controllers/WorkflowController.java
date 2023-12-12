package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.workflows.crud.CrudWorkflowEntityService;
import com.appsmith.server.workflows.crud.CrudWorkflowService;
import com.appsmith.server.workflows.interact.InteractWorkflowService;
import com.appsmith.server.workflows.proxy.ProxyWorkflowService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
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

import java.util.List;

@Slf4j
@RequestMapping(Url.WORKFLOW_URL)
@RestController
public class WorkflowController {

    private final CrudWorkflowService crudWorkflowService;

    private final ProxyWorkflowService proxyWorkflowService;

    private final InteractWorkflowService interactWorkflowService;
    private final CrudWorkflowEntityService crudWorkflowEntityService;

    public WorkflowController(
            CrudWorkflowService crudWorkflowService,
            ProxyWorkflowService proxyWorkflowService,
            InteractWorkflowService interactWorkflowService,
            CrudWorkflowEntityService crudWorkflowEntityService) {
        this.crudWorkflowService = crudWorkflowService;
        this.proxyWorkflowService = proxyWorkflowService;
        this.interactWorkflowService = interactWorkflowService;
        this.crudWorkflowEntityService = crudWorkflowEntityService;
    }

    @JsonView(Views.Public.class)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Workflow>> createWorkflow(
            @Valid @RequestBody Workflow resource,
            @RequestParam(name = "workspaceId") String workspaceId,
            @RequestHeader(name = "Origin", required = false) String originHeader,
            ServerWebExchange exchange) {
        log.debug("Going to create workflow in workspace {}", workspaceId);
        return crudWorkflowService
                .createWorkflow(resource, workspaceId)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED.value(), created, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @GetMapping
    public Mono<ResponseDTO<List<Workflow>>> getWorkflowsByWorkspace(
            @RequestParam(name = "workspaceId") String workspaceId) {
        return crudWorkflowService
                .getAllWorkflows(workspaceId)
                .collectList()
                .map(workflows -> new ResponseDTO<>(HttpStatus.OK.value(), workflows, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/{workflowId}")
    public Mono<ResponseDTO<Workflow>> getWorkflowById(@PathVariable String workflowId) {
        return crudWorkflowService
                .getWorkflowById(workflowId)
                .map(workflow -> new ResponseDTO<>(HttpStatus.OK.value(), workflow, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @PutMapping("/{workflowId}")
    public Mono<ResponseDTO<Workflow>> updateWorkflow(
            @PathVariable String workflowId, @RequestBody @Valid Workflow workflow) {
        log.debug("Going to update workflow {}", workflowId);
        return crudWorkflowService
                .updateWorkflow(workflow, workflowId)
                .map(updatedWorkflow -> new ResponseDTO<>(HttpStatus.OK.value(), updatedWorkflow, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @DeleteMapping("/{id}")
    public Mono<ResponseDTO<Workflow>> deleteWorkflow(@PathVariable String id) {
        log.debug("Going to delete workflow with id: {}", id);
        return crudWorkflowService
                .deleteWorkflow(id)
                .map(deletedResource -> new ResponseDTO<>(HttpStatus.OK.value(), deletedResource, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/history")
    public Mono<ResponseDTO<JSONObject>> getWorkflowHistory(@RequestParam MultiValueMap<String, String> filters) {
        return proxyWorkflowService
                .getWorkflowHistory(filters)
                .map(workflowHistory -> new ResponseDTO<>(HttpStatus.OK.value(), workflowHistory, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/history/{id}")
    public Mono<ResponseDTO<JSONObject>> getWorkflowHistoryForWorkflowId(
            @PathVariable String id, @RequestParam MultiValueMap<String, String> filters) {
        return proxyWorkflowService
                .getWorkflowHistoryByWorkflowId(id, filters)
                .map(workflowHistory -> new ResponseDTO<>(HttpStatus.OK.value(), workflowHistory, null));
    }

    @JsonView(Views.Public.class)
    @ResponseStatus(HttpStatus.OK)
    @DeleteMapping("/token/{id}")
    public Mono<ResponseDTO<Boolean>> archiveBearerTokenForWorkflow(@PathVariable String id) {
        log.debug("Archiving Bearer Token for workflow: {}", id);
        return interactWorkflowService
                .archiveBearerTokenForWebhook(id)
                .map(archived -> new ResponseDTO<>(HttpStatus.OK.value(), archived, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/publish/{workflowId}")
    public Mono<ResponseDTO<Workflow>> publish(@PathVariable String workflowId) {
        return interactWorkflowService
                .publishWorkflow(workflowId)
                .map(publishedWorkflow -> new ResponseDTO<>(HttpStatus.OK.value(), publishedWorkflow, null));
    }
}
