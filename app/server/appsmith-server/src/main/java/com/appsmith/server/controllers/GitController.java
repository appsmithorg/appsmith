package com.appsmith.server.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.controllers.ce.GitControllerCE;
import com.appsmith.server.domains.ce.AutoDeployment;
import com.appsmith.server.dtos.ChangeAutoDeploymentConfigDTO;
import com.appsmith.server.dtos.GitDeployApplicationResultDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.GitService;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Set;

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
    @PatchMapping("/branch/app/{defaultApplicationId}/default")
    public Mono<ResponseDTO<String>> setDefaultBranch(
            @PathVariable String defaultApplicationId, @RequestParam String branchName) {
        return service.setDefaultBranch(defaultApplicationId, branchName)
                .map(response -> new ResponseDTO<>(HttpStatus.OK.value(), response, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/deploy/app/{defaultApplicationId}")
    public Mono<ResponseDTO<GitDeployApplicationResultDTO>> deployApplication(
            @PathVariable String defaultApplicationId, @RequestParam String branchName) {
        log.debug(
                "Going to deploy application for branch {} with defaultApplicationId {}",
                branchName,
                defaultApplicationId);
        return service.autoDeployGitApplication(defaultApplicationId, branchName)
                .map(result -> new ResponseDTO<>((HttpStatus.OK.value()), result, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/auto-deployment/config/app/{defaultApplicationId}")
    public Mono<ResponseDTO<Set<AutoDeployment>>> configureAutoDeployment(
            @PathVariable String defaultApplicationId,
            @RequestBody @Valid ChangeAutoDeploymentConfigDTO autoDeploymentConfigDTO) {
        return service.configureAutoDeployment(
                        defaultApplicationId,
                        autoDeploymentConfigDTO.getBranchName(),
                        autoDeploymentConfigDTO.getEnabled())
                .map(result -> new ResponseDTO<>((HttpStatus.OK.value()), result, null));
    }
}
