package com.appsmith.server.git.controllers;

import com.appsmith.external.dtos.GitRefDTO;
import com.appsmith.external.dtos.GitStatusDTO;
import com.appsmith.external.dtos.MergeStatusDTO;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.views.Views;
import com.appsmith.git.dto.CommitDTO;
import com.appsmith.server.artifacts.base.ArtifactService;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.GitArtifactMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.AutoCommitResponseDTO;
import com.appsmith.server.dtos.BranchProtectionRequestDTO;
import com.appsmith.server.dtos.GitAuthDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitMergeDTO;
import com.appsmith.server.dtos.GitPullDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.git.autocommit.AutoCommitService;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.central.GitType;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.BooleanUtils;
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

@Slf4j
@RequestMapping(Url.GIT_APPLICATION_URL)
@RequiredArgsConstructor
public class GitApplicationControllerCE {

    protected final CentralGitService centralGitService;
    protected final AutoCommitService autoCommitService;
    protected final ArtifactService artifactService;

    protected static final ArtifactType ARTIFACT_TYPE = ArtifactType.APPLICATION;
    protected static final GitType GIT_TYPE = GitType.FILE_SYSTEM;

    @JsonView({Views.Metadata.class})
    @GetMapping("/{baseApplicationId}/metadata")
    public Mono<ResponseDTO<GitArtifactMetadata>> getGitMetadata(@PathVariable String baseApplicationId) {
        return centralGitService
                .getGitArtifactMetadata(baseApplicationId, ARTIFACT_TYPE)
                .map(metadata -> new ResponseDTO<>(HttpStatus.OK, metadata));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{applicationId}/connect")
    public Mono<ResponseDTO<? extends Artifact>> connectApplicationToRemoteRepo(
            @PathVariable String applicationId,
            @RequestBody GitConnectDTO gitConnectDTO,
            @RequestHeader("Origin") String originHeader) {
        return centralGitService
                .connectArtifactToGit(applicationId, ARTIFACT_TYPE, gitConnectDTO, originHeader, GIT_TYPE)
                .map(application -> new ResponseDTO<>(HttpStatus.OK, application));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{branchedApplicationId}/commit")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<String>> commit(
            @RequestBody CommitDTO commitDTO, @PathVariable String branchedApplicationId) {
        log.info("Going to commit branchedApplicationId {}", branchedApplicationId);
        return centralGitService
                .commitArtifact(commitDTO, branchedApplicationId, ARTIFACT_TYPE, GIT_TYPE)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{referencedApplicationId}/create-ref")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<? extends Artifact>> createReference(
            @PathVariable String referencedApplicationId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String srcBranch,
            @RequestBody GitRefDTO gitRefDTO) {
        log.info(
                "Going to create a reference from referencedApplicationId {}, srcBranch {}",
                referencedApplicationId,
                srcBranch);
        return centralGitService
                .createReference(referencedApplicationId, ARTIFACT_TYPE, gitRefDTO, GIT_TYPE)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{referencedApplicationId}/checkout-ref")
    public Mono<ResponseDTO<? extends Artifact>> checkoutReference(
            @PathVariable String referencedApplicationId, @RequestBody GitRefDTO gitRefDTO) {
        return centralGitService
                .checkoutReference(referencedApplicationId, ARTIFACT_TYPE, gitRefDTO, true, GIT_TYPE)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{branchedApplicationId}/disconnect")
    public Mono<ResponseDTO<? extends Artifact>> disconnectFromRemote(@PathVariable String branchedApplicationId) {
        log.info("Going to remove the remoteUrl for application {}", branchedApplicationId);
        return centralGitService
                .detachRemote(branchedApplicationId, ARTIFACT_TYPE, GIT_TYPE)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{branchedApplicationId}/pull")
    public Mono<ResponseDTO<GitPullDTO>> pull(@PathVariable String branchedApplicationId) {
        log.info("Going to pull the latest for branchedApplicationId {}", branchedApplicationId);
        return centralGitService
                .pullArtifact(branchedApplicationId, ARTIFACT_TYPE, GIT_TYPE)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{branchedApplicationId}/status")
    public Mono<ResponseDTO<GitStatusDTO>> getStatus(
            @PathVariable String branchedApplicationId,
            @RequestParam(required = false, defaultValue = "true") Boolean compareRemote) {
        log.info("Going to get status for branchedApplicationId {}", branchedApplicationId);
        return centralGitService
                .getStatus(branchedApplicationId, ARTIFACT_TYPE, compareRemote, GIT_TYPE)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{referencedApplicationId}/fetch/remote")
    public Mono<ResponseDTO<String>> fetchRemoteChanges(
            @PathVariable String referencedApplicationId,
            @RequestHeader(required = false, defaultValue = "branch") RefType refType) {
        log.info("Going to compare with remote for default referencedApplicationId {}", referencedApplicationId);
        return centralGitService
                .fetchRemoteChanges(referencedApplicationId, ARTIFACT_TYPE, true, GIT_TYPE, refType)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{branchedApplicationId}/merge")
    public Mono<ResponseDTO<MergeStatusDTO>> merge(
            @PathVariable String branchedApplicationId, @RequestBody GitMergeDTO gitMergeDTO) {
        log.debug(
                "Going to merge branch {} with branch {} for application {}",
                gitMergeDTO.getSourceBranch(),
                gitMergeDTO.getDestinationBranch(),
                branchedApplicationId);
        return centralGitService
                .mergeBranch(branchedApplicationId, ARTIFACT_TYPE, gitMergeDTO, GIT_TYPE)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{branchedApplicationId}/merge/status")
    public Mono<ResponseDTO<MergeStatusDTO>> mergeStatus(
            @PathVariable String branchedApplicationId, @RequestBody GitMergeDTO gitMergeDTO) {
        log.info(
                "Check if branch {} can be merged with branch {} for application {}",
                gitMergeDTO.getSourceBranch(),
                gitMergeDTO.getDestinationBranch(),
                branchedApplicationId);
        return centralGitService
                .isBranchMergable(branchedApplicationId, ARTIFACT_TYPE, gitMergeDTO, GIT_TYPE)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @DeleteMapping("/{baseArtifactId}/ref")
    public Mono<ResponseDTO<? extends Artifact>> deleteBranch(
            @PathVariable String baseArtifactId,
            @RequestParam String refName,
            @RequestParam(required = false, defaultValue = "branch") RefType refType) {
        log.info("Going to delete ref {} for baseApplicationId {}", refName, baseArtifactId);
        return centralGitService
                .deleteGitReference(baseArtifactId, ARTIFACT_TYPE, refName, refType, GIT_TYPE)
                .map(application -> new ResponseDTO<>(HttpStatus.OK, application));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{branchedApplicationId}/discard")
    public Mono<ResponseDTO<? extends Artifact>> discardChanges(@PathVariable String branchedApplicationId) {
        log.info("Going to discard changes for branchedApplicationId {}", branchedApplicationId);
        return centralGitService
                .discardChanges(branchedApplicationId, ARTIFACT_TYPE, GIT_TYPE)
                .map(result -> new ResponseDTO<>((HttpStatus.OK), result));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{baseArtifactId}/protected-branches")
    public Mono<ResponseDTO<List<String>>> updateProtectedBranches(
            @PathVariable String baseArtifactId,
            @RequestBody @Valid BranchProtectionRequestDTO branchProtectionRequestDTO) {
        return centralGitService
                .updateProtectedBranches(baseArtifactId, ARTIFACT_TYPE, branchProtectionRequestDTO.getBranchNames())
                .map(data -> new ResponseDTO<>(HttpStatus.OK, data));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{baseArtifactId}/protected-branches")
    public Mono<ResponseDTO<List<String>>> getProtectedBranches(@PathVariable String baseArtifactId) {
        return centralGitService
                .getProtectedBranches(baseArtifactId, ARTIFACT_TYPE)
                .map(list -> new ResponseDTO<>(HttpStatus.OK, list));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{branchedApplicationId}/auto-commit")
    public Mono<ResponseDTO<AutoCommitResponseDTO>> autoCommitApplication(@PathVariable String branchedApplicationId) {
        return autoCommitService
                .autoCommitApplication(branchedApplicationId)
                .map(data -> new ResponseDTO<>(HttpStatus.OK, data));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{baseApplicationId}/auto-commit/progress")
    public Mono<ResponseDTO<AutoCommitResponseDTO>> getAutoCommitProgress(
            @PathVariable String baseApplicationId,
            @RequestHeader(name = FieldName.BRANCH_NAME, required = false) String branchName) {
        return centralGitService
                .getAutoCommitProgress(baseApplicationId, ARTIFACT_TYPE, branchName)
                .map(data -> new ResponseDTO<>(HttpStatus.OK, data));
    }

    @JsonView(Views.Public.class)
    @PatchMapping("/{baseArtifactId}/auto-commit/toggle")
    public Mono<ResponseDTO<Boolean>> toggleAutoCommitEnabled(@PathVariable String baseArtifactId) {
        return centralGitService
                .toggleAutoCommitEnabled(baseArtifactId, ARTIFACT_TYPE)
                .map(data -> new ResponseDTO<>(HttpStatus.OK, data));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{branchedApplicationId}/refs")
    public Mono<ResponseDTO<List<GitRefDTO>>> getReferences(
            @PathVariable String branchedApplicationId,
            @RequestParam(required = false, defaultValue = "branch") RefType refType,
            @RequestParam(required = false, defaultValue = "false") Boolean pruneBranches) {
        log.debug("Going to get branch list for application {}", branchedApplicationId);
        return centralGitService
                .listBranchForArtifact(
                        branchedApplicationId, ARTIFACT_TYPE, BooleanUtils.isTrue(pruneBranches), GIT_TYPE)
                .map(result -> new ResponseDTO<>(HttpStatus.OK, result));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{branchedApplicationId}/ssh-keypair")
    public Mono<ResponseDTO<GitAuthDTO>> getSSHKey(@PathVariable String branchedApplicationId) {
        return artifactService
                .getSshKey(ARTIFACT_TYPE, branchedApplicationId)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED, created));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/{branchedApplicationId}/ssh-keypair")
    public Mono<ResponseDTO<GitAuth>> generateSSHKeyPair(
            @PathVariable String branchedApplicationId, @RequestParam(required = false) String keyType) {
        return artifactService
                .createOrUpdateSshKeyPair(ARTIFACT_TYPE, branchedApplicationId, keyType)
                .map(created -> new ResponseDTO<>(HttpStatus.CREATED, created));
    }
}
