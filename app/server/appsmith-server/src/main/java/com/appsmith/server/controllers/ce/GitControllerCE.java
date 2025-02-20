package com.appsmith.server.controllers.ce;

import com.appsmith.external.dtos.GitBranchDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.ApplicationImportDTO;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.BranchProtectionRequestDTO;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitDeployKeyDTO;
import com.appsmith.server.dtos.GitDocsDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.git.autocommit.AutoCommitService;
import com.appsmith.server.git.common.CommonGitService;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.BooleanUtils;
import org.eclipse.jgit.lib.BranchTrackingStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RequestMapping(Url.GIT_URL)
@RequiredArgsConstructor
public class GitControllerCE {

    private final CommonGitService service;
    private final AutoCommitService autoCommitService;

    /**
     * applicationId is the defaultApplicationId
     * For every git connected app, the master branch applicationId is used as defaultApplicationId
     * This is stored in gitApplicationMetadata
     * Note : The master branch here refers to the app that was created even before connecting to git
     */
    @JsonView(Views.Public.class)
    @PostMapping("/profile/default")
    public Mono<ResponseDTO<Map<String, GitProfile>>> saveGitProfile(@RequestBody GitProfile gitProfile) {
        log.debug("Going to add default git profile for user");
        return service.updateOrCreateGitProfileForCurrentUser(gitProfile)
                .map(response -> new ResponseDTO<>(HttpStatus.OK, response));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/profile/app/{baseApplicationId}")
    public Mono<ResponseDTO<Map<String, GitProfile>>> saveGitProfile(
            @PathVariable String baseApplicationId, @RequestBody GitProfile gitProfile) {
        log.debug("Going to add repo specific git profile for application: {}", baseApplicationId);
        return service.updateOrCreateGitProfileForCurrentUser(gitProfile, baseApplicationId)
                .map(response -> new ResponseDTO<>(HttpStatus.ACCEPTED, response));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/profile/default")
    public Mono<ResponseDTO<GitProfile>> getDefaultGitConfigForUser() {
        return service.getDefaultGitProfileOrCreateIfEmpty()
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK, gitConfigResponse));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/profile/app/{baseApplicationId}")
    public Mono<ResponseDTO<GitProfile>> getGitConfigForUser(@PathVariable String baseApplicationId) {
        return service.getGitProfileForUser(baseApplicationId)
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK, gitConfigResponse));
    }

    @JsonView({Views.Metadata.class})
    @GetMapping("/metadata/app/{baseArtifactId}")
    public Mono<ResponseDTO<GitArtifactMetadata>> getGitMetadata(@PathVariable String baseArtifactId) {
        return service.getGitArtifactMetadata(baseArtifactId, ArtifactType.APPLICATION)
                .map(metadata -> new ResponseDTO<>(HttpStatus.OK, metadata));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/connect/app/{baseApplicationId}")
    public Mono<ResponseDTO<Application>> connectApplicationToRemoteRepo(
            @PathVariable String baseApplicationId,
            @RequestBody GitConnectDTO gitConnectDTO,
            @RequestHeader("Origin") String originHeader) {
        return service.connectArtifactToGit(baseApplicationId, gitConnectDTO, originHeader, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact)
                .map(application -> new ResponseDTO<>(HttpStatus.OK, application));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/commit/app/{branchedApplicationId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<String>> commit(
            @RequestBody GitCommitDTO commitDTO,
            @PathVariable String branchedApplicationId,
            @RequestParam(required = false, defaultValue = "false") Boolean doAmend) {
        log.debug("Going to commit branchedApplicationId {}", branchedApplicationId);
        return service.commitArtifact(commitDTO, branchedApplicationId, doAmend, ArtifactType.APPLICATION)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/push/app/{branchedApplicationId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<String>> push(@PathVariable String branchedApplicationId) {
        log.debug("Going to push branchedApplicationId {}", branchedApplicationId);
        return service.pushArtifact(branchedApplicationId, ArtifactType.APPLICATION)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/create-branch/app/{branchedApplicationId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<Application>> createBranch(
            @PathVariable String branchedApplicationId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String srcBranch,
            @RequestBody GitBranchDTO branchDTO) {
        log.debug(
                "Going to create a branch from branchedApplicationId {}, srcBranch {}",
                branchedApplicationId,
                srcBranch);
        return service.createBranch(branchedApplicationId, branchDTO, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED, result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/checkout-branch/app/{branchedApplicationId}")
    public Mono<ResponseDTO<Application>> checkoutBranch(
            @PathVariable String branchedApplicationId,
            @RequestParam(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        log.debug("Going to checkout to branch {} application {} ", branchName, branchedApplicationId);
        return service.checkoutBranch(branchedApplicationId, branchName, true, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/disconnect/app/{branchedApplicationId}")
    public Mono<ResponseDTO<Application>> disconnectFromRemote(@PathVariable String branchedApplicationId) {
        log.debug("Going to remove the remoteUrl for application {}", branchedApplicationId);
        return service.detachRemote(branchedApplicationId, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/pull/app/{branchedApplicationId}")
    public Mono<ResponseDTO<GitPullDTO>> pull(@PathVariable String branchedApplicationId) {
        log.debug("Going to pull the latest for branchedApplicationId {}", branchedApplicationId);
        return service.pullArtifact(branchedApplicationId, ArtifactType.APPLICATION)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/branch/app/{branchedApplicationId}")
    public Mono<ResponseDTO<List<GitBranchDTO>>> branch(
            @PathVariable String branchedApplicationId,
            @RequestParam(required = false, defaultValue = "false") Boolean pruneBranches) {
        log.debug("Going to get branch list for application {}", branchedApplicationId);
        return service.listBranchForArtifact(
                        branchedApplicationId, BooleanUtils.isTrue(pruneBranches), ArtifactType.APPLICATION)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/status/app/{branchedApplicationId}")
    public Mono<ResponseDTO<GitStatusDTO>> getStatus(
            @PathVariable String branchedApplicationId,
            @RequestParam(required = false, defaultValue = "true") Boolean compareRemote) {
        log.debug("Going to get status for default branchedApplicationId {}", branchedApplicationId);
        return service.getStatus(branchedApplicationId, compareRemote, ArtifactType.APPLICATION)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/fetch/remote/app/{branchedApplicationId}")
    public Mono<ResponseDTO<BranchTrackingStatus>> fetchRemoteChanges(@PathVariable String branchedApplicationId) {
        log.debug("Going to compare with remote for default branchedApplicationId {}", branchedApplicationId);
        return service.fetchRemoteChanges(branchedApplicationId, true, ArtifactType.APPLICATION)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/merge/app/{branchedApplicationId}")
    public Mono<ResponseDTO<MergeStatusDTO>> merge(
            @PathVariable String branchedApplicationId, @RequestBody GitMergeDTO gitMergeDTO) {
        log.debug(
                "Going to merge branch {} with branch {} for application {}",
                gitMergeDTO.getSourceBranch(),
                gitMergeDTO.getDestinationBranch(),
                branchedApplicationId);
        return service.mergeBranch(branchedApplicationId, gitMergeDTO, ArtifactType.APPLICATION)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/merge/status/app/{branchedApplicationId}")
    public Mono<ResponseDTO<MergeStatusDTO>> mergeStatus(
            @PathVariable String branchedApplicationId, @RequestBody GitMergeDTO gitMergeDTO) {
        log.debug(
                "Check if branch {} can be merged with branch {} for application {}",
                gitMergeDTO.getSourceBranch(),
                gitMergeDTO.getDestinationBranch(),
                branchedApplicationId);
        return service.isBranchMergeable(branchedApplicationId, gitMergeDTO, ArtifactType.APPLICATION)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/import/keys")
    public Mono<ResponseDTO<GitAuth>> generateKeyForGitImport(@RequestParam(required = false) String keyType) {
        return service.generateSSHKey(keyType).map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/import/{workspaceId}")
    public Mono<ResponseDTO<ApplicationImportDTO>> importApplicationFromGit(
            @PathVariable String workspaceId, @RequestBody GitConnectDTO gitConnectDTO) {
        return service.importArtifactFromGit(workspaceId, gitConnectDTO, ArtifactType.APPLICATION)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED, result));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/branch/app/{baseArtifactId}")
    public Mono<ResponseDTO<Application>> deleteBranch(
            @PathVariable String baseArtifactId, @RequestParam String branchName) {
        log.debug("Going to delete branch {} for baseApplicationId {}", branchName, baseArtifactId);
        return service.deleteBranch(baseArtifactId, branchName, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact)
                .map(application -> new ResponseDTO<>(HttpStatus.OK, application));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/discard/app/{branchedApplicationId}")
    public Mono<ResponseDTO<Application>> discardChanges(@PathVariable String branchedApplicationId) {
        log.debug("Going to discard changes for branchedApplicationId {}", branchedApplicationId);
        return service.discardChanges(branchedApplicationId, ArtifactType.APPLICATION)
                .map(artifact -> (Application) artifact)
                .map(result -> new ResponseDTO<>((HttpStatus.OK), result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/protocol/key-types")
    public Mono<ResponseDTO<List<GitDeployKeyDTO>>> getSupportedKeys() {
        log.debug("Going to list the list of supported keys");
        return Mono.just(GitDeployKeyGenerator.getSupportedProtocols())
                .map(gitDeployKeyDTOS -> new ResponseDTO<>(HttpStatus.OK, gitDeployKeyDTOS));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/doc-urls")
    public Mono<ResponseDTO<List<GitDocsDTO>>> getGitDocs() {
        return service.getGitDocUrls().map(gitDocDTO -> new ResponseDTO<>(HttpStatus.OK, gitDocDTO));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/branch/app/{baseArtifactId}/protected")
    public Mono<ResponseDTO<List<String>>> updateProtectedBranches(
            @PathVariable String baseArtifactId,
            @RequestBody @Valid BranchProtectionRequestDTO branchProtectionRequestDTO) {
        return service.updateProtectedBranches(
                        baseArtifactId, branchProtectionRequestDTO.getBranchNames(), ArtifactType.APPLICATION)
                .map(data -> new ResponseDTO<>(HttpStatus.OK, data));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/branch/app/{baseArtifactId}/protected")
    public Mono<ResponseDTO<List<String>>> getProtectedBranches(@PathVariable String baseArtifactId) {
        return service.getProtectedBranches(baseArtifactId, ArtifactType.APPLICATION)
                .map(list -> new ResponseDTO<>(HttpStatus.OK, list));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/auto-commit/app/{branchedApplicationId}")
    public Mono<ResponseDTO<AutoCommitResponseDTO>> autoCommitApplication(@PathVariable String branchedApplicationId) {
        return autoCommitService
                .autoCommitApplication(branchedApplicationId)
                .map(data -> new ResponseDTO<>(HttpStatus.OK, data));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/auto-commit/progress/app/{baseApplicationId}")
    public Mono<ResponseDTO<AutoCommitResponseDTO>> getAutoCommitProgress(
            @PathVariable String baseApplicationId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return service.getAutoCommitProgress(baseApplicationId, branchName, ArtifactType.APPLICATION)
                .map(data -> new ResponseDTO<>(HttpStatus.OK, data));
    }

    @JsonView(Views.Public.class)
    @PatchMapping("/auto-commit/toggle/app/{baseArtifactId}")
    public Mono<ResponseDTO<Boolean>> toggleAutoCommitEnabled(@PathVariable String baseArtifactId) {
        return service.toggleAutoCommitEnabled(baseArtifactId, ArtifactType.APPLICATION)
                .map(data -> new ResponseDTO<>(HttpStatus.OK, data));
    }
}
