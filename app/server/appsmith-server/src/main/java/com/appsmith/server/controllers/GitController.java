package com.appsmith.server.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.GitData;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.services.GitDataService;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    //Create a new app/repo or connect to remote calls the below method
    @GetMapping("/connect")
    public ResponseDTO<String> initializeGitRepo(@RequestBody String remoteURL) throws GitAPIException {
        gitService.cloneRepo(remoteURL);
        return new ResponseDTO<>(HttpStatus.OK.value(), new String(), "sucess");
    }

    //When a new files are created call this method
    private void addFileToGit() {

    }

    private void commitFile() {

    }

    private void showDiff() {

    }

    private void createBranch() {

    }

    private void pullLatest() {

    }

    private void pushToRemote() {

    }

}
