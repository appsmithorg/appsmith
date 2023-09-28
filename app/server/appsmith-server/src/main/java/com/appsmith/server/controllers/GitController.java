package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.GitControllerCE;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.GitService;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
@RequestMapping(Url.GIT_URL)
public class GitController extends GitControllerCE {

    private final GitService service;

    public GitController(GitService service) {
        super(service);
        this.service = service;
    }

    @JsonView(Views.Public.class)
    @PostMapping("/branch/app/{defaultApplicationId}/protect")
    public Mono<ResponseDTO<Boolean>> protectBranch(
            @PathVariable String defaultApplicationId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.protectBranch(defaultApplicationId, branchName)
                .map(application -> new ResponseDTO<>(HttpStatus.CREATED.value(), true, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/branch/app/{defaultApplicationId}/unprotect")
    public Mono<ResponseDTO<Boolean>> unProtectBranch(
            @PathVariable String defaultApplicationId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.unProtectBranch(defaultApplicationId, branchName)
                .map(status -> new ResponseDTO<>(HttpStatus.CREATED.value(), true, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/branch/app/{defaultApplicationId}/protected")
    public Mono<ResponseDTO<List<String>>> getProtectedBranches(
            @PathVariable String defaultApplicationId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getProtectedBranches(defaultApplicationId)
                .map(list -> new ResponseDTO<>(HttpStatus.OK.value(), list, null));
    }
}
