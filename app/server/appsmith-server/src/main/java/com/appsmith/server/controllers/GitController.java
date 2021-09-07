package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.GitService;
import io.sentry.protocol.App;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;


@Slf4j
@RestController
@RequestMapping(Url.GIT_URL)
public class GitController extends BaseController<GitService, UserData, String> {

    @Autowired
    public GitController(GitService gitService) {
        super(gitService);
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

    @PostMapping("/connect")
    public Mono<ResponseDTO<Application>> connectApplicationToRemoteRepo(@RequestBody GitConnectDTO GitConnectDTO) {
        return service.connectApplicationToGit(GitConnectDTO)
                .map(application -> new ResponseDTO<>(HttpStatus.OK.value(), application, null));
    }
}
