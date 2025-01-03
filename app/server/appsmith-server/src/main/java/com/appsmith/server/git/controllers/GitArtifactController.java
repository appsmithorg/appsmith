package com.appsmith.server.git.controllers;

import com.appsmith.server.constants.Url;
import com.appsmith.server.git.central.CentralGitService;
import com.appsmith.server.git.utils.GitProfileUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(Url.GIT_ARTIFACT_URL)
public class GitArtifactController extends GitArtifactControllerCE {

    public GitArtifactController(CentralGitService centralGitService, GitProfileUtils gitProfileUtils) {
        super(centralGitService, gitProfileUtils);
    }
}
