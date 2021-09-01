package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.GitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping(Url.GIT_URL)
public class GitController extends BaseController<GitService, UserData, String> {

    private final GitService gitService;

    @Autowired
    public GitController(GitService gitService) {
        super(gitService);
        this.gitService = gitService;
    }

    @PostMapping("/user")
    public Mono<ResponseDTO<String>> saveGitConfigData(@RequestBody GitConfig gitConfig) {
        //Add to the userData object - git config data
        return gitService.saveGitConfigData(gitConfig)
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK.value(), "Success", null));

    }

    @PostMapping("/update")
    public Mono<ResponseDTO<String>> updateGitConfigData(@RequestBody GitConfig gitConfig) {
        //update userData object - git config data
        return gitService.updateGitConfigData(gitConfig)
                .map(gitConfigResponse -> new ResponseDTO<>(HttpStatus.OK.value(), "Success", null));

    }
}
