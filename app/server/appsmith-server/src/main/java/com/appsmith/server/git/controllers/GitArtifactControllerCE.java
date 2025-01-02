package com.appsmith.server.git.controllers;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.ApplicationImportDTO;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequestMapping(Url.GIT_ARTIFACT_URL)
@RequiredArgsConstructor
public class GitArtifactControllerCE {

    protected final CentralGitService centralGitService;
    protected final GitProfileUtils gitProfileUtils;

    protected static final GitType GIT_TYPE = GitType.FILE_SYSTEM;

    @JsonView(Views.Public.class)
    @PostMapping("/import/{workspaceId}")
    public Mono<ResponseDTO<ApplicationImportDTO>> importApplicationFromGit(
            @PathVariable String workspaceId, @RequestBody GitConnectDTO gitConnectDTO) {

        // TODO: remove artifact type from methods.
        return centralGitService
                .importArtifactFromGit(workspaceId, gitConnectDTO, ArtifactType.APPLICATION, GIT_TYPE)
                .map(artifactImportDTO -> (ApplicationImportDTO) artifactImportDTO)
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
