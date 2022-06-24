package com.appsmith.server.controllers.ce;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitDeployKeyDTO;
import com.appsmith.server.dtos.GitDocsDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.appsmith.server.services.GitService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.BooleanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
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
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;

@Slf4j
@RequestMapping(Url.GIT_URL)
public class GitControllerCE {

    private final GitService service;

    @Autowired
    public GitControllerCE(GitService service) {
        this.service = service;
    }
    /**
     * applicationId is the defaultApplicationId
     * For every git connected app, the master branch applicationId is used as defaultApplicationId
     * This is stored in gitApplicationMetadata
     * Note : The master branch here refers to the app that was created even before connecting to git
     * */

    @PostMapping("/profile/default")
    public Mono<ResponseDTO<Map<String, GitProfile>>> saveGitProfile(@RequestBody GitProfile gitProfile) {
        log.debug("Going to add default git profile for user");
        return service.updateOrCreateGitProfileForCurrentUser(gitProfile)
                .map(response -> new ResponseDTO<>(HttpStatus.OK.value(), response, null));
    }

    @PutMapping("/profile")
    public Mono<ResponseDTO<Map<String, GitProfile>>> saveGitProfile(@RequestParam String applicationId,
                                                                     @RequestBody GitProfile gitProfile) {
        log.debug("Going to add repo specific git profile for application: {}", applicationId);
        return service.updateOrCreateGitProfileForCurrentUser(gitProfile, applicationId)
                .map(response -> new ResponseDTO<>(HttpStatus.ACCEPTED.value(), response, null));
    }

