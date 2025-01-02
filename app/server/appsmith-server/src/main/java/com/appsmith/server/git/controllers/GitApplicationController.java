package com.appsmith.server.git.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.git.autocommit.AutoCommitService;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.utils.GitProfileUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.GIT_APPLICATION_URL)
public class GitApplicationController extends GitApplicationControllerCE {

    public GitApplicationController(
            CentralGitService centralGitService, GitProfileUtils gitProfileUtils, AutoCommitService autoCommitService) {
        super(centralGitService, gitProfileUtils, autoCommitService);
    }
}
