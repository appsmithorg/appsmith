package com.appsmith.server.git.controllers;

import com.appsmith.server.artifacts.base.ArtifactService;
import com.appsmith.server.constants.Url;
import com.appsmith.server.git.autocommit.AutoCommitService;
import com.appsmith.server.git.central.CentralGitService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.GIT_APPLICATION_URL)
public class GitApplicationController extends GitApplicationControllerCE {

    public GitApplicationController(
            CentralGitService centralGitService, AutoCommitService autoCommitService, ArtifactService artifactService) {
        super(centralGitService, autoCommitService, artifactService);
    }
}