    @GetMapping("/profile/default")
    public Mono<ResponseDTO<GitProfile>> getDefaultGitConfigForUser() {
        return service.getDefaultGitProfileOrCreateIfEmpty()
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK.value(), gitConfigResponse, null));
    }

    @GetMapping("/profile")
    public Mono<ResponseDTO<GitProfile>> getGitConfigForUser(@RequestParam String applicationId) {
        return service.getGitProfileForUser(applicationId)
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK.value(), gitConfigResponse, null));
    }

    @GetMapping("/metadata")
    public Mono<ResponseDTO<GitApplicationMetadata>> getGitMetadata(@RequestParam String applicationId) {
        return service.getGitApplicationMetadata(applicationId)
                .map(metadata -> new ResponseDTO<>(HttpStatus.OK.value(), metadata, null));
    }

    @PostMapping("/connect")
    public Mono<ResponseDTO<Application>> connectApplicationToRemoteRepo(@RequestParam String applicationId,
                                                                         @RequestBody GitConnectDTO gitConnectDTO,
                                                                         @RequestHeader("Origin") String originHeader) {
        return service.connectApplicationToGit(applicationId, gitConnectDTO, originHeader)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @PostMapping("/commit")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<String>> commit(@RequestBody GitCommitDTO commitDTO,
                                            @RequestParam String applicationId,
                                            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName,
                                            @RequestParam(required = false, defaultValue = "false") Boolean doAmend) {
        log.debug("Going to commit application {}, branch : {}", applicationId, branchName);
        return service.commitApplication(commitDTO, applicationId, branchName, doAmend)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED.value(), result, null));
    }

    @PostMapping("/create-branch")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Application>> createBranch(@RequestParam String applicationId,
                                                       @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String srcBranch,
                                                       @RequestBody GitBranchDTO branchDTO) {
        log.debug("Going to create a branch from root application {}, srcBranch {}", applicationId, srcBranch);
        return service.createBranch(applicationId, branchDTO, srcBranch)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED.value(), result, null));
    }

    @GetMapping("/checkout-branch")
    public Mono<ResponseDTO<Application>> checkoutBranch(@RequestParam String applicationId,
                                                         @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to checkout to branch {} application {} ", branchName, applicationId);
        return service.checkoutBranch(applicationId, branchName)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @PostMapping("/disconnect")
    public Mono<ResponseDTO<Application>> disconnectFromRemote(@RequestParam String applicationId) {
        log.debug("Going to remove the remoteUrl for application {}", applicationId);
        return service.detachRemote(applicationId)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @GetMapping("/pull")
    public Mono<ResponseDTO<GitPullDTO>> pull(@RequestParam String applicationId,
                                              @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to pull the latest for application {}, branch {}", applicationId, branchName);
        return service.pullApplication(applicationId, branchName)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @GetMapping("/list/branch")
    public Mono<ResponseDTO<List<GitBranchDTO>>> branch(@RequestParam String applicationId,
                                                        @RequestParam(required = false, defaultValue = "false") Boolean pruneBranches,
                                                        @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to get branch list for application {}", applicationId);
        return service.listBranchForApplication(applicationId, BooleanUtils.isTrue(pruneBranches), branchName)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @GetMapping("/status")
    public Mono<ResponseDTO<GitStatusDTO>> getStatus(@RequestParam String applicationId,
                                                     @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to get status for default application {}, branch {}", applicationId, branchName);
        return service.getStatus(applicationId, branchName)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @PostMapping("/merge")
    public Mono<ResponseDTO<MergeStatusDTO>> merge(@RequestParam String applicationId,
                                               @RequestBody GitMergeDTO gitMergeDTO) {
        log.debug("Going to merge branch {} with branch {} for application {}", gitMergeDTO.getSourceBranch(), gitMergeDTO.getDestinationBranch(), applicationId);
        return service.mergeBranch(applicationId, gitMergeDTO)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @PostMapping("/merge/status")
    public Mono<ResponseDTO<MergeStatusDTO>> mergeStatus(@RequestParam String applicationId,
                                                         @RequestBody GitMergeDTO gitMergeDTO) {
        log.debug("Check if branch {} can be merged with branch {} for application {}",gitMergeDTO.getSourceBranch(), gitMergeDTO.getDestinationBranch(), applicationId);
        return service.isBranchMergeable(applicationId, gitMergeDTO)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @PostMapping("/conflicted-branch")
    public Mono<ResponseDTO<String>> createConflictedBranch(@RequestParam String applicationId,
                                                            @RequestHeader(name = FieldName.BRANCH_NAME) String branchName) {
        log.debug("Going to create conflicted state branch {} for application {}", branchName, applicationId);
        return service.createConflictedBranch(applicationId, branchName)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }

    @GetMapping("/import/keys")
    public Mono<ResponseDTO<GitAuth>> generateKeyForGitImport(@RequestParam(required = false) String keyType) {
        return service.generateSSHKey(keyType)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }
    
    @PostMapping("/import/{workspaceId}")
    public Mono<ResponseDTO<ApplicationImportDTO>> importApplicationFromGit(@PathVariable String workspaceId,
                                                                            @RequestBody GitConnectDTO gitConnectDTO) {
        return service.importApplicationFromGit(workspaceId, gitConnectDTO)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED.value(), result, null));
    }

    @GetMapping("/test-connection")
    public Mono<ResponseDTO<Boolean>> testGitConnection(@RequestParam String applicationId) {
        return service.testConnection(applicationId)
                .map(result -> new ResponseDTO<>((HttpStatus.OK.value()), result, null));
    }

    @DeleteMapping("/branch")
    public Mono<ResponseDTO<Application>> deleteBranch(@RequestParam String applicationId, @RequestParam String branchName) {
        log.debug("Going to delete branch {} for defaultApplicationId {}", branchName, applicationId);
        return service.deleteBranch(applicationId, branchName)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @PutMapping("/discard")
    public Mono<ResponseDTO<Application>> discardChanges(@RequestParam String applicationId,
                                                         @RequestParam(required = false, defaultValue = "true") Boolean doPull,
                                                         @RequestHeader(name = FieldName.BRANCH_NAME) String branchName) {
        log.debug("Going to discard changes for branch {} with defaultApplicationId {}", branchName, applicationId);
        return service.discardChanges(applicationId, branchName, doPull)
                .map(result -> new ResponseDTO<>((HttpStatus.OK.value()), result, null));
    }

    @GetMapping("/protocol/key-types")
    public Mono<ResponseDTO<List<GitDeployKeyDTO>>> getSupportedKeys() {
        log.debug("Going to list the list of supported keys");
        return Mono.just(GitDeployKeyGenerator.getSupportedProtocols())
                .map(gitDeployKeyDTOS -> new ResponseDTO<>(HttpStatus.OK.value(), gitDeployKeyDTOS, null));
    }

    @GetMapping("/doc-urls")
    public Mono<ResponseDTO<List<GitDocsDTO>>> getGitDocs() {
        return service.getGitDocUrls()
                .map(gitDocDTO -> new ResponseDTO<>(HttpStatus.OK.value(), gitDocDTO, null));
    }

}
