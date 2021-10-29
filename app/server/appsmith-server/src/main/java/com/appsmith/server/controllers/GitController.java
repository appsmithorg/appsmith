package com.appsmith.server.controllers;

import com.appsmith.external.dtos.GitBranchListDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.MergeStatus;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.GitBranchDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.GitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping(Url.GIT_URL)
public class GitController {

    private final GitService service;

    @Autowired
    public GitController(GitService service) {
        this.service = service;
    }

    @PostMapping("/profile/default")
    public Mono<ResponseDTO<Map<String, GitProfile>>> saveGitProfile(@RequestBody GitProfile gitProfile) {
        //Add to the userData object - git config data
        return service.updateOrCreateGitProfileForCurrentUser(gitProfile)
                .map(response -> new ResponseDTO<>(HttpStatus.OK.value(), response, null));
    }

    @PutMapping("/profile/{defaultApplicationId}")
    public Mono<ResponseDTO<Map<String, GitProfile>>> saveGitProfile(@PathVariable String defaultApplicationId,
                                                                     @RequestBody GitProfile gitProfile) {
        //Add to the userData object - git config data
        return service.updateOrCreateGitProfileForCurrentUser(gitProfile, Boolean.FALSE, defaultApplicationId)
                .map(response -> new ResponseDTO<>(HttpStatus.ACCEPTED.value(), response, null));
    }

    @GetMapping("/profile/default")
    public Mono<ResponseDTO<GitProfile>> getDefaultGitConfigForUser() {
        return service.getGitProfileForUser()
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK.value(), gitConfigResponse, null));
    }

    @GetMapping("/profile/{defaultApplicationId}")
    public Mono<ResponseDTO<GitProfile>> getGitConfigForUser(@PathVariable String defaultApplicationId) {
        return service.getGitProfileForUser(defaultApplicationId)
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK.value(), gitConfigResponse, null));
    }

    @GetMapping("/metadata/{defaultApplicationId}")
    public Mono<ResponseDTO<GitApplicationMetadata>> getGitMetadata(@PathVariable String defaultApplicationId) {
        return service.getGitApplicationMetadata(defaultApplicationId)
            .map(metadata -> new ResponseDTO<>(HttpStatus.OK.value(), metadata, null));
    }

    @PostMapping("/connect/{defaultApplicationId}")
    public Mono<ResponseDTO<Application>> connectApplicationToRemoteRepo(@PathVariable String defaultApplicationId,
                                                                         @RequestBody GitConnectDTO gitConnectDTO,
                                                                         @RequestHeader("Origin") String originHeader) {
        return service.connectApplicationToGit(defaultApplicationId, gitConnectDTO, originHeader)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @PostMapping("/commit/{defaultApplicationId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<String>> commit(@RequestBody GitCommitDTO commitDTO,
                                            @PathVariable String defaultApplicationId,
                                            @RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to commit application {}, branch : {}", defaultApplicationId, params.getFirst(FieldName.BRANCH_NAME));
        return service.commitApplication(commitDTO, defaultApplicationId, params)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED.value(), result, null));
    }

    @GetMapping("/commit-history/{defaultApplicationId}")
    public Mono<ResponseDTO<List<GitLogDTO>>> getCommitHistory(@PathVariable String defaultApplicationId,
                                                               @RequestParam MultiValueMap<String, String> params) {
        log.debug("Fetching commit-history for application {}, branch : {}", defaultApplicationId, params.getFirst(FieldName.BRANCH_NAME));
        return service.getCommitHistory(defaultApplicationId, params)
                .map(logs -> new ResponseDTO<>(HttpStatus.OK.value(), logs, null));
    }

    @PostMapping("/push/{defaultApplicationId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<String>> push(@PathVariable String defaultApplicationId,
                                          @RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to push application application {}, branch : {}", defaultApplicationId, params.getFirst(FieldName.BRANCH_NAME));
        return service.pushApplication(defaultApplicationId, params)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED.value(), result, null));
    }

    @PostMapping("/create-branch/{defaultApplicationId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Application>> createBranch(@PathVariable String defaultApplicationId,
                                                       @RequestParam MultiValueMap<String, String> params,
                                                       @RequestBody GitBranchDTO branchDTO) {
        log.debug("Going to create a branch from root application {}, branch {}", defaultApplicationId, params.getFirst(FieldName.BRANCH_NAME));
        return service.createBranch(defaultApplicationId, branchDTO, params)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED.value(), result, null));
    }

    @GetMapping("/checkout-branch/{defaultApplicationId}")
    public Mono<ResponseDTO<Application>> checkoutBranch(@PathVariable String defaultApplicationId,
                                                         @RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to push application {}, branch : {}", defaultApplicationId, params.getFirst(FieldName.BRANCH_NAME));
        return service.checkoutBranch(defaultApplicationId, params.getFirst(FieldName.BRANCH_NAME))
            .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @PostMapping("/disconnect/{defaultApplicationId}")
    public Mono<ResponseDTO<Application>> disconnectFromRemote(@PathVariable String defaultApplicationId) {
        log.debug("Going to remove the remoteUrl for application {}", defaultApplicationId);
        return service.detachRemote(defaultApplicationId)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @GetMapping("/pull/{defaultApplicationId}")
    public Mono<ResponseDTO<GitPullDTO>> pull(@PathVariable String defaultApplicationId,
                                              @RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to pull the latest for application {}, branch : {}", defaultApplicationId, params.getFirst(FieldName.BRANCH_NAME));
        return service.pullApplication(defaultApplicationId, params.getFirst(FieldName.BRANCH_NAME))
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @GetMapping("/branch/{defaultApplicationId}")
    public Mono<ResponseDTO<List<GitBranchListDTO>>> branch(@PathVariable String defaultApplicationId) {
        log.debug("Going to get branch list for application {}", defaultApplicationId);
        return service.listBranchForApplication(defaultApplicationId)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @GetMapping("/status/{defaultApplicationId}")
    public Mono<ResponseDTO<Map<String, Object>>> getStatus(@PathVariable String defaultApplicationId,
                                                            @RequestParam MultiValueMap<String, String> params) {
        log.debug("Going to get status for default application {}, branch {}", defaultApplicationId, params.getFirst(FieldName.BRANCH_NAME));
        return service.getStatus(defaultApplicationId, params)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @PostMapping("/merge/{defaultApplicationId}")
    public Mono<ResponseDTO<GitPullDTO>> merge(@PathVariable String defaultApplicationId,
                                           @RequestParam String sourceBranch,
                                           @RequestParam String destinationBranch) {
        log.debug("Going to get merge branch {} with branch {} for application {}", sourceBranch, destinationBranch, defaultApplicationId);
        return service.mergeBranch(defaultApplicationId, sourceBranch, destinationBranch)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @GetMapping("/merge/status/{defaultApplicationId}")
    public Mono<ResponseDTO<MergeStatus>> mergeStatus(@PathVariable String defaultApplicationId,
                                                      @RequestParam String sourceBranch,
                                                      @RequestParam String destinationBranch) {
        log.debug("Check if branch {} can be merged with branch {} for application {}", sourceBranch, destinationBranch, defaultApplicationId);
        return service.isBranchMergeable(defaultApplicationId, sourceBranch, destinationBranch)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }


}
