package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.GitData;
import com.appsmith.server.domains.GitGlobalConfig;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.GitDataService;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.jgit.lib.Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping(Url.GIT_URL)
public class GitController extends BaseController<GitDataService, GitData, String>{

    private final GitDataService gitService;

    @Autowired
    public GitController(GitDataService gitService) {
        super(gitService);
        this.gitService = gitService;
    }

    @PostMapping("/user")
    public Mono<ResponseDTO<GitGlobalConfig>> saveGitConfigData(@RequestBody GitGlobalConfigDTO gitGlobalConfigDTO) {
        //update the user field in db with git config data
        /*return gitService.saveGitConfigData(gitGlobalConfigDTO)
                .map(gitConfig -> new ResponseDTO<>(HttpStatus.OK.value(), gitConfig.getGitGlobalConfig(), null));*/
        return Mono.empty();
    }

    @PostMapping("/connect")
    public Repository connectToRemoteRepo(@RequestBody String url) throws IOException {
        return gitService.connectToGitRepo(url);
    }


}
