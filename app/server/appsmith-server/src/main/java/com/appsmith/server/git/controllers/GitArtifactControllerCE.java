package com.appsmith.server.git.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.GitProfile;
import com.appsmith.server.dtos.ArtifactImportDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.GitDeployKeyDTO;
import com.appsmith.server.dtos.GitDocsDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.central.GitType;
import com.appsmith.server.git.utils.GitProfileUtils;
import com.appsmith.server.helpers.GitDeployKeyGenerator;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Slf4j
@RequestMapping(Url.GIT_ARTIFACT_URL)
@RequiredArgsConstructor
public class GitArtifactControllerCE {

    protected final CentralGitService centralGitService;
    protected final GitProfileUtils gitProfileUtils;

    protected static final GitType GIT_TYPE = GitType.FILE_SYSTEM;

    /**
     * artifact id is the base artifact id
     * For every git connected artifact, the master branch artifact id is used as base application Id
     * This is stored in gitArtifactId
     * Note : The master branch here refers to the artifact that was created even before connecting to git
     */
    @JsonView(Views.Public.class)
    @PostMapping("/profile/default")
    public Mono<ResponseDTO<Map<String, GitProfile>>> saveGitProfile(@RequestBody GitProfile gitProfile) {
        log.debug("Going to add default git profile for user");
        return gitProfileUtils
                .updateOrCreateGitProfileForCurrentUser(gitProfile)
                .map(response -> new ResponseDTO<>(HttpStatus.OK.value(), response, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/profile/default")
    public Mono<ResponseDTO<GitProfile>> getDefaultGitConfigForUser() {
        return gitProfileUtils
                .getDefaultGitProfileOrCreateIfEmpty()
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK.value(), gitConfigResponse, null));
    }

    @JsonView(Views.Public.class)
    @PutMapping("/{baseApplicationId}/profile")
    public Mono<ResponseDTO<Map<String, GitProfile>>> saveGitProfile(
            @PathVariable String baseApplicationId, @RequestBody GitProfile gitProfile) {
        log.debug("Going to add repo specific git profile for application: {}", baseApplicationId);
        return gitProfileUtils
                .updateOrCreateGitProfileForCurrentUser(gitProfile, baseApplicationId)
                .map(response -> new ResponseDTO<>(HttpStatus.ACCEPTED.value(), response, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/{baseArtifactId}/profile")
    public Mono<ResponseDTO<GitProfile>> getGitConfigForUser(@PathVariable String baseArtifactId) {
        return gitProfileUtils
                .getGitProfileForUser(baseArtifactId)
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK.value(), gitConfigResponse, null));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/import")
    public Mono<ResponseDTO<? extends ArtifactImportDTO>> importArtifactFromGit(
            @RequestParam String workspaceId, @RequestBody GitConnectDTO gitConnectDTO) {

        // TODO: remove artifact type from methods.
        return centralGitService
                .importArtifactFromGit(workspaceId, gitConnectDTO, GIT_TYPE)
                .map(result -> new ResponseDTO<>(HttpStatus.CREATED.value(), result, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/doc-urls")
    public Mono<ResponseDTO<List<GitDocsDTO>>> getGitDocs() {
        return centralGitService
                .getGitDocUrls()
                .map(gitDocDTO -> new ResponseDTO<>(HttpStatus.OK.value(), gitDocDTO, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/protocol/key-types")
    public Mono<ResponseDTO<List<GitDeployKeyDTO>>> getSupportedKeys() {
        log.info("Going to list the list of supported keys");
        return Mono.just(GitDeployKeyGenerator.getSupportedProtocols())
                .map(gitDeployKeyDTOS -> new ResponseDTO<>(HttpStatus.OK.value(), gitDeployKeyDTOS, null));
    }

    @JsonView(Views.Public.class)
    @GetMapping("/import/keys")
    public Mono<ResponseDTO<GitAuth>> generateKeyForGitImport(@RequestParam(required = false) String keyType) {
        return centralGitService
                .generateSSHKey(keyType)
                .map(result -> new ResponseDTO<>(HttpStatus.OK.value(), result, null));
    }
}
