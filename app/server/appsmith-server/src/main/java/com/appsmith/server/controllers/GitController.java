package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.GitData;
import com.appsmith.server.domains.GitConfig;
import com.appsmith.server.dtos.GitGlobalConfigDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.GitDataService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public Mono<ResponseDTO<String>> saveGitConfigData(@RequestBody GitGlobalConfigDTO gitGlobalConfigDTO) {
        //Add to the userData object - git config data
        return gitService.saveGitConfigData(gitGlobalConfigDTO)
                .map(gitConfig -> new ResponseDTO<>(HttpStatus.OK.value(), "Success", null));

    }

    @PostMapping("/update")
    public Mono<ResponseDTO<String>> updateGitConfigData(@RequestBody GitGlobalConfigDTO gitGlobalConfigDTO) {
        //Add to the userData object - git config data
        return gitService.updateGitConfigData(gitGlobalConfigDTO)
                .map(gitConfig -> new ResponseDTO<>(HttpStatus.OK.value(), "Success", null));

    }

    @PostMapping("/connect")
    public String connectToRemoteRepo(@RequestBody GitGlobalConfigDTO gitGlobalConfigDTO) throws IOException {
        return gitService.connectToGitRepo(gitGlobalConfigDTO);
    }

}
