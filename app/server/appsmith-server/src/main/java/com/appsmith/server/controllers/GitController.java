package com.appsmith.server.controllers;

import com.appsmith.external.dtos.GitLogDTO;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.dtos.GitCommitDTO;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.GitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RestController
@RequestMapping(Url.GIT_URL)
public class GitController {

    private final GitService service;

    @Autowired
    public GitController(GitService service) {
        this.service = service;
    }

    @PostMapping("/config/save")
    public Mono<ResponseDTO<String>> saveGitConfigData(@RequestBody GitConfig gitConfig) {
        //Add to the userData object - git config data
        return service.saveGitConfigData(gitConfig)
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK.value(), "Success", null));
    }

    @GetMapping("/config")
    public Mono<ResponseDTO<GitConfig>> getGitConfigForUser() {
        return service.getGitConfigForUser()
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK.value(), gitConfigResponse, null));
    }

    @PostMapping("/connect/{applicationId}")
    public Mono<ResponseDTO<Application>> connectApplicationToRemoteRepo(@PathVariable String applicationId, @RequestBody GitConnectDTO gitConnectDTO) {
        log.debug("Going to clone repo for the application {}", applicationId);
        return service.connectApplicationToGit(applicationId, gitConnectDTO)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }

    @PostMapping("/commit/{applicationId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<String>> commit(@RequestBody GitCommitDTO commitDTO, @PathVariable String applicationId) {
        log.debug("Going to commit application {}", applicationId);
        return service.commitApplication(commitDTO, applicationId)
            .map(success -> new ResponseDTO<>(HttpStatus.CREATED.value(), success, null));
    }

    @GetMapping("/commit-history/{applicationId}")
    public Mono<ResponseDTO<List<GitLogDTO>>> getCommitHistory(@PathVariable String applicationId) {
        log.debug("Fetching commit-history for application {}", applicationId);
        return service.getCommitHistory(applicationId)
            .map(success -> new ResponseDTO<>(HttpStatus.CREATED.value(), success, null));
    }

    @PostMapping("/push/{applicationId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ResponseDTO<String>> push(@PathVariable String applicationId) {
        log.debug("Going to push application {}", applicationId);
        return service.pushApplication(applicationId)
            .map(success -> new ResponseDTO<>(HttpStatus.CREATED.value(), success, null));
    }

    @PutMapping("/connect/{applicationId}/updateRemote")
    public Mono<ResponseDTO<String>> updateRemote(@PathVariable String applicationId, @RequestBody String remoteUrl) {
        log.debug("Going to update the remoteUrl for application {}", applicationId, remoteUrl);
        return service.updateRemote(applicationId, remoteUrl)
                .map(sucess -> new ResponseDTO<>(HttpStatus.OK.value(), sucess, null));
    }

    @GetMapping("/pull/{applicationId}/{branchName}")
    public Mono<ResponseDTO<String>> pull(@PathVariable String applicationId, String branchName) {
        log.debug("Going to pull the latest for branch");
        return service.pullForApplication(applicationId, branchName)
                .map(sucess -> new ResponseDTO<>(HttpStatus.OK.value(), sucess, null));
    }
}
